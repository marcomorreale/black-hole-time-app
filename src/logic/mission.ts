import { Station, stationById } from '../data/stations';
import {
  FIXED_BETA,
  VELOCITY_FACTOR,
  getBlackHoleInfluence,
  getEarthYearsForRoundTrip,
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

  const realDestinations = route.filter(
    (station) => station.kind === 'real-destination' && station.distanceFromEarthLightYears
  );
  const mainDestination = realDestinations.reduce<Station | undefined>((best, station) => {
    if (!best) return station;
    return (station.distanceFromEarthLightYears ?? 0) > (best.distanceFromEarthLightYears ?? 0) ? station : best;
  }, undefined);

  const blackHoleZones = route.filter((station) => station.kind === 'black-hole-zone' && station.schwarzschildDistance);
  const closestBlackHoleZone = blackHoleZones.reduce<Station | undefined>((closest, station) => {
    if (!closest) return station;
    return (station.schwarzschildDistance ?? Infinity) < (closest.schwarzschildDistance ?? Infinity) ? station : closest;
  }, undefined);

  const cosmicDistanceLightYears = mainDestination?.distanceFromEarthLightYears ?? 0;
  const earthElapsedYears = getEarthYearsForRoundTrip(cosmicDistanceLightYears, beta);
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
    cosmicDistanceLightYears: cosmicDistanceLightYears * 2,
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
      title: 'Buco nero debole: ingresso nel campo',
      route: ['earth', 'proxima', 'einstein-beacon', 'earth'],
      note: 'Mostra un primo effetto gravitazionale del buco nero didattico.'
    },
    {
      title: 'Buco nero forte: disco di accrescimento',
      route: ['earth', 'proxima', 'accretion-disk', 'earth'],
      note: 'Evidenzia un effetto forte ma ancora gestibile.'
    },
    {
      title: 'Zona critica: margine dell\'orizzonte',
      route: ['earth', 'proxima', 'horizon-margin', 'earth'],
      note: 'La demo principale per mostrare chiaramente l\'impatto del buco nero.'
    }
  ];
}
