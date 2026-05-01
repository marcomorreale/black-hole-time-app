export const FIXED_BETA = 0.5;
export const VELOCITY_FACTOR = Math.sqrt(1 - FIXED_BETA * FIXED_BETA);
export const YEARS_PER_LIGHT_YEAR_AT_C = 1;

export function getVelocityFactor(beta = FIXED_BETA): number {
  const safeBeta = Math.min(Math.max(beta, 0), 0.999);
  return Math.sqrt(1 - safeBeta * safeBeta);
}

export function getGravityFactor(schwarzschildDistance?: number): number {
  if (!schwarzschildDistance) return 1;
  if (schwarzschildDistance <= 1) return 0;
  return Math.sqrt(1 - 1 / schwarzschildDistance);
}

export function getBlackHoleInfluence(gravityFactor: number): number {
  const raw = 1 - gravityFactor;
  return Math.min(1, Math.pow(raw, 0.65));
}

export function getInfluenceLabel(influence: number): string {
  const pct = influence * 100;
  if (pct <= 0) return 'Spazio lontano';
  if (pct <= 25) return 'Campo debole';
  if (pct <= 50) return 'Campo evidente';
  if (pct <= 75) return 'Campo forte';
  if (pct < 96) return 'Zona critica';
  return 'Orizzonte degli eventi';
}

export function getEarthYearsForRoundTrip(lightYears: number, beta = FIXED_BETA): number {
  if (lightYears <= 0) return 0;
  return (lightYears * 2) / beta;
}

export function formatYears(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';

  const totalSeconds = Math.round(value * 365 * 24 * 60 * 60);
  const secondsPerDay = 24 * 60 * 60;
  const secondsPerMonth = 30 * secondsPerDay;
  const secondsPerYear = 365 * secondsPerDay;

  const years = Math.floor(totalSeconds / secondsPerYear);
  let remainingSeconds = totalSeconds - years * secondsPerYear;

  const months = Math.floor(remainingSeconds / secondsPerMonth);
  remainingSeconds -= months * secondsPerMonth;

  const days = Math.floor(remainingSeconds / secondsPerDay);
  remainingSeconds -= days * secondsPerDay;

  const hours = Math.floor(remainingSeconds / 3600);
  remainingSeconds -= hours * 3600;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds - minutes * 60;

  const parts: string[] = [];
  if (years > 0) parts.push(years + ' ' + (years === 1 ? 'anno' : 'anni'));
  if (months > 0) parts.push(months + ' ' + (months === 1 ? 'mese' : 'mesi'));
  if (days > 0 && years === 0) parts.push(days + ' ' + (days === 1 ? 'giorno' : 'giorni'));

  if (years === 0 && months === 0 && days === 0) {
    if (hours > 0) parts.push(hours + ' ' + (hours === 1 ? 'ora' : 'ore'));
    if (minutes > 0) parts.push(minutes + ' ' + (minutes === 1 ? 'minuto' : 'minuti'));
    if (seconds > 0 || parts.length === 0) parts.push(seconds + ' ' + (seconds === 1 ? 'secondo' : 'secondi'));
  }

  return parts.join(' e ');
}

export function formatDistance(lightYears: number): string {
  if (lightYears >= 1) return `${lightYears.toLocaleString('it-IT', { maximumFractionDigits: 2 })} anni luce`;
  const km = lightYears * 9_460_730_472_580.8;
  if (km >= 1_000_000_000) return `${(km / 1_000_000_000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} miliardi km`;
  if (km >= 1_000_000) return `${(km / 1_000_000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} milioni km`;
  return `${Math.round(km).toLocaleString('it-IT')} km`;
}
