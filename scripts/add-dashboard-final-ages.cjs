const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appPath = path.join(root, 'src/App.tsx');

let app = fs.readFileSync(appPath, 'utf8');

const ageMetricsAlreadyPresent = app.includes('Eta finale viaggiatore') || app.includes('Età finale viaggiatore');

if (!ageMetricsAlreadyPresent) {
  app = app.replace(
    `<Metric label="Tempo sulla Terra" value={formatYears(result.earthElapsedYears)} />
            <Metric label="Tempo per te" value={formatYears(result.travelerElapsedYears)} />`,
    `<Metric label="Tempo sulla Terra" value={formatYears(result.earthElapsedYears)} />
            <Metric label="Tempo per te" value={formatYears(result.travelerElapsedYears)} />
            <Metric label="Eta finale gemello sulla Terra" value={formatYears(earthFinalAge)} />
            <Metric label="Eta finale viaggiatore" value={formatYears(travelerFinalAge)} />`
  );
}

fs.writeFileSync(appPath, app, 'utf8');
console.log('Dashboard final ages added.');
