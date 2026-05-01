const fs = require('fs');

const filePath = 'src/logic/relativity.ts';
let source = fs.readFileSync(filePath, 'utf8');

const signature = 'export function formatYears(value: number): string {';
const start = source.indexOf(signature);

if (start === -1) {
  throw new Error('formatYears function not found.');
}

let braceCount = 0;
let end = -1;
let foundOpeningBrace = false;

for (let index = start; index < source.length; index += 1) {
  const char = source[index];

  if (char === '{') {
    braceCount += 1;
    foundOpeningBrace = true;
  }

  if (char === '}') {
    braceCount -= 1;
    if (foundOpeningBrace && braceCount === 0) {
      end = index + 1;
      break;
    }
  }
}

if (end === -1) {
  throw new Error('Could not find the end of formatYears function.');
}

const newFunction = [
  'export function formatYears(value: number): string {',
  "  if (!Number.isFinite(value) || value <= 0) return '0';",
  '',
  '  const totalSeconds = Math.round(value * 365 * 24 * 60 * 60);',
  '  const secondsPerDay = 24 * 60 * 60;',
  '  const secondsPerMonth = 30 * secondsPerDay;',
  '  const secondsPerYear = 365 * secondsPerDay;',
  '',
  '  const years = Math.floor(totalSeconds / secondsPerYear);',
  '  let remainingSeconds = totalSeconds - years * secondsPerYear;',
  '',
  '  const months = Math.floor(remainingSeconds / secondsPerMonth);',
  '  remainingSeconds -= months * secondsPerMonth;',
  '',
  '  const days = Math.floor(remainingSeconds / secondsPerDay);',
  '  remainingSeconds -= days * secondsPerDay;',
  '',
  '  const hours = Math.floor(remainingSeconds / 3600);',
  '  remainingSeconds -= hours * 3600;',
  '',
  '  const minutes = Math.floor(remainingSeconds / 60);',
  '  const seconds = remainingSeconds - minutes * 60;',
  '',
  '  const parts: string[] = [];',
  "  if (years > 0) parts.push(years + ' ' + (years === 1 ? 'anno' : 'anni'));",
  "  if (months > 0) parts.push(months + ' ' + (months === 1 ? 'mese' : 'mesi'));",
  "  if (days > 0 && years === 0) parts.push(days + ' ' + (days === 1 ? 'giorno' : 'giorni'));",
  '',
  '  if (years === 0 && months === 0 && days === 0) {',
  "    if (hours > 0) parts.push(hours + ' ' + (hours === 1 ? 'ora' : 'ore'));",
  "    if (minutes > 0) parts.push(minutes + ' ' + (minutes === 1 ? 'minuto' : 'minuti'));",
  "    if (seconds > 0 || parts.length === 0) parts.push(seconds + ' ' + (seconds === 1 ? 'secondo' : 'secondi'));",
  '  }',
  '',
  "  return parts.join(' e ');",
  '}'
].join('\n');

source = source.slice(0, start) + newFunction + source.slice(end);
fs.writeFileSync(filePath, source, 'utf8');
console.log('Detailed small time format v3 applied.');
