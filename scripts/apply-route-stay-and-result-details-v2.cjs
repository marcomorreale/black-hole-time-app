const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (filePath) => fs.readFileSync(path.join(root, filePath), 'utf8');
const write = (filePath, content) => fs.writeFileSync(path.join(root, filePath), content, 'utf8');

let app = read('src/App.tsx');

const oldRouteBlock = [
  '{result.route.map((station, index) => {',
  '              const visit = result.visits[index];',
  '              const nextVisit = result.visits[index + 1];',
  '              const staySeconds = visit && nextVisit ? Math.max(0, (nextVisit.arrivedAtMs - visit.arrivedAtMs) / 1000) : 0;',
  '              return (',
  '                <span key={`${station.id}-${index}`}>',
  '                  {station.shortName}',
  "                  {staySeconds > 0 && <small>{staySeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })}s</small>}",
  '                </span>',
  '              );',
  '            })}'
].join('\n');

const olderRouteBlock = [
  '{result.route.map((station, index) => (',
  '              <span key={`${station.id}-${index}`}>{station.shortName}</span>',
  '            ))}'
].join('\n');

const newRouteBlock = [
  '{result.route.map((station, index) => {',
  '              const visit = result.visits[index];',
  '              const nextVisit = result.visits[index + 1];',
  '              const isCurrentStation = index === result.route.length - 1;',
  '              const completedStaySeconds = visit && nextVisit ? Math.max(0, (nextVisit.arrivedAtMs - visit.arrivedAtMs) / 1000) : 0;',
  '              const shownStaySeconds = isCurrentStation ? result.activeStayRealSeconds : completedStaySeconds;',
  '              const shownStayYears = shownStaySeconds;',
  '              return (',
  '                <span key={`${station.id}-${index}`} className="route-stop-pill">',
  '                  <strong>{station.shortName}</strong>',
  '                  <small>',
  "                    sosta: {shownStaySeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })}s",
  '                    {shownStaySeconds > 0 && <> / {formatYears(shownStayYears)}</>}',
  '                  </small>',
  '                </span>',
  '              );',
  '            })}'
].join('\n');

if (app.includes(oldRouteBlock)) {
  app = app.replace(oldRouteBlock, newRouteBlock);
} else if (app.includes(olderRouteBlock)) {
  app = app.replace(olderRouteBlock, newRouteBlock);
}

const resultAnchor = [
  '          <div className="explanation-box">',
  '            <h3>Cosa ha causato la differenza?</h3>'
].join('\n');

const resultDetails = [
  '          <div className="result-detail-grid">',
  '            <div>',
  '              <span>Tempo viaggio sulla Terra</span>',
  '              <strong>{formatYears(result.travelEarthYears)}</strong>',
  '            </div>',
  '            <div>',
  '              <span>Tempo viaggio per il viaggiatore</span>',
  '              <strong>{formatYears(result.travelTravelerYears)}</strong>',
  '            </div>',
  '            <div>',
  '              <span>Tempo soste sulla Terra</span>',
  '              <strong>{formatYears(result.stayEarthYears)}</strong>',
  '            </div>',
  '            <div>',
  '              <span>Tempo soste per il viaggiatore</span>',
  '              <strong>{formatYears(result.stayTravelerYears)}</strong>',
  '            </div>',
  '            <div>',
  '              <span>Distanza cosmica percorsa</span>',
  '              <strong>{formatDistance(result.cosmicDistanceLightYears)}</strong>',
  '            </div>',
  '            <div>',
  '              <span>Conseguenza finale</span>',
  '              <strong>{formatYears(result.ageDifferenceYears)} di differenza</strong>',
  '            </div>',
  '          </div>',
  '',
  resultAnchor
].join('\n');

if (!app.includes('result-detail-grid') && app.includes(resultAnchor)) {
  app = app.replace(resultAnchor, resultDetails);
}

const oldExplanation = [
  '            <p>Tempo di viaggio sulla Terra: <strong>{formatYears(result.travelEarthYears)}</strong>; tempo di permanenza sulla Terra: <strong>{formatYears(result.stayEarthYears)}</strong>.</p>',
  '            <p>Effetto aggiuntivo del buco nero: <strong>{formatYears(result.blackHoleExtraDifferenceYears)}</strong>.</p>'
].join('\n');

const newExplanation = [
  '            <p>Tempo di viaggio sulla Terra: <strong>{formatYears(result.travelEarthYears)}</strong>; per il viaggiatore durante il viaggio: <strong>{formatYears(result.travelTravelerYears)}</strong>.</p>',
  '            <p>Tempo di sosta sulla Terra: <strong>{formatYears(result.stayEarthYears)}</strong>; per il viaggiatore durante le soste: <strong>{formatYears(result.stayTravelerYears)}</strong>.</p>',
  '            <p>Effetto aggiuntivo del buco nero: <strong>{formatYears(result.blackHoleExtraDifferenceYears)}</strong>.</p>'
].join('\n');

app = app.replace(oldExplanation, newExplanation);

write('src/App.tsx', app);

let css = read('src/styles.css');
if (!css.includes('ROUTE_STAY_AND_RESULT_DETAILS')) {
  css += [
    '',
    '/* ROUTE_STAY_AND_RESULT_DETAILS */',
    '.route-stop-pill {',
    '  display: inline-grid !important;',
    '  gap: 2px !important;',
    '  align-items: center;',
    '}',
    '.route-stop-pill strong { line-height: 1; }',
    '.route-stop-pill small {',
    '  color: #facc15;',
    '  font-size: 0.72rem;',
    '  font-weight: 800;',
    '}',
    '.result-detail-grid {',
    '  display: grid;',
    '  grid-template-columns: repeat(3, minmax(0, 1fr));',
    '  gap: 14px;',
    '  margin-top: 14px;',
    '}',
    '.result-detail-grid > div {',
    '  border-radius: 20px;',
    '  padding: 16px;',
    '  background: rgba(2, 6, 23, 0.48);',
    '  border: 1px solid rgba(148, 163, 184, 0.16);',
    '  display: grid;',
    '  gap: 7px;',
    '}',
    '.result-detail-grid span { color: #a8b4c7; }',
    '.result-detail-grid strong { font-size: 1.06rem; }',
    '@media (max-width: 860px) {',
    '  .result-detail-grid { grid-template-columns: 1fr; }',
    '}',
    ''
  ].join('\n');
}
write('src/styles.css', css);

console.log('Route stay times and completed mission details v2 applied.');
