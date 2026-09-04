const FIRE_CLUSTERS = [
  { name: "Emberfall", cx: 150, cy: 200, faction: "fire" },
  { name: "Cinderspire", cx: 480, cy: 130, faction: "fire" },
  { name: "Pyregate", cx: 620, cy: 380, faction: "fire" },
  { name: "Scorchhold", cx: 420, cy: 650, faction: "fire" },
  { name: "Wraithflame", cx: 110, cy: 560, faction: "fire" },
];

const WATER_CLUSTERS = [
  { name: "Tidefall", cx: 980, cy: 200, faction: "water" },
  { name: "Frostspire", cx: 1320, cy: 130, faction: "water" },
  { name: "Wavegate", cx: 1460, cy: 380, faction: "water" },
  { name: "Depthhold", cx: 1280, cy: 650, faction: "water" },
  { name: "Wraithcurrent", cx: 1020, cy: 560, faction: "water" },
];

export const CLUSTERS = [...FIRE_CLUSTERS, ...WATER_CLUSTERS];

function scatterCities(cluster, clusterIndex, count = 30) {
  const cities = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 110; // jitter ring around cluster center
    cities.push({
      id: `${cluster.faction}-${clusterIndex}-${String(i + 1).padStart(2, "0")}`,
      cluster: cluster.name,
      faction: cluster.faction,
      x: cluster.cx + Math.cos(angle) * radius,
      y: cluster.cy + Math.sin(angle) * radius,
      owner: null, // wire this up to real backend data later
    });
  }
  return cities;
}

// TEMP: random ownership for visual testing only — delete once wired to backend
function withMockOwners(cities) {
  return cities.map((c) =>
    Math.random() < 0.25 ? { ...c, owner: "mock_player" } : c
  );
}

export function generateCities({ mockOwners = false } = {}) {
  let cities = [];
  CLUSTERS.forEach((cluster, idx) => {
    cities = cities.concat(scatterCities(cluster, idx));
  });
  return mockOwners ? withMockOwners(cities) : cities;
}