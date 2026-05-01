const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (filePath) => fs.readFileSync(path.join(root, filePath), 'utf8');
const write = (filePath, content) => fs.writeFileSync(path.join(root, filePath), content, 'utf8');

const scannerPath = 'src/components/QrScanner.tsx';
let scanner = read(scannerPath);

scanner = scanner.replace(
  "import { Camera, Keyboard, Square } from 'lucide-react';",
  "import { Camera, CheckCircle2, Keyboard, Square, XCircle } from 'lucide-react';"
);

scanner = scanner.replace(
  "  const [manualCode, setManualCode] = useState('');",
  "  const [manualCode, setManualCode] = useState('');\n  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);"
);

scanner = scanner.replace(
  "      setStatus('QR letto, ma non corrisponde a una stazione valida.');\n      return;",
  "      setStatus('QR letto, ma non corrisponde a una stazione valida.');\n      setFeedback({\n        type: 'error',\n        title: 'QR non valido',\n        message: 'Questo codice non corrisponde a una stazione della mappa.'\n      });\n      return;"
);

scanner = scanner.replace(
  "    onScan(stationId);\n    setStatus('Stazione acquisita: ' + stationId);",
  "    const station = stations.find((item) => item.id === stationId);\n    onScan(stationId);\n    setFeedback({\n      type: 'success',\n      title: 'Stazione acquisita',\n      message: station ? `${station.name} - ${station.distanceFromEarthLightYears ?? 0} anni luce dalla Terra` : stationId\n    });\n    setStatus('Stazione acquisita: ' + (station?.name ?? stationId));"
);

scanner = scanner.replace(
  "      setStatus('Questo browser non supporta la lettura QR nativa. Usa Chrome Android oppure il codice manuale.');\n        return;",
  "      setStatus('Questo browser non supporta la lettura QR nativa. Usa Chrome Android oppure il codice manuale.');\n        setFeedback({\n          type: 'error',\n          title: 'Scanner non disponibile',\n          message: 'Usa Chrome Android oppure inserisci il codice manualmente.'\n        });\n        return;"
);

scanner = scanner.replace(
  "      setStatus('Impossibile avviare la fotocamera. Controlla i permessi del browser.');\n      stopScanner();",
  "      setStatus('Impossibile avviare la fotocamera. Controlla i permessi del browser.');\n      setFeedback({\n        type: 'error',\n        title: 'Fotocamera non disponibile',\n        message: 'Controlla i permessi del browser e riprova.'\n      });\n      stopScanner();"
);

if (!scanner.includes('scan-feedback-popup')) {
  scanner = scanner.replace(
    "      <p className=\"qr-status\">{status}</p>\n    </section>",
    "      <p className=\"qr-status\">{status}</p>\n\n      {feedback && (\n        <div className={`scan-feedback-popup ${feedback.type}`} role=\"status\">\n          <div className=\"scan-feedback-icon\">\n            {feedback.type === 'success' ? <CheckCircle2 size={30} /> : <XCircle size={30} />}\n          </div>\n          <div>\n            <strong>{feedback.title}</strong>\n            <span>{feedback.message}</span>\n          </div>\n          <button type=\"button\" onClick={() => setFeedback(null)} aria-label=\"Chiudi popup\">×</button>\n        </div>\n      )}\n    </section>"
  );
}

write(scannerPath, scanner);

const cssPath = 'src/styles.css';
let css = read(cssPath);

if (!css.includes('SCAN_FEEDBACK_POPUP')) {
  css += `

/* SCAN_FEEDBACK_POPUP */
.scan-feedback-popup {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 1000;
  width: min(520px, calc(100% - 28px));
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(2, 6, 23, 0.94);
  border: 1px solid rgba(125, 211, 252, 0.26);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.46);
  animation: scanFeedbackIn 180ms ease-out;
}

.scan-feedback-popup.success {
  border-color: rgba(34, 197, 94, 0.5);
}

.scan-feedback-popup.error {
  border-color: rgba(248, 113, 113, 0.55);
}

.scan-feedback-icon {
  color: #22c55e;
  display: flex;
}

.scan-feedback-popup.error .scan-feedback-icon {
  color: #f87171;
}

.scan-feedback-popup strong {
  display: block;
  color: #f8fafc;
  font-size: 1.05rem;
  margin-bottom: 3px;
}

.scan-feedback-popup span {
  display: block;
  color: #cbd5e1;
  line-height: 1.35;
}

.scan-feedback-popup button {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.9);
  color: #e5eefc;
  font-size: 1.25rem;
  line-height: 1;
}

@keyframes scanFeedbackIn {
  from { opacity: 0; transform: translateX(-50%) translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

@media (max-width: 520px) {
  .scan-feedback-popup {
    bottom: 14px;
    padding: 14px;
    border-radius: 18px;
  }
}
`;
}

write(cssPath, css);
console.log('Scan feedback popup applied.');
