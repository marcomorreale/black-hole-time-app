const fs = require('fs');
const path = require('path');

const root = process.cwd();
const write = (filePath, content) => fs.writeFileSync(path.join(root, filePath), content, 'utf8');

write('src/logic/mission.ts', String.raw`import { Station, stationById } from '../data/stations';
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
    { title: 'Controllo: viaggio interstellare senza buco nero', route: ['earth', 'proxima', 'earth'], note: 'Serve per misurare la differenza causata dalla sola velocita a 0,5c.' },
    { title: 'Campo debole', route: ['earth', 'station-a', 'earth'], note: 'Passaggio nella Stazione A: campo debole, 10 Rs.' },
    { title: 'Campo forte', route: ['earth', 'station-b', 'earth'], note: 'Passaggio nella Stazione B: campo forte, 2 Rs.' },
    { title: 'Zona critica', route: ['earth', 'station-c', 'earth'], note: 'Passaggio nella Stazione C: zona critica, 1,5 Rs.' },
    { title: 'Quasi orizzonte', route: ['earth', 'station-d', 'earth'], note: 'Passaggio nella Stazione D: effetto estremo, 1,2 Rs.' },
    { title: 'Viaggio interstellare + buco nero', route: ['earth', 'proxima', 'station-c', 'earth'], note: 'Confronta Proxima con un passaggio nella zona critica del buco nero.' }
  ];
}
`);

