const fs = require('fs');

const missionPath = 'src/logic/mission.ts';
let mission = fs.readFileSync(missionPath, 'utf8');

// Add exported setup delay constant.
mission = mission.replace(
  'export const STAY_YEARS_PER_REAL_SECOND = 1;',
  'export const STAY_YEARS_PER_REAL_SECOND = 1;\nexport const STAY_SETUP_SECONDS = 5;'
);

// Completed stays: subtract setup/travel seconds before converting to simulated years.
mission = mission.replace(
  '    const realSeconds = Math.max(0, (visits[index + 1].arrivedAtMs - visits[index].arrivedAtMs) / 1000);\n    const earthYears = realSeconds * STAY_YEARS_PER_REAL_SECOND;',
  '    const elapsedSeconds = Math.max(0, (visits[index + 1].arrivedAtMs - visits[index].arrivedAtMs) / 1000);\n    const realSeconds = Math.max(0, elapsedSeconds - STAY_SETUP_SECONDS);\n    const earthYears = realSeconds * STAY_YEARS_PER_REAL_SECOND;'
);

// Active stay: subtract setup/travel seconds before showing/counting current station stay.
mission = mission.replace(
  '  return Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);',
  '  const elapsedSeconds = Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);\n  return Math.max(0, elapsedSeconds - STAY_SETUP_SECONDS);'
);

fs.writeFileSync(missionPath, mission, 'utf8');

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

// Import setup delay constant.
app = app.replace(
  "import { calculateMission, getSuggestedRoutes, RouteVisit, STAY_YEARS_PER_REAL_SECOND } from './logic/mission';",
  "import { calculateMission, getSuggestedRoutes, RouteVisit, STAY_SETUP_SECONDS, STAY_YEARS_PER_REAL_SECOND } from './logic/mission';"
);

// Add setup delay dashboard metric.
if (!app.includes('Tempo setup viaggio')) {
  app = app.replace(
    '<Metric label="Scala permanenza" value={`1 sec = ${STAY_YEARS_PER_REAL_SECOND} anno Terra`} />',
    '<Metric label="Scala permanenza" value={`1 sec = ${STAY_YEARS_PER_REAL_SECOND} anno Terra`} />\n            <Metric label="Tempo setup viaggio" value={`${STAY_SETUP_SECONDS} sec non conteggiati`} />'
  );
}

// Clarify map clock label.
app = app.replace(
  '<span>Sosta nella stazione corrente</span>',
  '<span>Sosta nella stazione corrente</span>'
);

// Add setup note to map clock small text when timer is still zero away from Earth.
app = app.replace(
  "<small>{result.currentStation?.id === 'earth' ? 'cronometro fermo' : `${formatYears(result.activeStayEarthYears)} simulati`}</small>",
  "<small>{result.currentStation?.id === 'earth' ? 'cronometro fermo' : result.activeStayRealSeconds === 0 ? `setup viaggio: ${STAY_SETUP_SECONDS}s` : `${formatYears(result.activeStayEarthYears)} simulati`}</small>"
);

// Route panel: shownStaySeconds now comes from mission active/completed values; update wording if present.
app = app.replace(
  'sosta: {shownStaySeconds.toLocaleString("it-IT", { maximumFractionDigits: 1 })}s',
  'sosta: {shownStaySeconds.toLocaleString("it-IT", { maximumFractionDigits: 1 })}s'
);

// Hint text.
app = app.replace(
  'Il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra.',
  'Il tempo tra due click misura la permanenza nella stazione precedente: i primi 5 secondi simulano il trasferimento/setup e non contano; poi 1 secondo reale vale 1 anno sulla Terra.'
);

app = app.replace(
  'La permanenza in una stazione vale 1 anno terrestre per ogni secondo reale passato prima del click successivo.',
  'La permanenza in una stazione inizia dopo 5 secondi di setup/trasferimento; poi vale 1 anno terrestre per ogni secondo reale passato prima del click successivo.'
);

fs.writeFileSync(appPath, app, 'utf8');

console.log('Stay setup delay applied: first 5 seconds do not count as station stay.');
