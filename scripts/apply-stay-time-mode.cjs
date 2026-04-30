const fs = require('fs');
const path = require('path');

const root = process.cwd();
const write = (filePath, content) => fs.writeFileSync(path.join(root, filePath), content, 'utf8');

write('src/logic/mission.ts', `import { Station, stationById } from '../data/stations';
import {
  FIXED_BETA,
  VELOCITY_FACTOR,
  getBlackHoleInfluence,
  getGravityFactor,
  getInfluenceLabel
} from './relativity';

export const STAY_YEARS_PER_REAL_SECOND = 1;

export type RouteVisit = {
  stationId: string;
  arrivedAtMs: number;
};

export type StaySegment = {
  station: Station;
  realSeconds: number;
  earthYears: number;
  travelerYears: number;
  gravityFactor: number;
};

export type MissionResult = {
  isComplete: boolean;
  route: Station[];
  visits: RouteVisit[];
  currentStation?: Station;
  mainDestination?: Station;
  closestBlackHoleZone?: Station;
  cosmicDistanceLightYears: number;
  physicalDistanceMeters: number;
  beta: number;
  velocityFactor: number;
  gravityFactor: number;
  totalFactor: number;
  blackHoleInfluence: number;
  blackHoleInfluenceLabel: string;
  travelEarthYears: number;
  travelTravelerYears: number;
  stayEarthYears: number;
  stayTravelerYears: number;
  earthElapsedYears: number;
  travelerElapsedYears: number;
  ageDifferenceYears: number;
  baselineTravelerElapsedYears: number;
  baselineAgeDifferenceYears: number;
  blackHoleExtraDifferenceYears: number;
  staySegments: StaySegment[];
  activeStayRealSeconds: number;
  activeStayEarthYears: number;
};

export function calculateMission(input: string[] | RouteVisit[], beta = FIXED_BETA, nowMs = Date.now()): MissionResult {
  const visits = normalizeVisits(input);
  const route = visits
    .map((visit) => stationById.get(visit.stationId))
    .filter((station): station is Station => Boolean(station));

  const currentStation = route.at(-1);
  const isComplete = route.length >= 3 && route[0]?.id === 'earth' && currentStation?.id === 'earth';

  const mainDestination = route.reduce<Station | undefined>((best, station) => {
    if (station.distanceFromEarthLightYears === undefined) return best;
    if (!best) return station;
    return (station.distanceFromEarthLightYears ?? 0) > (best.distanceFromEarthLightYears ?? 0) ? station : best;
  }, undefined);

  const blackHoleZones = route.filter(
    (station) => station.kind === 'black-hole-zone' && station.schwarzschildDistance
  );
  const closestBlackHoleZone = blackHoleZones.reduce<Station | undefined>((closest, station) => {
    if (!closest) return station;
    return (station.schwarzschildDistance ?? Infinity) < (closest.schwarzschildDistance ?? Infinity)
      ? station
      : closest;
  }, undefined);

  const cosmicDistanceLightYears = getCumulativeCosmicDistanceLightYears(route);
  const travelEarthYears = cosmicDistanceLightYears / beta;
  const velocityFactor = Math.sqrt(1 - beta * beta);
  const gravityFactor = getGravityFactor(closestBlackHoleZone?.schwarzschildDistance);
  const totalFactor = velocityFactor * gravityFactor;
  const travelTravelerYears = travelEarthYears * totalFactor;

  const staySegments = getStaySegments(visits);
  const stayEarthYears = staySegments.reduce((sum, segment) => sum + segment.earthYears, 0);
  const stayTravelerYears = staySegments.reduce((sum, segment) => sum + segment.travelerYears, 0);

  const activeStayRealSeconds = getActiveStayRealSeconds(visits, nowMs);
  const activeStayEarthYears = activeStayRealSeconds * STAY_YEARS_PER_REAL_SECOND;

  const earthElapsedYears = travelEarthYears + stayEarthYears;
  const travelerElapsedYears = travelTravelerYears + stayTravelerYears;
  const ageDifferenceYears = earthElapsedYears - travelerElapsedYears;

  const baselineTravelerElapsedYears = travelEarthYears * velocityFactor + stayEarthYears;
  const baselineAgeDifferenceYears = earthElapsedYears - baselineTravelerElapsedYears;
  const blackHoleExtraDifferenceYears = Math.max(0, ageDifferenceYears - baselineAgeDifferenceYears);
  const blackHoleInfluence = getBlackHoleInfluence(gravityFactor);

  return {
    isComplete,
    route,
    visits,
    currentStation,
    mainDestination,
    closestBlackHoleZone,
    cosmicDistanceLightYears,
    physicalDistanceMeters: getPhysicalDistanceMeters(route),
    beta,
    velocityFactor: beta === FIXED_BETA ? VELOCITY_FACTOR : velocityFactor,
    gravityFactor,
    totalFactor,
    blackHoleInfluence,
    blackHoleInfluenceLabel: getInfluenceLabel(blackHoleInfluence),
    travelEarthYears,
    travelTravelerYears,
    stayEarthYears,
    stayTravelerYears,
    earthElapsedYears,
    travelerElapsedYears,
    ageDifferenceYears,
    baselineTravelerElapsedYears,
    baselineAgeDifferenceYears,
    blackHoleExtraDifferenceYears,
    staySegments,
    activeStayRealSeconds,
    activeStayEarthYears
  };
}

function normalizeVisits(input: string[] | RouteVisit[]): RouteVisit[] {
  if (input.length === 0) return [];
  if (typeof input[0] === 'string') {
    return (input as string[]).map((stationId, index) => ({ stationId, arrivedAtMs: index }));
  }
  return input as RouteVisit[];
}

function getStationEarthDistance(station: Station): number {
  return station.distanceFromEarthLightYears ?? 0;
}

function getCumulativeCosmicDistanceLightYears(route: Station[]): number {
  let total = 0;
  for (let index = 1; index < route.length; index += 1) {
    const previous = getStationEarthDistance(route[index - 1]);
    const current = getStationEarthDistance(route[index]);
    total += Math.abs(current - previous);
  }
  return total;
}

function getStaySegments(visits: RouteVisit[]): StaySegment[] {
  const segments: StaySegment[] = [];
  for (let index = 0; index < visits.length - 1; index += 1) {
    const station = stationById.get(visits[index].stationId);
    if (!station) continue;
    const realSeconds = Math.max(0, (visits[index + 1].arrivedAtMs - visits[index].arrivedAtMs) / 1000);
    const earthYears = realSeconds * STAY_YEARS_PER_REAL_SECOND;
    const gravityFactor = getGravityFactor(station.schwarzschildDistance);
    const travelerYears = earthYears * gravityFactor;
    segments.push({ station, realSeconds, earthYears, travelerYears, gravityFactor });
  }
  return segments;
}

function getActiveStayRealSeconds(visits: RouteVisit[], nowMs: number): number {
  const lastVisit = visits.at(-1);
  if (!lastVisit) return 0;
  return Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);
}

export function getPhysicalDistanceMeters(route: Station[]): number {
  let total = 0;
  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const current = route[index];
    total += Math.sqrt((current.x - previous.x) ** 2 + (current.y - previous.y) ** 2);
  }
  return total;
}

export function getSuggestedRoutes(): Array<{ title: string; route: string[]; note: string }> {
  return [
    {
      title: 'Controllo: viaggio interstellare senza buco nero',
      route: ['earth', 'proxima', 'earth'],
      note: 'Serve per misurare la differenza causata dalla sola velocita a 0,5c.'
    },
    {
      title: 'Campo debole',
      route: ['earth', 'station-a', 'earth'],
      note: 'Passaggio nella Stazione A: campo debole, 10 Rs.'
    },
    {
      title: 'Campo forte',
      route: ['earth', 'station-b', 'earth'],
      note: 'Passaggio nella Stazione B: campo forte, 2 Rs.'
    },
    {
      title: 'Zona critica',
      route: ['earth', 'station-c', 'earth'],
      note: 'Passaggio nella Stazione C: zona critica, 1,5 Rs.'
    },
    {
      title: 'Quasi orizzonte',
      route: ['earth', 'station-d', 'earth'],
      note: 'Passaggio nella Stazione D: effetto estremo, 1,2 Rs.'
    },
    {
      title: 'Viaggio interstellare + buco nero',
      route: ['earth', 'proxima', 'station-c', 'earth'],
      note: 'Confronta Proxima con un passaggio nella zona critica del buco nero.'
    }
  ];
}
`);

