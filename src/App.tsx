import { RotateCcw, Rocket, ScanLine, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { stations } from './data/stations';
import { calculateMission, getSuggestedRoutes } from './logic/mission';
import { FIXED_BETA, formatDistance, formatYears } from './logic/relativity';

const DEFAULT_AGE = 13;

export default function App() {
  const [initialAge, setInitialAge] = useState(DEFAULT_AGE);
  const [routeIds, setRouteIds] = useState<string[]>([]);

  const result = useMemo(() => calculateMission(routeIds), [routeIds]);
  const suggestedRoutes = useMemo(() => getSuggestedRoutes(), []);

  const addStation = (stationId: string) => {
    setRouteIds((current) => [...current, stationId]);
  };

  const applyRoute = (route: string[]) => {
    setRouteIds(route);
  };

  const reset = () => setRouteIds([]);

  const earthFinalAge = initialAge + result.earthElapsedYears;
  const travelerFinalAge = initialAge + result.travelerElapsedYears;
  const influencePercent = Math.round(result.blackHoleInfluence * 100);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Cruscotto didattico</p>
          <h1>Chi torna piu giovane?</h1>
          <p className="hero-text">
            Parti dalla Terra, scansiona le stazioni della mappa e torna alla Terra. L'app confronta
            quanto tempo passa sulla Terra e quanto tempo passa per il viaggiatore, mostrando l'impatto del buco nero.
          </p>
        </div>
        <div className="mission-speed">
          <Rocket size={30} />
          <span>Velocita missione</span>
          <strong>{FIXED_BETA.toLocaleString('it-IT')}c</strong>
          <small>costante per isolare l'effetto del buco nero</small>
        </div>
      </section>

      <section className="panel controls-panel">
        <div>
          <label htmlFor="age">Eta iniziale del viaggiatore</label>
          <div className="age-row">
            <input
              id="age"
              type="number"
              min="1"
              max="120"
              value={initialAge}
              onChange={(event) => setInitialAge(Number(event.target.value))}
            />
            <span>anni</span>
          </div>
        </div>
        <button className="secondary-button" onClick={reset} type="button">
          <RotateCcw size={18} />
          Ricomincia
        </button>
      </section>

      <section className="dashboard-grid">
        <div className="panel dashboard-card">
          <div className="section-title">
            <Sparkles size={20} />
            <h2>Cruscotto astronave</h2>
          </div>

          <div className="station-current">
            <span>Stazione attuale</span>
            <strong>{result.currentStation?.name ?? 'Nessuna stazione scansionata'}</strong>
          </div>

          <div className="gauge-card">
            <div className="gauge-topline">
              <span>Influenza buco nero</span>
              <strong>{influencePercent}%</strong>
            </div>
            <div className="gauge-track">
              <div className="gauge-fill" style={{ width: `${influencePercent}%` }} />
            </div>
            <p>{result.blackHoleInfluenceLabel}</p>
            {result.closestBlackHoleZone && (
              <small>Distanza minima raggiunta: {result.closestBlackHoleZone.schwarzschildDistance} Rs</small>
            )}
          </div>

          <div className="metrics-grid">
            <Metric label="Distanza cosmica" value={formatDistance(result.cosmicDistanceLightYears)} />
            <Metric label="Distanza sulla mappa" value={`${result.physicalDistanceMeters.toLocaleString('it-IT', { maximumFractionDigits: 1 })} m`} />
            <Metric label="Velocita media" value="0,5c" />
            <Metric label="Fattore totale" value={`${result.totalFactor.toLocaleString('it-IT', { maximumFractionDigits: 3 })}x`} />
            <Metric label="Tempo sulla Terra" value={formatYears(result.earthElapsedYears)} />
            <Metric label="Tempo per te" value={formatYears(result.travelerElapsedYears)} />
          </div>
        </div>

        <div className="panel map-card">
          <div className="section-title">
            <ScanLine size={20} />
            <h2>Mappa e stazioni</h2>
          </div>
          <div className="map-area" aria-label="Mappa 2D delle stazioni">
            {stations.map((station) => (
              <button
                key={station.id}
                type="button"
                className={`map-node ${station.kind} ${routeIds.includes(station.id) ? 'visited' : ''}`}
                style={{ left: `${station.x * 9}%`, top: `${(3 - station.y) * 13}%` }}
                onClick={() => addStation(station.id)}
                title={station.description}
              >
                <span>{station.shortName}</span>
              </button>
            ))}
          </div>
          <p className="hint">Per questa prima versione, cliccare una stazione equivale a scansionare il suo QR.</p>
        </div>
      </section>

      <section className="panel route-panel">
        <h2>Percorso scansionato</h2>
        {result.route.length === 0 ? (
          <p className="muted">Scansiona Terra per partire, poi visita una o piu stazioni e torna alla Terra.</p>
        ) : (
          <div className="route-chain">
            {result.route.map((station, index) => (
              <span key={`${station.id}-${index}`}>{station.shortName}</span>
            ))}
          </div>
        )}
      </section>

      {result.isComplete && (
        <section className="panel result-card">
          <h2>Missione completata</h2>
          <div className="result-main">
            <div>
              <span>Eta di chi resta sulla Terra</span>
              <strong>{formatYears(earthFinalAge)}</strong>
            </div>
            <div>
              <span>Eta del viaggiatore al ritorno</span>
              <strong>{formatYears(travelerFinalAge)}</strong>
            </div>
            <div className="difference-box">
              <span>Il viaggiatore torna piu giovane di</span>
              <strong>{formatYears(result.ageDifferenceYears)}</strong>
            </div>
          </div>

          <div className="explanation-box">
            <h3>Cosa ha causato la differenza?</h3>
            <p>
              Effetto della velocita senza buco nero: <strong>{formatYears(result.baselineAgeDifferenceYears)}</strong>.
            </p>
            <p>
              Effetto aggiuntivo del buco nero: <strong>{formatYears(result.blackHoleExtraDifferenceYears)}</strong>.
            </p>
            <p className="muted">
              La velocita e sempre 0,5c: se compare una differenza aggiuntiva, nasce dal passaggio vicino al buco nero didattico.
            </p>
          </div>
        </section>
      )}

      <section className="panel suggestions-panel">
        <h2>Prove consigliate</h2>
        <div className="suggestions-grid">
          {suggestedRoutes.map((suggestion) => (
            <button key={suggestion.title} type="button" className="suggestion-card" onClick={() => applyRoute(suggestion.route)}>
              <strong>{suggestion.title}</strong>
              <span>{suggestion.route.join(' -> ')}</span>
              <small>{suggestion.note}</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
