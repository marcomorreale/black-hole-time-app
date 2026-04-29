export type StationKind = 'earth' | 'real-destination' | 'black-hole-zone' | 'info' | 'black-hole';

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
    description: 'Il nostro satellite naturale. Su questa scala l\'effetto relativistico e quasi nullo.'
  },
  {
    id: 'pluto',
    name: 'Plutone',
    shortName: 'Plutone',
    kind: 'real-destination',
    x: 2,
    y: 0,
    distanceFromEarthLightYears: 0.000623,
    description: 'Destinazione ai confini del Sistema Solare.'
  },
  {
    id: 'proxima',
    name: 'Proxima Centauri',
    shortName: 'Proxima',
    kind: 'real-destination',
    x: 5,
    y: 1,
    distanceFromEarthLightYears: 4.25,
    description: 'La stella piu vicina al Sole. E la destinazione principale del viaggio interstellare.'
  },
  {
    id: 'sagittarius-a',
    name: 'Sagittarius A*',
    shortName: 'Sgr A*',
    kind: 'info',
    x: 6,
    y: 3,
    distanceFromEarthLightYears: 26000,
    description: 'Buco nero supermassiccio reale al centro della Via Lattea. Troppo lontano per la missione.'
  },
  {
    id: 'einstein-beacon',
    name: 'Faro Einstein',
    shortName: 'Faro',
    kind: 'black-hole-zone',
    x: 7,
    y: 1,
    schwarzschildDistance: 10,
    description: 'Ingresso nella regione del buco nero didattico. Campo gravitazionale debole.'
  },
  {
    id: 'accretion-disk',
    name: 'Disco di accrescimento',
    shortName: 'Disco',
    kind: 'black-hole-zone',
    x: 8,
    y: 0,
    schwarzschildDistance: 2,
    description: 'Zona di campo gravitazionale forte.'
  },
  {
    id: 'horizon-margin',
    name: 'Margine dell\'orizzonte',
    shortName: 'Margine',
    kind: 'black-hole-zone',
    x: 9,
    y: -1,
    schwarzschildDistance: 1.5,
    description: 'Zona critica vicino all\'orizzonte degli eventi.'
  },
  {
    id: 'near-horizon',
    name: 'Quasi orizzonte',
    shortName: 'Quasi orizzonte',
    kind: 'black-hole-zone',
    x: 9.5,
    y: -1.5,
    schwarzschildDistance: 1.2,
    description: 'Effetto gravitazionale estremo. Da usare nella fase laboratorio.'
  },
  {
    id: 'teaching-black-hole',
    name: 'Buco nero didattico',
    shortName: 'Buco nero',
    kind: 'black-hole',
    x: 10,
    y: -2,
    schwarzschildDistance: 1,
    description: 'Oggetto simulato usato per visualizzare l\'effetto estremo della gravita sul tempo.'
  }
];

export const stationById = new Map(stations.map((station) => [station.id, station]));
