import { Camera, CheckCircle2, Keyboard, Square, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { stations } from '../data/stations';

type QrScannerProps = {
  onScan: (stationId: string) => void;
};

const stationIds = new Set(stations.map((station) => station.id));

export default function QrScanner({ onScan }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Scanner pronto. Puoi usare la fotocamera o inserire il codice manualmente.');
  const [manualCode, setManualCode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  useEffect(() => stopScanner, []);

  const handleDecodedText = (text: string) => {
    const stationId = parseStationId(text);
    if (!stationId || !stationIds.has(stationId)) {
      setStatus('QR letto, ma non corrisponde a una stazione valida.');
      setFeedback({
        type: 'error',
        title: 'QR non valido',
        message: 'Questo codice non corrisponde a una stazione della mappa.'
      });
      return;
    }

    const station = stations.find((item) => item.id === stationId);
    onScan(stationId);
    setFeedback({
      type: 'success',
      title: 'Stazione acquisita',
      message: station ? `${station.name} - ${station.distanceFromEarthLightYears ?? 0} anni luce dalla Terra` : stationId
    });
    setStatus('Stazione acquisita: ' + (station?.name ?? stationId));
    setManualCode('');
    stopScanner();
  };

  const startScanner = async () => {
    try {
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setStatus('Questo browser non supporta la lettura QR nativa. Usa Chrome Android oppure il codice manuale.');
        setFeedback({
          type: 'error',
          title: 'Scanner non disponibile',
          message: 'Usa Chrome Android oppure inserisci il codice manualmente.'
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      setIsScanning(true);
      setStatus('Inquadra il QR della stazione.');

      const scanLoop = async () => {
        const activeVideo = videoRef.current;
        if (!activeVideo || !streamRef.current) return;

        try {
          const codes = await detector.detect(activeVideo);
          if (codes.length > 0 && codes[0].rawValue) {
            handleDecodedText(codes[0].rawValue);
            return;
          }
        } catch {
          // Some frames can fail while the camera initializes. Keep scanning.
        }

        frameRef.current = window.setTimeout(scanLoop, 350) as unknown as number;
      };

      scanLoop();
    } catch (error) {
      console.error(error);
      setStatus('Impossibile avviare la fotocamera. Controlla i permessi del browser.');
      setFeedback({
        type: 'error',
        title: 'Fotocamera non disponibile',
        message: 'Controlla i permessi del browser e riprova.'
      });
      stopScanner();
    }
  };

  function stopScanner() {
    if (frameRef.current !== null) {
      window.clearTimeout(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }

  const submitManualCode = () => {
    handleDecodedText(manualCode);
  };

  return (
    <section className="panel qr-panel">
      <div>
        <div className="section-title">
          <Camera size={20} />
          <h2>Lettura QR stazioni</h2>
        </div>
        <p className="muted">Scansiona il QR stampato sulla stazione. Il tempo di sosta parte dalla stazione selezionata e si chiude alla lettura successiva.</p>
      </div>

      <div className="qr-actions">
        <button className="secondary-button" type="button" onClick={isScanning ? stopScanner : startScanner}>
          {isScanning ? <Square size={18} /> : <Camera size={18} />}
          {isScanning ? 'Ferma scanner' : 'Scansiona QR'}
        </button>
        <div className="manual-qr-row">
          <Keyboard size={18} />
          <input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="station-c oppure URL QR" />
          <button className="secondary-button" type="button" onClick={submitManualCode}>Usa codice</button>
        </div>
      </div>

      <video ref={videoRef} className={isScanning ? 'qr-video active' : 'qr-video'} muted playsInline />
      <p className="qr-status">{status}</p>

      {feedback && (
        <div className={`scan-feedback-popup ${feedback.type}`} role="status">
          <div className="scan-feedback-icon">
            {feedback.type === 'success' ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
          </div>
          <div>
            <strong>{feedback.title}</strong>
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} aria-label="Chiudi popup">×</button>
        </div>
      )}
    </section>
  );
}

function parseStationId(text: string): string | null {
  const value = text.trim();
  if (!value) return null;

  if (stationIds.has(value)) return value;

  if (value.startsWith('station:')) {
    const stationId = value.slice('station:'.length);
    return stationIds.has(stationId) ? stationId : null;
  }

  try {
    const url = new URL(value);
    const queryStation = url.searchParams.get('station');
    if (queryStation && stationIds.has(queryStation)) return queryStation;

    const pathStation = url.pathname.split('/').filter(Boolean).at(-1);
    if (pathStation && stationIds.has(pathStation)) return pathStation;
  } catch {
    return null;
  }

  return null;
}
