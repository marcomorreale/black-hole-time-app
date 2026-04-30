const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (filePath) => fs.readFileSync(path.join(root, filePath), 'utf8');
const write = (filePath, content) => fs.writeFileSync(path.join(root, filePath), content, 'utf8');

let mission = read('src/logic/mission.ts');
mission = mission.replace(
  'const activeStayRealSeconds = getActiveStayRealSeconds(visits, nowMs);\n  const activeStayEarthYears = activeStayRealSeconds * STAY_YEARS_PER_REAL_SECOND;',
  'const missionHasReturnedToEarth = isComplete;\n  const activeStayRealSeconds = missionHasReturnedToEarth ? 0 : getActiveStayRealSeconds(visits, nowMs);\n  const activeStayEarthYears = activeStayRealSeconds * STAY_YEARS_PER_REAL_SECOND;'
);
write('src/logic/mission.ts', mission);

let app = read('src/App.tsx');

if (!app.includes('const liveEarthElapsedYears')) {
  app = app.replace(
    'const currentStationDistance = result.currentStation?.distanceFromEarthLightYears;',
    'const currentStationDistance = result.currentStation?.distanceFromEarthLightYears;\n  const liveEarthElapsedYears = result.earthElapsedYears + result.activeStayEarthYears;'
  );
}

if (!app.includes('map-time-clock')) {
  app = app.replace(
    '<div className="map-area" aria-label="Mappa 2D delle stazioni">',
    '<div className="map-area" aria-label="Mappa 2D delle stazioni">\n            <div className="map-time-clock">\n              <span>Tempo simulato sulla Terra</span>\n              <strong>{formatYears(liveEarthElapsedYears)}</strong>\n              <small>{result.isComplete ? \'Missione conclusa\' : \'tempo in corso\'}</small>\n            </div>'
  );
}

app = app.replace(
  'Mappa in scala logaritmica semplificata. Le lettere A, B, C, D sono stazioni di passaggio dentro i settori del campo gravitazionale. Il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra.',
  'Mappa in scala logaritmica semplificata. Le lettere A, B, C, D sono stazioni di passaggio dentro i settori del campo gravitazionale. Il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra. Quando rientri sulla Terra, il conteggio si ferma.'
);
write('src/App.tsx', app);

let css = read('src/styles.css');
if (!css.includes('MAP_TIME_CLOCK_UI')) {
  css += [
    '',
    '/* MAP_TIME_CLOCK_UI */',
    '.map-time-clock {',
    '  position: absolute;',
    '  right: 16px;',
    '  top: 16px;',
    '  z-index: 8;',
    '  display: grid;',
    '  gap: 3px;',
    '  min-width: 190px;',
    '  padding: 12px 14px;',
    '  border-radius: 18px;',
    '  background: rgba(2, 6, 23, 0.84);',
    '  border: 1px solid rgba(125, 211, 252, 0.26);',
    '  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);',
    '}',
    '.map-time-clock span { color: #a8b4c7; font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }',
    '.map-time-clock strong { color: #e0f2fe; font-size: 1.15rem; }',
    '.map-time-clock small { color: #facc15; font-weight: 800; }',
    '@media (max-width: 520px) {',
    '  .map-time-clock { right: 10px; top: 10px; min-width: 150px; padding: 10px 11px; }',
    '  .map-time-clock strong { font-size: 0.95rem; }',
    '  .map-time-clock span { font-size: 0.64rem; }',
    '}',
    ''
  ].join('\n');
}
write('src/styles.css', css);

console.log('Stop timer on Earth and map clock applied.');