let app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
app = app.replace("import { useMemo, useState } from 'react';", "import { useEffect, useMemo, useState } from 'react';");
app = app.replace("import { calculateMission, getSuggestedRoutes } from './logic/mission';", "import { calculateMission, getSuggestedRoutes, STAY_YEARS_PER_REAL_SECOND, RouteVisit } from './logic/mission';");
app = app.replace("const [routeIds, setRouteIds] = useState<string[]>([]);", "const [routeVisits, setRouteVisits] = useState<RouteVisit[]>([]);\n  const [nowMs, setNowMs] = useState(Date.now());");
app = app.replace("const result = useMemo(() => calculateMission(routeIds), [routeIds]);", "useEffect(() => {\n    const timer = window.setInterval(() => setNowMs(Date.now()), 250);\n    return () => window.clearInterval(timer);\n  }, []);\n\n  const result = useMemo(() => calculateMission(routeVisits, undefined, nowMs), [routeVisits, nowMs]);");
app = app.replace("setRouteIds((current) => [...current, stationId]);", "setRouteVisits((current) => [...current, { stationId, arrivedAtMs: Date.now() }]);");
app = app.replace("setRouteIds(route);", "setRouteVisits(route.map((stationId, index) => ({ stationId, arrivedAtMs: Date.now() + index }))); ");
app = app.replace("const reset = () => setRouteIds([]);", "const reset = () => setRouteVisits([]);");
app = app.replace(/routeIds\.includes\(station\.id\)/g, "routeVisits.some((visit) => visit.stationId === station.id)");
app = app.replace("{FIXED_BETA.toLocaleString('it-IT')}c", "{FIXED_BETA.toLocaleString('it-IT')}c");
app = app.replace(
  `<Metric label="Tempo sulla Terra" value={formatYears(result.earthElapsedYears)} />
            <Metric label="Tempo per te" value={formatYears(result.travelerElapsedYears)} />`,
  `<Metric label="Tempo sulla Terra" value={formatYears(result.earthElapsedYears)} />
            <Metric label="Tempo per te" value={formatYears(result.travelerElapsedYears)} />
            <Metric label="Eta finale gemello sulla Terra" value={formatYears(earthFinalAge)} />
            <Metric label="Eta finale viaggiatore" value={formatYears(travelerFinalAge)} />`
);
app = app.replace(
  `<Metric label="Fattore totale" value={\`${result.totalFactor.toLocaleString('it-IT', { maximumFractionDigits: 3 })}x\`} />`,
  `<Metric label="Fattore totale" value={\`${result.totalFactor.toLocaleString('it-IT', { maximumFractionDigits: 3 })}x\`} />
            <Metric label="Scala permanenza" value={\`1 sec = ${STAY_YEARS_PER_REAL_SECOND} anno Terra\`} />
            <Metric label="Permanenza attuale" value={\`${result.activeStayRealSeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })} sec = ${formatYears(result.activeStayEarthYears)}\`} />`
);
app = app.replace(
  `{result.route.map((station, index) => (
              <span key={\`${station.id}-${index}\`}>{station.shortName}</span>
            ))}`,
  `{result.route.map((station, index) => {
              const nextVisit = result.visits[index + 1];
              const visit = result.visits[index];
              const staySeconds = nextVisit && visit ? Math.max(0, (nextVisit.arrivedAtMs - visit.arrivedAtMs) / 1000) : 0;
              return (
                <span key={\`${station.id}-${index}\`}>
                  {station.shortName}
                  {staySeconds > 0 && <small>{staySeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })}s</small>}
                </span>
              );
            })}`
);
app = app.replace(
  `<p>
              Effetto della velocita senza buco nero: <strong>{formatYears(result.baselineAgeDifferenceYears)}</strong>.
            </p>
            <p>
              Effetto aggiuntivo del buco nero: <strong>{formatYears(result.blackHoleExtraDifferenceYears)}</strong>.
            </p>`,
  `<p>
              Effetto della velocita senza buco nero: <strong>{formatYears(result.baselineAgeDifferenceYears)}</strong>.
            </p>
            <p>
              Tempo di viaggio sulla Terra: <strong>{formatYears(result.travelEarthYears)}</strong>; tempo di permanenza sulla Terra: <strong>{formatYears(result.stayEarthYears)}</strong>.
            </p>
            <p>
              Effetto aggiuntivo del buco nero: <strong>{formatYears(result.blackHoleExtraDifferenceYears)}</strong>.
            </p>`
);
app = app.replace(
  /Mappa in scala logaritmica[^<]+QR\./g,
  `Mappa in scala logaritmica semplificata. Le lettere A, B, C, D sono stazioni di passaggio dentro i settori del campo gravitazionale. Il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra.`
);
fs.writeFileSync(path.join(root, 'src/App.tsx'), app, 'utf8');

let css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
if (!css.includes('STAY_TIME_MODE_UI')) {
  css += `

/* STAY_TIME_MODE_UI */
.route-chain span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.route-chain small {
  color: #facc15;
  font-size: 0.72rem;
  font-weight: 800;
}
`;
}
fs.writeFileSync(path.join(root, 'src/styles.css'), css, 'utf8');

console.log('Stay time mode applied.');
