const fs = require('fs');

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

// Add useRef import.
app = app.replace(
  "import { useEffect, useMemo, useState } from 'react';",
  "import { useEffect, useMemo, useRef, useState } from 'react';"
);

// Add ref and previous completion state near other hooks.
if (!app.includes('completedMissionRef')) {
  app = app.replace(
    '  const [nowMs, setNowMs] = useState(Date.now());',
    '  const [nowMs, setNowMs] = useState(Date.now());\n  const completedMissionRef = useRef<HTMLElement | null>(null);\n  const wasCompleteRef = useRef(false);'
  );
}

// Add effect after result calculation.
if (!app.includes('completedMissionRef.current?.scrollIntoView')) {
  app = app.replace(
    '  const suggestedRoutes = useMemo(() => getSuggestedRoutes(), []);',
    `  const suggestedRoutes = useMemo(() => getSuggestedRoutes(), []);

  useEffect(() => {
    if (result.isComplete && !wasCompleteRef.current) {
      window.setTimeout(() => {
        completedMissionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }

    wasCompleteRef.current = result.isComplete;
  }, [result.isComplete]);`
  );
}

// Attach ref to completed mission section.
app = app.replace(
  '<section className="panel result-card">',
  '<section ref={completedMissionRef} className="panel result-card">'
);

fs.writeFileSync(appPath, app, 'utf8');
console.log('Scroll to completed mission applied.');
