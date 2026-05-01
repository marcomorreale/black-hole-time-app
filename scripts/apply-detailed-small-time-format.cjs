const fs = require('fs');

const filePath = 'src/logic/relativity.ts';
let source = fs.readFileSync(filePath, 'utf8');

const oldFunction = `export function formatYears(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';

  const years = Math.floor(value);
  const monthsFloat = (value - years) * 12;
  const months = Math.floor(monthsFloat);
  const days = Math.round((monthsFloat - months) * 30);

  const parts: string[] = [];
  if (years > 0) parts.push(\`${years} ${years === 1 ? 'anno' : 'anni'}\`);
  if (months > 0) parts.push(\`${months} ${months === 1 ? 'mese' : 'mesi'}\`);
  if (years === 0 && days > 0) parts.push(\`${days} ${days === 1 ? 'giorno' : 'giorni'}\`);

  return parts.length ? parts.join(' e ') : 'meno di un giorno';
}`;

const newFunction = `export function formatYears(value: number): string {
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
  if (years > 0) parts.push(\`${years} ${years === 1 ? 'anno' : 'anni'}\`);
  if (months > 0) parts.push(\`${months} ${months === 1 ? 'mese' : 'mesi'}\`);
  if (days > 0 && years === 0) parts.push(\`${days} ${days === 1 ? 'giorno' : 'giorni'}\`);

  if (years === 0 && months === 0 && days === 0) {
    if (hours > 0) parts.push(\`${hours} ${hours === 1 ? 'ora' : 'ore'}\`);
    if (minutes > 0) parts.push(\`${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}\`);
    if (seconds > 0 || parts.length === 0) parts.push(\`${seconds} ${seconds === 1 ? 'secondo' : 'secondi'}\`);
  }

  return parts.join(' e ');
}`;

if (!source.includes(oldFunction)) {
  throw new Error('formatYears function not found or already changed.');
}

source = source.replace(oldFunction, newFunction);
fs.writeFileSync(filePath, source, 'utf8');
console.log('Detailed small time format applied.');
