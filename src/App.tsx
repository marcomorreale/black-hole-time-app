import { RotateCcw, Rocket, ScanLine, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { stations } from './data/stations';
import { calculateMission, getSuggestedRoutes, RouteVisit, STAY_YEARS_PER_REAL_SECOND } from './logic/mission';
import { FIXED_BETA, formatDistance, formatYears } from './logic/relativity';
import QrScanner from './components/QrScanner';

const DEFAULT_AGE = 13;

export default function App() {
  const [initialAge, setInitialAge] = useState(DEFAULT_AGE);
  const createInitialRoute = (): RouteVisit[] => [{ stationId: 'earth', arrivedAtMs: Date.now() }];
  const [routeVisits, setRouteVisits] = useState<RouteVisit[]>(createInitialRoute);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const result = useMemo(() => calculateMission(routeVisits, undefined, nowMs), [routeVisits, nowMs]);
  const suggestedRoutes = useMemo(() => getSuggestedRoutes(), []);

  const addStation = (stationId: string) => {
    setRouteVisits((current) => [...current, { stationId, arrivedAtMs: Date.now() }]);
  };

  const applyRoute = (route: string[]) => {
    setRouteVisits(route.map((stationId, index) => ({ stationId, arrivedAtMs: Date.now() + index * 1000 }))); 
  };

  const reset = () => setRouteVisits(createInitialRoute());

  const earthFinalAge = initialAge + result.earthElapsedYears;
  const travelerFinalAge = initialAge + result.travelerElapsedYears;
  const influencePercent = Math.round(result.blackHoleInfluence * 100);
  const currentStationDistance = result.currentStation?.distanceFromEarthLightYears;

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Cruscotto didattico</p>
          <h1>Il tempo e il buco nero</h1>
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

      <QrScanner onScan={addStation} />

      <section className="dashboard-grid">
        <div className="panel dashboard-card">
          <div className="section-title">
            <Sparkles size={20} />
            <h2>Cruscotto astronave</h2>
          </div>

          <div className="station-current">
            <span>Stazione attuale</span>
            <div className="station-title-row">
              <strong>{result.currentStation?.name ?? 'Nessuna stazione scansionata'}</strong>
              {currentStationDistance !== undefined && (
                <em>{formatDistance(currentStationDistance)} dalla Terra</em>
              )}
            </div>
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
            <Metric label="Scala permanenza" value={`1 sec = ${STAY_YEARS_PER_REAL_SECOND} anno Terra`} />
            <Metric label="Permanenza attuale" value={`${result.activeStayRealSeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })} sec = ${formatYears(result.activeStayEarthYears)}`} />
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
            <div className="map-time-clock">
              <span>Sosta nella stazione corrente</span>
              <strong>{result.activeStayRealSeconds.toLocaleString('it-IT', { maximumFractionDigits: 1 })} sec</strong>
              <small>{result.currentStation?.id === 'earth' ? 'cronometro fermo' : `${formatYears(result.activeStayEarthYears)} simulati`}</small>
            </div>
            <div className="black-hole-field-center" aria-hidden="true">
              <div className="black-hole-sector field-weak"><span>Campo debole</span></div>
              <div className="black-hole-sector field-strong"><span>Campo forte</span></div>
              <div className="black-hole-sector field-critical"><span>Zona critica</span></div>
              <div className="black-hole-sector field-horizon"><span>Quasi orizzonte</span></div>
            </div>
            {stations.map((station) => (
              <button
                key={station.id}
                type="button"
                className={`map-node ${station.kind} ${routeVisits.some((visit) => visit.stationId === station.id) ? 'visited' : ''}`}
                style={{ left: `${7 + station.x * 7.8}%`, top: `${8 + (3 - station.y) * 11.5}%`, width: `${station.massLogSize}px`, height: `${station.massLogSize}px` }}
                onClick={() => addStation(station.id)}
                title={station.description}
              >
                <span className="planet-dot" aria-hidden="true" />
                <span className="planet-label">{station.shortName}</span>
              </button>
            ))}
          </div>
          <p className="hint">Mappa in scala logaritmica semplificata. La Terra e gia impostata come punto di partenza. Il cronometro parte quando selezioni la prima destinazione; il tempo tra due click misura la permanenza nella stazione precedente: 1 secondo reale vale 1 anno sulla Terra.</p>
        </div>
      </section>

      <section className="panel route-panel">
        <h2>Percorso scansionato</h2>
        {result.route.length === 0 ? <p className="muted">Parti gia dalla Terra: visita una o piu stazioni e torna alla Terra.</p> : (
          <div className="route-chain">
            {result.route.map((station, index) => {
              const visit = result.visits[index];
              const nextVisit = result.visits[index + 1];
              const isCurrentStation = index === result.route.length - 1;
              const completedStaySeconds = visit && nextVisit ? Math.max(0, (nextVisit.arrivedAtMs - visit.arrivedAtMs) / 1000) : 0;
              const shownStaySeconds = station.id === 'earth' ? 0 : isCurrentStation ? result.activeStayRealSeconds : completedStaySeconds;
              const shownStayYears = shownStaySeconds;
              return (
                <span key={station.id + "-" + index} className="route-stop-pill">
                  <strong>{station.shortName}</strong>
                  <small>
                    sosta: {shownStaySeconds.toLocaleString("it-IT", { maximumFractionDigits: 1 })}s
                    {shownStaySeconds > 0 && <> / {formatYears(shownStayYears)}</>}
                  </small>
                </span>
              );
            })}
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

          <div className="result-detail-grid">
            <div>
              <span>Tempo viaggio sulla Terra</span>
              <strong>{formatYears(result.travelEarthYears)}</strong>
            </div>
            <div>
              <span>Tempo viaggio per il viaggiatore</span>
              <strong>{formatYears(result.travelTravelerYears)}</strong>
            </div>
            <div>
              <span>Tempo soste sulla Terra</span>
              <strong>{formatYears(result.stayEarthYears)}</strong>
            </div>
            <div>
              <span>Tempo soste per il viaggiatore</span>
              <strong>{formatYears(result.stayTravelerYears)}</strong>
            </div>
            <div>
              <span>Distanza cosmica percorsa</span>
              <strong>{formatDistance(result.cosmicDistanceLightYears)}</strong>
            </div>
            <div>
              <span>Conseguenza finale</span>
              <strong>{formatYears(result.ageDifferenceYears)} di differenza</strong>
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
