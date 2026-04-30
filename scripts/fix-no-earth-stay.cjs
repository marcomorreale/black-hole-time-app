const fs = require('fs');

const missionPath = 'src/logic/mission.ts';
let mission = fs.readFileSync(missionPath, 'utf8');

mission = mission.replace(
  "    const station = stationById.get(visits[index].stationId);\n    if (!station) continue;\n    const realSeconds = Math.max(0, (visits[index + 1].arrivedAtMs - visits[index].arrivedAtMs) / 1000);",
  "    const station = stationById.get(visits[index].stationId);\n    if (!station) continue;\n    if (station.id === 'earth') continue;\n    const realSeconds = Math.max(0, (visits[index + 1].arrivedAtMs - visits[index].arrivedAtMs) / 1000);"
);

mission = mission.replace(
  "  const lastVisit = visits.at(-1);\n  if (!lastVisit) return 0;\n\n  const hasOnlyInitialEarth = visits.length === 1 && lastVisit.stationId === 'earth';\n  if (hasOnlyInitialEarth) return 0;\n\n  const hasReturnedToEarth =\n    visits.length >= 3 && visits[0]?.stationId === 'earth' && lastVisit.stationId === 'earth';\n  if (hasReturnedToEarth) return 0;\n\n  return Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);",
  "  const lastVisit = visits.at(-1);\n  if (!lastVisit) return 0;\n  if (lastVisit.stationId === 'earth') return 0;\n\n  return Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);"
);

mission = mission.replace(
  "  const lastVisit = visits.at(-1);\n  if (!lastVisit) return 0;\n  return Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);",
  "  const lastVisit = visits.at(-1);\n  if (!lastVisit) return 0;\n  if (lastVisit.stationId === 'earth') return 0;\n  return Math.max(0, (nowMs - lastVisit.arrivedAtMs) / 1000);"
);

fs.writeFileSync(missionPath, mission, 'utf8');

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

app = app.replace(
  "              const shownStaySeconds = isCurrentStation ? result.activeStayRealSeconds : completedStaySeconds;\n              const shownStayYears = shownStaySeconds;",
  "              const shownStaySeconds = station.id === 'earth' ? 0 : isCurrentStation ? result.activeStayRealSeconds : completedStaySeconds;\n              const shownStayYears = shownStaySeconds;"
);

app = app.replace(
  "<small>{formatYears(result.activeStayEarthYears)} simulati</small>",
  "<small>{result.currentStation?.id === 'earth' ? 'cronometro fermo' : `${formatYears(result.activeStayEarthYears)} simulati`}</small>"
);

fs.writeFileSync(appPath, app, 'utf8');

console.log('Earth stay excluded from stay-time calculations.');
