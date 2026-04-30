const fs = require('fs');
const path = require('path');

const root = process.cwd();

function write(filePath, content) {
  fs.writeFileSync(path.join(root, filePath), content, 'utf8');
}

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

write('src/data/stations.ts', `export type StationKind = 'earth' | 'real-destination' | 'black-hole-zone' | 'info' | 'black-hole';

export type Station = {
  id: string;
  name: string;
  shortName: string;
  kind: StationKind;
  x: number;
  y: number;
  distanceFromEarthLightYears?: number;
  schwarzschildDistance?: number;
  fieldLabel?: string;
  description: string;
};

export const stations: Station[] = [
  {
    id: 'earth',
    name: 'Terra',
    shortName: 'Terra',
    kind: 'earth',
    x: 0,
    y: 0,
    distanceFromEarthLightYears: 0,
    description: 'Punto di partenza e ritorno della missione.'
  },
  {
    id: 'moon',
    name: 'Luna',
    shortName: 'Luna',
    kind: 'real-destination',
    x: 1,
    y: 2,
    distanceFromEarthLightYears: 0.0000000406,
    description: 'Il nostro satellite naturale. Su questa scala l effetto relativistico e quasi nullo.'
  },
  {
    id: 'pluto',
    name: 'Plutone',
    shortName: 'Plutone',
    kind: 'real-destination',
    x: 3.2,
    y: 0,
    distanceFromEarthLightYears: 0.000623,
    description: 'Destinazione ai confini del Sistema Solare.'
  },
  {
    id: 'proxima',
    name: 'Proxima Centauri',
    shortName: 'Proxima',
    kind: 'real-destination',
    x: 6.2,
    y: 1,
    distanceFromEarthLightYears: 4.25,
    description: 'La stella piu vicina al Sole. E la destinazione principale del viaggio interstellare.'
  },
  {
    id: 'sagittarius-a',
    name: 'Sagittarius A*',
    shortName: 'Sgr A*',
    kind: 'info',
    x: 10,
    y: 3,
    distanceFromEarthLightYears: 26000,
    description: 'Buco nero supermassiccio reale al centro della Via Lattea. Troppo lontano per la missione.'
  },
  {
    id: 'station-a',
    name: 'Stazione A',
    shortName: 'A',
    kind: 'black-hole-zone',
    x: 6.6,
    y: 0.5,
    distanceFromEarthLightYears: 4.0,
    schwarzschildDistance: 10,
    fieldLabel: 'Campo debole',
    description: 'Punto di passaggio nel campo debole del buco nero didattico.'
  },
  {
    id: 'station-b',
    name: 'Stazione B',
    shortName: 'B',
    kind: 'black-hole-zone',
    x: 7.0,
    y: 0,
    distanceFromEarthLightYears: 4.2,
    schwarzschildDistance: 2,
    fieldLabel: 'Campo forte',
    description: 'Punto di passaggio nel campo forte del buco nero didattico.'
  },
  {
    id: 'station-c',
    name: 'Stazione C',
    shortName: 'C',
    kind: 'black-hole-zone',
    x: 7.35,
    y: -0.6,
    distanceFromEarthLightYears: 4.25,
    schwarzschildDistance: 1.5,
    fieldLabel: 'Zona critica',
    description: 'Punto di passaggio nella zona critica vicino all orizzonte degli eventi.'
  },
  {
    id: 'station-d',
    name: 'Stazione D',
    shortName: 'D',
    kind: 'black-hole-zone',
    x: 7.7,
    y: -1.2,
    distanceFromEarthLightYears: 4.3,
    schwarzschildDistance: 1.2,
    fieldLabel: 'Quasi orizzonte',
    description: 'Punto di passaggio vicino al quasi orizzonte.'
  },
  {
    id: 'teaching-black-hole',
    name: 'Buco nero didattico',
    shortName: 'Buco nero',
    kind: 'black-hole',
    x: 8.1,
    y: -1.8,
    distanceFromEarthLightYears: 4.31,
    schwarzschildDistance: 1,
    description: 'Oggetto simulato usato per visualizzare l effetto estremo della gravita sul tempo.'
  }
];

export const stationById = new Map(stations.map((station) => [station.id, station]));
`);

