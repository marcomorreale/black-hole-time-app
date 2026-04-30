const fs = require('fs');
const path = require('path');

const root = process.cwd();
const finalTitle = 'Il tempo e il buco nero';

function write(filePath, content) {
  fs.writeFileSync(path.join(root, filePath), content, 'utf8');
}

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

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
      title: 'Laboratorio buco nero: margine diretto',
      route: ['earth', 'horizon-margin', 'earth'],
      note: 'Mostra subito l effetto del buco nero didattico.'
    },
    {
      title: 'Buco nero forte: disco di accrescimento',
      route: ['earth', 'proxima', 'accretion-disk', 'earth'],
      note: 'Evidenzia un effetto forte ma ancora gestibile.'
    },
    {
      title: 'Zona critica: margine dell orizzonte',
      route: ['earth', 'proxima', 'horizon-margin', 'earth'],
      note: 'La demo principale per mostrare chiaramente l impatto del buco nero.'
    }
  ];
}
`);

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
    id: 'einstein-beacon',
    name: 'Faro Einstein',
    shortName: 'Faro',
    kind: 'black-hole-zone',
    x: 6.6,
    y: 0.5,
    distanceFromEarthLightYears: 4.0,
    schwarzschildDistance: 10,
    description: 'Ingresso nella regione del buco nero didattico. Campo gravitazionale debole.'
  },
  {
    id: 'accretion-disk',
    name: 'Disco di accrescimento',
    shortName: 'Disco',
    kind: 'black-hole-zone',
    x: 7.0,
    y: 0,
    distanceFromEarthLightYears: 4.2,
    schwarzschildDistance: 2,
    description: 'Zona di campo gravitazionale forte.'
  },
  {
    id: 'horizon-margin',
    name: 'Margine dell orizzonte',
    shortName: 'Margine',
    kind: 'black-hole-zone',
    x: 7.35,
    y: -0.6,
    distanceFromEarthLightYears: 4.25,
    schwarzschildDistance: 1.5,
    description: 'Zona critica vicino all orizzonte degli eventi.'
  },
  {
    id: 'near-horizon',
    name: 'Quasi orizzonte',
    shortName: 'Quasi orizzonte',
    kind: 'black-hole-zone',
    x: 7.7,
    y: -1.2,
    distanceFromEarthLightYears: 4.3,
    schwarzschildDistance: 1.2,
    description: 'Effetto gravitazionale estremo. Da usare nella fase laboratorio.'
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

let app = read('src/App.tsx');
app = app
  .replace(/Chi torna piu giovane\?/g, finalTitle)
  .replace(/Chi torna più giovane\?/g, finalTitle)
  .replace(/Il buco nero e il tempo/g, finalTitle)
  .replace(/Il tempo e il buco nero/g, finalTitle);
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
app = app.replace(
  'Per questa prima versione, cliccare una stazione equivale a scansionare il suo QR.',
  'Mappa in scala logaritmica semplificata. La distanza cosmica e la somma progressiva dei tratti percorsi. Cliccare una stazione equivale a scansionare il suo QR.'
);
write('src/App.tsx', app);

let css = read('src/styles.css');
if (!css.includes('SOURCE_FIX_FULL_WIDTH_MAP')) {
  css += `

/* SOURCE_FIX_FULL_WIDTH_MAP */
.dashboard-grid { grid-template-columns: 1fr !important; }
.dashboard-card, .map-card { width: 100%; }
.map-area { width: 100%; min-height: 560px !important; overflow: hidden; }
.map-node { white-space: nowrap; }
.station-title-row { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.station-title-row em { color: #7dd3fc; font-style: normal; font-size: 0.95rem; font-weight: 700; }
@media (max-width: 520px) {
  .map-area { min-height: 460px !important; }
  .map-node { min-width: 58px; font-size: 0.72rem; padding: 8px 9px; }
}
`;
}
write('src/styles.css', css);

let html = read('index.html');
html = html
  .replace(/Chi torna piu giovane\?/g, finalTitle)
  .replace(/Chi torna più giovane\?/g, finalTitle)
  .replace(/Il buco nero e il tempo/g, finalTitle);
write('index.html', html);

let manifest = read('public/manifest.webmanifest');
manifest = manifest
  .replace(/Black Hole Time App/g, finalTitle)
  .replace(/Il buco nero e il tempo/g, finalTitle)
  .replace(/Black Hole/g, 'Buco Nero');
write('public/manifest.webmanifest', manifest);

console.log('Source files fixed. Now run: npm.cmd run dev');
