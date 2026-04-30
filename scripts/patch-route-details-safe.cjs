const fs = require('fs');

const appPath = 'src/App.tsx';
const cssPath = 'src/styles.css';

let app = fs.readFileSync(appPath, 'utf8');
let changed = false;

const routeStart = app.indexOf('      <section className="panel route-panel">');
const routeEnd = app.indexOf('      {result.isComplete && (', routeStart);

if (routeStart !== -1 && routeEnd !== -1) {
  const routeSection = [
    '      <section className="panel route-panel">',
    '        <h2>Percorso scansionato</h2>',
    '        {result.route.length === 0 ? <p className="muted">Parti gia dalla Terra: visita una o piu stazioni e torna alla Terra.</p> : (',
    '          <div className="route-chain">',
    '            {result.route.map((station, index) => {',
    '              const visit = result.visits[index];',
    '              const nextVisit = result.visits[index + 1];',
    '              const isCurrentStation = index === result.route.length - 1;',
    '              const completedStaySeconds = visit && nextVisit ? Math.max(0, (nextVisit.arrivedAtMs - visit.arrivedAtMs) / 1000) : 0;',
    '              const shownStaySeconds = isCurrentStation ? result.activeStayRealSeconds : completedStaySeconds;',
    '              const shownStayYears = shownStaySeconds;',
    '              return (',
    '                <span key={station.id + "-" + index} className="route-stop-pill">',
    '                  <strong>{station.shortName}</strong>',
    '                  <small>',
    '                    sosta: {shownStaySeconds.toLocaleString("it-IT", { maximumFractionDigits: 1 })}s',
    '                    {shownStaySeconds > 0 && <> / {formatYears(shownStayYears)}</>}',
    '                  </small>',
    '                </span>',
    '              );',
    '            })}',
    '          </div>',
    '        )}',
    '      </section>'
  ].join('\n');

  app = app.slice(0, routeStart) + routeSection + '\n\n' + app.slice(routeEnd);
  changed = true;
  console.log('OK: route panel patched.');
} else {
  console.warn('WARN: route panel section not found; skipped route patch.');
}

if (!app.includes('result-detail-grid')) {
  const resultPanelStart = app.indexOf('        <section className="panel result-card">');
  const explanationStart = app.indexOf('          <div className="explanation-box">', resultPanelStart);

  if (resultPanelStart !== -1 && explanationStart !== -1) {
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
    ].join('\n');

    app = app.slice(0, explanationStart) + resultDetails + app.slice(explanationStart);
    changed = true;
    console.log('OK: result detail grid inserted.');
  } else {
    console.warn('WARN: result card/explanation box not found; skipped result detail grid.');
  }
} else {
  console.log('OK: result detail grid already present.');
}

app = app.replace(
  /<p>Effetto della velocita senza buco nero: <strong>\{formatYears\(result\.baselineAgeDifferenceYears\)\}<\/strong>\.<\/p>\s*<p>Tempo di viaggio sulla Terra: <strong>\{formatYears\(result\.travelEarthYears\)\}<\/strong>; tempo di permanenza sulla Terra: <strong>\{formatYears\(result\.stayEarthYears\)\}<\/strong>\.<\/p>\s*<p>Effetto aggiuntivo del buco nero: <strong>\{formatYears\(result\.blackHoleExtraDifferenceYears\)\}<\/strong>\.<\/p>/,
  [
    '<p>Effetto della velocita senza buco nero: <strong>{formatYears(result.baselineAgeDifferenceYears)}</strong>.</p>',
    '<p>Tempo di viaggio sulla Terra: <strong>{formatYears(result.travelEarthYears)}</strong>; per il viaggiatore durante il viaggio: <strong>{formatYears(result.travelTravelerYears)}</strong>.</p>',
    '<p>Tempo di sosta sulla Terra: <strong>{formatYears(result.stayEarthYears)}</strong>; per il viaggiatore durante le soste: <strong>{formatYears(result.stayTravelerYears)}</strong>.</p>',
    '<p>Effetto aggiuntivo del buco nero: <strong>{formatYears(result.blackHoleExtraDifferenceYears)}</strong>.</p>'
  ].join('\n            ')
);

if (changed) {
  fs.writeFileSync(appPath, app, 'utf8');
}

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('ROUTE_STAY_AND_RESULT_DETAILS')) {
  css += [
    '',
    '/* ROUTE_STAY_AND_RESULT_DETAILS */',
    '.route-stop-pill { display: inline-grid !important; gap: 2px !important; align-items: center; }',
    '.route-stop-pill strong { line-height: 1; }',
    '.route-stop-pill small { color: #facc15; font-size: 0.72rem; font-weight: 800; }',
    '.result-detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 14px; }',
    '.result-detail-grid > div { border-radius: 20px; padding: 16px; background: rgba(2, 6, 23, 0.48); border: 1px solid rgba(148, 163, 184, 0.16); display: grid; gap: 7px; }',
    '.result-detail-grid span { color: #a8b4c7; }',
    '.result-detail-grid strong { font-size: 1.06rem; }',
    '@media (max-width: 860px) { .result-detail-grid { grid-template-columns: 1fr; } }',
    ''
  ].join('\n');
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('OK: CSS added.');
}

console.log('Safe route details patch completed.');
