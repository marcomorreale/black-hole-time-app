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