write('src/logic/mission.ts', `import { Station, stationById } from '../data/stations';
import {
  FIXED_BETA,
  VELOCITY_FACTOR,
  getBlackHoleInfluence,
  getGravityFactor,
  getInfluenceLabel
} from './relativity';

export type MissionResult = {
  isComplete: boolean;
  route: Station[];
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
  earthElapsedYears: number;
  travelerElapsedYears: number;
  ageDifferenceYears: number;
  baselineTravelerElapsedYears: number;
  baselineAgeDifferenceYears: number;
  blackHoleExtraDifferenceYears: number;
};

export function calculateMission(routeIds: string[], beta = FIXED_BETA): MissionResult {
  const route = routeIds
    .map((id) => stationById.get(id))
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
  const earthElapsedYears = cosmicDistanceLightYears / beta;
  const velocityFactor = Math.sqrt(1 - beta * beta);
  const gravityFactor = getGravityFactor(closestBlackHoleZone?.schwarzschildDistance);
  const totalFactor = velocityFactor * gravityFactor;
  const travelerElapsedYears = earthElapsedYears * totalFactor;
  const ageDifferenceYears = earthElapsedYears - travelerElapsedYears;

  const baselineTravelerElapsedYears = earthElapsedYears * velocityFactor;
  const baselineAgeDifferenceYears = earthElapsedYears - baselineTravelerElapsedYears;
  const blackHoleExtraDifferenceYears = Math.max(0, ageDifferenceYears - baselineAgeDifferenceYears);
  const blackHoleInfluence = getBlackHoleInfluence(gravityFactor);

  return {
    isComplete,
    route,
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
    earthElapsedYears,
    travelerElapsedYears,
    ageDifferenceYears,
    baselineTravelerElapsedYears,
    baselineAgeDifferenceYears,
    blackHoleExtraDifferenceYears
  };
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

let app = read('src/App.tsx');
app = app.replace(/\['einstein-beacon'\]/g, "['station-a']");
app = app.replace(/einstein-beacon/g, 'station-a');
app = app.replace(/accretion-disk/g, 'station-b');
app = app.replace(/horizon-margin/g, 'station-c');
app = app.replace(/near-horizon/g, 'station-d');
app = app.replace(/Chi torna piu giovane\?/g, 'Il tempo e il buco nero');
app = app.replace(/Chi torna più giovane\?/g, 'Il tempo e il buco nero');
app = app.replace(/Il buco nero e il tempo/g, 'Il tempo e il buco nero');
app = app.replace(/left: `\$\{station\.x \* 9\}%`/g, 'left: `${7 + station.x * 7.8}%`');
app = app.replace(/top: `\$\{\(3 - station\.y\) \* 13\}%`/g, 'top: `${8 + (3 - station.y) * 11.5}%`');
if (!app.includes('const currentStationDistance')) {
  app = app.replace(
    'const influencePercent = Math.round(result.blackHoleInfluence * 100);',
    'const influencePercent = Math.round(result.blackHoleInfluence * 100);\n  const currentStationDistance = result.currentStation?.distanceFromEarthLightYears;'
  );
}
if (!app.includes('station-title-row')) {
  app = app.replace(
    "<strong>{result.currentStation?.name ?? 'Nessuna stazione scansionata'}</strong>",
    "<div className=\"station-title-row\">\n              <strong>{result.currentStation?.name ?? 'Nessuna stazione scansionata'}</strong>\n              {currentStationDistance !== undefined && (\n                <em>{formatDistance(currentStationDistance)} dalla Terra</em>\n              )}\n            </div>"
  );
}
if (!app.includes('black-hole-sector field-weak')) {
  app = app.replace(
    '<div className="map-area" aria-label="Mappa 2D delle stazioni">',
    `<div className="map-area" aria-label="Mappa 2D delle stazioni">
            <div className="black-hole-sector field-weak"><span>Campo debole</span></div>
            <div className="black-hole-sector field-strong"><span>Campo forte</span></div>
            <div className="black-hole-sector field-critical"><span>Zona critica</span></div>
            <div className="black-hole-sector field-horizon"><span>Quasi orizzonte</span></div>`
  );
}
app = app.replace(
  /Mappa in scala logaritmica[^<]+QR\./g,
  'Mappa in scala logaritmica semplificata. Le lettere A, B, C, D sono stazioni di passaggio dentro i settori del campo gravitazionale del buco nero. Cliccare una stazione equivale a scansionare il suo QR.'
);
write('src/App.tsx', app);

let css = read('src/styles.css');
if (!css.includes('BLACK_HOLE_SECTORS_UI')) {
  css += `

/* BLACK_HOLE_SECTORS_UI */
.dashboard-grid { grid-template-columns: 1fr !important; }
.dashboard-card, .map-card { width: 100%; }
.map-area { width: 100%; min-height: 560px !important; overflow: hidden; }
.map-node { white-space: nowrap; z-index: 4; }
.station-title-row { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.station-title-row em { color: #7dd3fc; font-style: normal; font-size: 0.95rem; font-weight: 700; }
.black-hole-sector {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(251, 146, 60, 0.42);
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  color: #fed7aa;
  font-size: 0.78rem;
  font-weight: 800;
  padding-top: 10px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.04), rgba(249, 115, 22, 0.015), transparent 70%);
  z-index: 1;
}
.black-hole-sector span {
  background: rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(251, 146, 60, 0.2);
  border-radius: 999px;
  padding: 4px 8px;
}
.field-weak { width: 330px; height: 330px; left: 60%; top: 34%; }
.field-strong { width: 245px; height: 245px; left: 65%; top: 42%; }
.field-critical { width: 165px; height: 165px; left: 70%; top: 50%; }
.field-horizon { width: 96px; height: 96px; left: 74%; top: 58%; }
.map-node.black-hole { z-index: 5; }
@media (max-width: 520px) {
  .map-area { min-height: 460px !important; }
  .map-node { min-width: 58px; font-size: 0.72rem; padding: 8px 9px; }
  .black-hole-sector { font-size: 0.66rem; }
  .field-weak { width: 240px; height: 240px; left: 50%; top: 38%; }
  .field-strong { width: 180px; height: 180px; left: 58%; top: 47%; }
  .field-critical { width: 122px; height: 122px; left: 66%; top: 56%; }
  .field-horizon { width: 76px; height: 76px; left: 72%; top: 64%; }
}
`;
}
write('src/styles.css', css);

let html = read('index.html');
html = html.replace(/Chi torna piu giovane\?/g, 'Il tempo e il buco nero');
html = html.replace(/Chi torna più giovane\?/g, 'Il tempo e il buco nero');
html = html.replace(/Il buco nero e il tempo/g, 'Il tempo e il buco nero');
write('index.html', html);

let manifest = read('public/manifest.webmanifest');
manifest = manifest.replace(/Black Hole Time App/g, 'Il tempo e il buco nero');
manifest = manifest.replace(/Il buco nero e il tempo/g, 'Il tempo e il buco nero');
manifest = manifest.replace(/Black Hole/g, 'Buco Nero');
write('public/manifest.webmanifest', manifest);

console.log('Black hole sectors applied.');
