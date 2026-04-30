const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (filePath) => fs.readFileSync(path.join(root, filePath), 'utf8');
const write = (filePath, content) => fs.writeFileSync(path.join(root, filePath), content, 'utf8');

let mission = read('src/logic/mission.ts');

mission = mission.replace(
  'const missionHasReturnedToEarth = isComplete;\n  const activeStayRealSeconds = missionHasReturnedToEarth ? 0 : getActiveStayRealSeconds(visits, nowMs);\n  const activeStayEarthYears = activeStayRealSeconds * STAY_YEARS_PER_REAL_SECOND;',
  'const activeStayRealSeconds = getActiveStayRealSeconds(visits, nowMs);\n  const activeStayEarthYears = activeStayRealSeconds * STAY_YEARS_PER_REAL_SECOND;'
);

mission = mission.replace(
  'function getActiveStayRealSeconds(visits: RouteVisit[], nowMs: number): number {\n  const lastVisit = visits.at(-1);\n  if (!lastVisit) return 0;\n  return Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);\n}',
  `function getActiveStayRealSeconds(visits: RouteVisit[], nowMs: number): number {
  const lastVisit = visits.at(-1);
  if (!lastVisit) return 0;

  const hasOnlyInitialEarth = visits.length === 1 && lastVisit.stationId === 'earth';
  if (hasOnlyInitialEarth) return 0;

  const hasReturnedToEarth =
    visits.length >= 3 && visits[0]?.stationId === 'earth' && lastVisit.stationId === 'earth';
  if (hasReturnedToEarth) return 0;

  return Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);
}`
);

write('src/logic/mission.ts', mission);

let app = read('src/App.tsx');

// Start with Earth already selected, but without starting the stay timer.
app = app.replace(
  'const [routeVisits, setRouteVisits] = useState<RouteVisit[]>([]);',
  "const createInitialRoute = (): RouteVisit[] => [{ stationId: 'earth', arrivedAtMs: Date.now() }];\n  const [routeVisits, setRouteVisits] = useState<RouteVisit[]>(createInitialRoute);"
);

app = app.replace(
  'const addStation = (stationId: string) => {\n    setRouteVisits((current) => [...current, { stationId, arrivedAtMs: Date.now() }]);\n  };',
  `const addStation = (stationId: string) => {
    setRouteVisits((current) => {
      const now = Date.now();
      const hasOnlyInitialEarth = current.length === 1 && current[0].stationId === 'earth';

      if (hasOnlyInitialEarth && stationId === 'earth') {
        return current;
      }

      if (hasOnlyInitialEarth) {
        return [current[0], { stationId, arrivedAtMs: now }];
      }

      return [...current, { stationId, arrivedAtMs: now }];
    });
  };`
);

app = app.replace(
  'const reset = () => setRouteVisits([]);',
  'const reset = () => setRouteVisits(createInitialRoute());'
);

// Remove live Earth elapsed time calculation if present.
app = app.replace(
  '\n  const liveEarthElapsedYears = result.earthElapsedYears + result.activeStayEarthYears;',
  ''
);

// Replace previous map clock with current station stay clock.
app = app.replace(
  /<div className="map-time-clock">[\s\S]*?<\/div>\n            <div className="black-hole-field-center"/,
  `<div className="map-time-clock">
              <span>Sosta nella stazione corrente</span>
              <strong>{result.activeStayRealSeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })} sec</strong>
              <small>{formatYears(result.activeStayEarthYears)} simulati</small>
            </div>
            <div className="black-hole-field-center"`
);

// If the map clock is not present yet, add it before the sectors.
if (!app.includes('Sosta nella stazione corrente')) {
  app = app.replace(
    '<div className="map-area" aria-label="Mappa 2D delle stazioni">',
    `<div className="map-area" aria-label="Mappa 2D delle stazioni">
            <div className="map-time-clock">
              <span>Sosta nella stazione corrente</span>
              <strong>{result.activeStayRealSeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })} sec</strong>
              <small>{formatYears(result.activeStayEarthYears)} simulati</small>
            </div>`
  );
}

app = app.replace(
  'Mappa in scala logaritmica semplificata. Le lettere A, B, C, D sono stazioni di passaggio dentro i settori del campo gravitazionale. Il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra. Quando rientri sulla Terra, il conteggio si ferma.',
  'Mappa in scala logaritmica semplificata. La Terra e gia impostata come punto di partenza. Il cronometro parte quando selezioni la prima destinazione; il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra.'
);

app = app.replace(
  'Mappa in scala logaritmica semplificata. Le lettere A, B, C, D sono stazioni di passaggio dentro i settori del campo gravitazionale. Il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra.',
  'Mappa in scala logaritmica semplificata. La Terra e gia impostata come punto di partenza. Il cronometro parte quando selezioni la prima destinazione; il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra.'
);

app = app.replace(
  'Scansiona Terra per partire, poi visita una o piu stazioni e torna alla Terra.',
  'Parti gia dalla Terra: visita una o piu stazioni e torna alla Terra.'
);

write('src/App.tsx', app);

let css = read('src/styles.css');
if (!css.includes('CURRENT_STAY_CLOCK_REFINEMENT')) {
  css += [
    '',
    '/* CURRENT_STAY_CLOCK_REFINEMENT */',
    '.map-time-clock span { color: #a8b4c7; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }',
    '.map-time-clock strong { color: #e0f2fe; font-size: 1.25rem; }',
    '.map-time-clock small { color: #facc15; font-weight: 800; }',
    ''
  ].join('\n');
}
write('src/styles.css', css);

console.log('Initial Earth and current stay clock applied.');
