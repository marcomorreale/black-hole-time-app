import { Station, stationById } from '../data/stations';
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
