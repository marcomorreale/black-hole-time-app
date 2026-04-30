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
  massLogSize: number;
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
    massLogSize: 26,
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
    massLogSize: 18,
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
    massLogSize: 19,
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
    massLogSize: 44,
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
    massLogSize: 64,
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
    massLogSize: 16,
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
    massLogSize: 18,
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
    massLogSize: 20,
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
    massLogSize: 22,
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
    massLogSize: 72,
    description: 'Oggetto simulato usato per visualizzare l effetto estremo della gravita sul tempo.'
  }
];

export const stationById = new Map(stations.map((station) => [station.id, station]));
`);

let app = read('src/App.tsx');
app = app.replace(/className={`map-node \$\{station.kind\} \$\{routeIds.includes\(station.id\) \? 'visited' : ''\}`}/, "className={`map-node ${station.kind} ${routeIds.includes(station.id) ? 'visited' : ''}`}");
app = app.replace(
  /style=\{\{ left: `\$\{7 \+ station\.x \* 7\.8\}%`, top: `\$\{8 \+ \(3 - station\.y\) \* 11\.5\}%` \}\}/,
  "style={{ left: `${7 + station.x * 7.8}%`, top: `${8 + (3 - station.y) * 11.5}%`, width: `${station.massLogSize}px`, height: `${station.massLogSize}px` }}"
);
app = app.replace(
  /style=\{\{ left: `\$\{station\.x \* 9\}%`, top: `\$\{\(3 - station\.y\) \* 13\}%` \}\}/,
  "style={{ left: `${7 + station.x * 7.8}%`, top: `${8 + (3 - station.y) * 11.5}%`, width: `${station.massLogSize}px`, height: `${station.massLogSize}px` }}"
);
app = app.replace(
  /<span>\{station\.shortName\}<\/span>/,
  `<span className="planet-dot" aria-hidden="true" />
                <span className="planet-label">{station.shortName}</span>`
);

if (!app.includes('black-hole-field-center')) {
  app = app.replace(
    `<div className="black-hole-sector field-weak"><span>Campo debole</span></div>
            <div className="black-hole-sector field-strong"><span>Campo forte</span></div>
            <div className="black-hole-sector field-critical"><span>Zona critica</span></div>
            <div className="black-hole-sector field-horizon"><span>Quasi orizzonte</span></div>`,
    `<div className="black-hole-field-center" aria-hidden="true">
              <div className="black-hole-sector field-weak"><span>Campo debole</span></div>
              <div className="black-hole-sector field-strong"><span>Campo forte</span></div>
              <div className="black-hole-sector field-critical"><span>Zona critica</span></div>
              <div className="black-hole-sector field-horizon"><span>Quasi orizzonte</span></div>
            </div>`
  );
}
write('src/App.tsx', app);

let css = read('src/styles.css');
css += `

/* PLANETARY_MAP_UI */
.black-hole-field-center {
  position: absolute;
  left: calc(7% + 8.1 * 7.8%);
  top: calc(8% + (3 + 1.8) * 11.5%);
  width: 0;
  height: 0;
  z-index: 1;
  pointer-events: none;
}

.black-hole-sector {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed rgba(251, 146, 60, 0.46);
  pointer-events: none;
  display: block;
  color: #fed7aa;
  font-size: 0.78rem;
  font-weight: 800;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.045), rgba(249, 115, 22, 0.015), transparent 68%);
}

.black-hole-sector span {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  background: rgba(2, 6, 23, 0.78);
  border: 1px solid rgba(251, 146, 60, 0.24);
  border-radius: 999px;
  padding: 4px 8px;
}

.field-weak { width: 360px; height: 360px; }
.field-strong { width: 265px; height: 265px; }
.field-critical { width: 180px; height: 180px; }
.field-horizon { width: 105px; height: 105px; }

.map-node {
  min-width: 0 !important;
  padding: 0 !important;
  border-radius: 50% !important;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.map-node .planet-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.9), rgba(125,211,252,.45) 22%, rgba(14,116,144,.95) 65%);
}

.map-node.earth .planet-dot {
  background: radial-gradient(circle at 35% 30%, #e0f2fe, #2563eb 50%, #14532d 76%);
}

.map-node.real-destination .planet-dot {
  background: radial-gradient(circle at 35% 30%, #f8fafc, #38bdf8 36%, #0e7490 78%);
}

.map-node.info .planet-dot {
  background: radial-gradient(circle at 35% 30%, #fef3c7, #a855f7 42%, #3b0764 78%);
}

.map-node.black-hole-zone .planet-dot {
  background: radial-gradient(circle at 35% 30%, #fed7aa, #fb923c 38%, #7c2d12 78%);
}

.map-node.black-hole .planet-dot {
  background: radial-gradient(circle at 35% 30%, #64748b, #020617 45%, #000 76%);
  box-shadow: 0 0 0 6px rgba(249,115,22,.16), 0 0 32px rgba(249,115,22,.45);
}

.map-node.visited .planet-dot {
  outline: 3px solid rgba(250, 204, 21, 0.86);
  outline-offset: 3px;
}

.map-node .planet-label {
  position: absolute;
  left: 50%;
  top: calc(100% + 8px);
  transform: translateX(-50%);
  white-space: nowrap;
  color: #e5eefc;
  background: rgba(2, 6, 23, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  padding: 3px 7px;
  font-size: 0.76rem;
  font-weight: 800;
}

.map-node.black-hole .planet-label,
.map-node.info .planet-label {
  top: auto;
  bottom: calc(100% + 8px);
}

@media (max-width: 520px) {
  .field-weak { width: 260px; height: 260px; }
  .field-strong { width: 195px; height: 195px; }
  .field-critical { width: 135px; height: 135px; }
  .field-horizon { width: 82px; height: 82px; }
  .black-hole-sector { font-size: 0.64rem; }
  .map-node .planet-label { font-size: 0.66rem; padding: 2px 6px; }
}
`;
write('src/styles.css', css);

console.log('Planetary map UI applied.');
