# Black Hole Time App

Web app didattica per una dimostrazione sui buchi neri: l'utente costruisce un viaggio scansionando stazioni su una mappa cosmica e l'app mostra quanto tempo passa sulla Terra e quanto tempo passa per il viaggiatore.

## Idea

- La velocita della missione e fissata a `0,5c` per isolare l'effetto del buco nero.
- La mappa contiene oggetti reali, come Luna, Plutone, Proxima Centauri e Sagittarius A*.
- Il buco nero usato nei calcoli e didattico: serve come laboratorio per mostrare l'effetto della gravita estrema sul tempo.
- La prima versione non usa ancora la fotocamera: cliccare una stazione equivale a scansionare il suo QR.

## Requisiti

- Node.js 20 o superiore consigliato
- npm

## Avvio locale

```bash
npm install
npm run dev
```

Poi apri:

```text
http://localhost:5173
```

Per provarla da un telefono Android sulla stessa rete Wi-Fi:

```bash
npm run dev
```

Poi apri dal telefono:

```text
http://IP_DEL_PC:5173
```

## Build

```bash
npm run build
npm run preview
```

## Installazione su Android come PWA

Dopo il deploy su HTTPS, per esempio Vercel o Netlify:

1. apri l'URL da Chrome Android;
2. menu con i tre puntini;
3. scegli `Installa app` o `Aggiungi a schermata Home`;
4. apri l'app dall'icona.

## Percorsi consigliati

### Controllo senza buco nero

```text
Terra -> Proxima Centauri -> Terra
```

Mostra la differenza dovuta alla sola velocita a 0,5c.

### Effetto debole del buco nero

```text
Terra -> Proxima Centauri -> Faro Einstein -> Terra
```

### Effetto forte del buco nero

```text
Terra -> Proxima Centauri -> Disco di accrescimento -> Terra
```

### Zona critica

```text
Terra -> Proxima Centauri -> Margine dell'orizzonte -> Terra
```

Questa e la demo principale per evidenziare l'impatto del buco nero.

## Prossime evoluzioni

- Scanner QR reale via fotocamera.
- Generazione QR code delle stazioni.
- Opzione `considera velocita reale`, calcolata dal tempo tra due scansioni.
- Modalita offline piu completa con service worker custom.