write('src/App.tsx', String.raw`import { RotateCcw, Rocket, ScanLine, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { stations } from './data/stations';
import { calculateMission, getSuggestedRoutes, RouteVisit, STAY_YEARS_PER_REAL_SECOND } from './logic/mission';
import { FIXED_BETA, formatDistance, formatYears } from './logic/relativity';

const DEFAULT_AGE = 13;

export default function App() {
  const [initialAge, setInitialAge] = useState(DEFAULT_AGE);
  const [routeVisits, setRouteVisits] = useState<RouteVisit[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const result = useMemo(() => calculateMission(routeVisits, undefined, nowMs), [routeVisits, nowMs]);
  const suggestedRoutes = useMemo(() => getSuggestedRoutes(), []);

  const addStation = (stationId: string) => {
    setRouteVisits((current) => [...current, { stationId, arrivedAtMs: Date.now() }]);
  };

  const applyRoute = (route: string[]) => {
    const start = Date.now();
    setRouteVisits(route.map((stationId, index) => ({ stationId, arrivedAtMs: start + index * 1000 })));
  };

  const reset = () => setRouteVisits([]);

  const earthFinalAge = initialAge + result.earthElapsedYears;
  const travelerFinalAge = initialAge + result.travelerElapsedYears;
  const influencePercent = Math.round(result.blackHoleInfluence * 100);
  const currentStationDistance = result.currentStation?.distanceFromEarthLightYears;

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Cruscotto didattico</p>
          <h1>Il tempo e il buco nero</h1>
          <p className="hero-text">
            Parti dalla Terra, scansiona le stazioni della mappa e torna alla Terra. L'app confronta
            quanto tempo passa sulla Terra e quanto tempo passa per il viaggiatore, mostrando l'impatto del buco nero.
          </p>
        </div>
        <div className="mission-speed">
          <Rocket size={30} />
          <span>Velocita missione</span>
          <strong>{FIXED_BETA.toLocaleString('it-IT')}c</strong>
          <small>costante per isolare l'effetto del buco nero</small>
        </div>
      </section>

      <section className="panel controls-panel">
        <div>
          <label htmlFor="age">Eta iniziale del viaggiatore</label>
          <div className="age-row">
            <input id="age" type="number" min="1" max="120" value={initialAge} onChange={(event) => setInitialAge(Number(event.target.value))} />
            <span>anni</span>
          </div>
        </div>
        <button className="secondary-button" onClick={reset} type="button"><RotateCcw size={18} />Ricomincia</button>
      </section>

      <section className="dashboard-grid">
        <div className="panel dashboard-card">
          <div className="section-title"><Sparkles size={20} /><h2>Cruscotto astronave</h2></div>
          <div className="station-current">
            <span>Stazione attuale</span>
            <div className="station-title-row">
              <strong>{result.currentStation?.name ?? 'Nessuna stazione scansionata'}</strong>
              {currentStationDistance !== undefined && <em>{formatDistance(currentStationDistance)} dalla Terra</em>}
            </div>
          </div>
          <div className="gauge-card">
            <div className="gauge-topline"><span>Influenza buco nero</span><strong>{influencePercent}%</strong></div>
            <div className="gauge-track"><div className="gauge-fill" style={{ width: `${influencePercent}%` }} /></div>
            <p>{result.blackHoleInfluenceLabel}</p>
            {result.closestBlackHoleZone && <small>Distanza minima raggiunta: {result.closestBlackHoleZone.schwarzschildDistance} Rs</small>}
          </div>
          <div className="metrics-grid">
            <Metric label="Distanza cosmica" value={formatDistance(result.cosmicDistanceLightYears)} />
            <Metric label="Distanza sulla mappa" value={`${result.physicalDistanceMeters.toLocaleString('it-IT', { maximumFractionDigits: 1 })} m`} />
            <Metric label="Velocita media" value="0,5c" />
            <Metric label="Fattore totale" value={`${result.totalFactor.toLocaleString('it-IT', { maximumFractionDigits: 3 })}x`} />
            <Metric label="Scala permanenza" value={`1 sec = ${STAY_YEARS_PER_REAL_SECOND} anno Terra`} />
            <Metric label="Permanenza attuale" value={`${result.activeStayRealSeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })} sec = ${formatYears(result.activeStayEarthYears)}`} />
            <Metric label="Tempo sulla Terra" value={formatYears(result.earthElapsedYears)} />
            <Metric label="Tempo per te" value={formatYears(result.travelerElapsedYears)} />
            <Metric label="Eta finale gemello sulla Terra" value={formatYears(earthFinalAge)} />
            <Metric label="Eta finale viaggiatore" value={formatYears(travelerFinalAge)} />
          </div>
        </div>

        <div className="panel map-card">
          <div className="section-title"><ScanLine size={20} /><h2>Mappa e stazioni</h2></div>
          <div className="map-area" aria-label="Mappa 2D delle stazioni">
            <div className="black-hole-field-center" aria-hidden="true">
              <div className="black-hole-sector field-weak"><span>Campo debole</span></div>
              <div className="black-hole-sector field-strong"><span>Campo forte</span></div>
              <div className="black-hole-sector field-critical"><span>Zona critica</span></div>
              <div className="black-hole-sector field-horizon"><span>Quasi orizzonte</span></div>
            </div>
            {stations.map((station) => (
              <button key={station.id} type="button" className={`map-node ${station.kind} ${routeVisits.some((visit) => visit.stationId === station.id) ? 'visited' : ''}`} style={{ left: `${7 + station.x * 7.8}%`, top: `${8 + (3 - station.y) * 11.5}%`, width: `${station.massLogSize}px`, height: `${station.massLogSize}px` }} onClick={() => addStation(station.id)} title={station.description}>
                <span className="planet-dot" aria-hidden="true" />
                <span className="planet-label">{station.shortName}</span>
              </button>
            ))}
          </div>
          <p className="hint">Mappa in scala logaritmica semplificata. Le lettere A, B, C, D sono stazioni di passaggio dentro i settori del campo gravitazionale. Il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra.</p>
        </div>
      </section>

      <section className="panel route-panel">
        <h2>Percorso scansionato</h2>
        {result.route.length === 0 ? <p className="muted">Scansiona Terra per partire, poi visita una o piu stazioni e torna alla Terra.</p> : (
          <div className="route-chain">
            {result.route.map((station, index) => {
              const visit = result.visits[index];
              const nextVisit = result.visits[index + 1];
              const staySeconds = visit && nextVisit ? Math.max(0, (nextVisit.arrivedAtMs - visit.arrivedAtMs) / 1000) : 0;
              return <span key={`${station.id}-${index}`}>{station.shortName}{staySeconds > 0 && <small>{staySeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })}s</small>}</span>;
            })}
          </div>
        )}
      </section>

      {result.isComplete && (
        <section className="panel result-card">
          <h2>Missione completata</h2>
          <div className="result-main">
            <div><span>Eta di chi resta sulla Terra</span><strong>{formatYears(earthFinalAge)}</strong></div>
            <div><span>Eta del viaggiatore al ritorno</span><strong>{formatYears(travelerFinalAge)}</strong></div>
            <div className="difference-box"><span>Il viaggiatore torna piu giovane di</span><strong>{formatYears(result.ageDifferenceYears)}</strong></div>
          </div>
          <div className="explanation-box">
            <h3>Cosa ha causato la differenza?</h3>
            <p>Effetto della velocita senza buco nero: <strong>{formatYears(result.baselineAgeDifferenceYears)}</strong>.</p>
            <p>Tempo di viaggio sulla Terra: <strong>{formatYears(result.travelEarthYears)}</strong>; tempo di permanenza sulla Terra: <strong>{formatYears(result.stayEarthYears)}</strong>.</p>
            <p>Effetto aggiuntivo del buco nero: <strong>{formatYears(result.blackHoleExtraDifferenceYears)}</strong>.</p>
            <p className="muted">La velocita e sempre 0,5c. La permanenza in una stazione vale 1 anno terrestre per ogni secondo reale passato prima del click successivo.</p>
          </div>
        </section>
      )}

      <section className="panel suggestions-panel">
        <h2>Prove consigliate</h2>
        <div className="suggestions-grid">
          {suggestedRoutes.map((suggestion) => <button key={suggestion.title} type="button" className="suggestion-card" onClick={() => applyRoute(suggestion.route)}><strong>{suggestion.title}</strong><span>{suggestion.route.join(' -> ')}</span><small>{suggestion.note}</small></button>)}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric-card"><span>{label}</span><strong>{value}</strong></div>;
}
`);

let css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
if (!css.includes('STAY_TIME_MODE_UI')) {
  css += String.raw`

/* STAY_TIME_MODE_UI */
.route-chain span { display: inline-flex; align-items: center; gap: 6px; }
.route-chain small { color: #facc15; font-size: 0.72rem; font-weight: 800; }
`;
}
write('src/styles.css', css);
console.log('Stay time mode v3 applied.');
