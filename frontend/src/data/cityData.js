// ── Structure: Realm -> State (5 per realm) -> Sub-cluster (6 per state) -> City (5 per sub-cluster)
// 2 realms x 5 states x 6 sub-clusters x 5 cities = 300 cities total

const FIRE_STATES = [
  { name: "Emberfall", cx: 260, cy: 260 },
  { name: "Cinderspire", cx: 700, cy: 150 },
  { name: "Pyregate", cx: 880, cy: 480 },
  { name: "Scorchhold", cx: 640, cy: 850 },
  { name: "Wraithflame", cx: 210, cy: 720 },
];

const WATER_STATES = [
  { name: "Tidefall", cx: 1740, cy: 260 },
  { name: "Frostspire", cx: 1300, cy: 150 },
  { name: "Wavegate", cx: 1120, cy: 480 },
  { name: "Depthhold", cx: 1360, cy: 850 },
  { name: "Wraithcurrent", cx: 1790, cy: 720 },
];

export const STATES = [
  ...FIRE_STATES.map((s) => ({ ...s, faction: "fire" })),
  ...WATER_STATES.map((s) => ({ ...s, faction: "water" })),
];

const SUBCLUSTERS_PER_STATE = 6;
const CITIES_PER_SUBCLUSTER = 5;

function buildStateCities(state, realmPrefix, startNumber) {
  const cities = [];
  const subClusters = [];
  let cityCounter = startNumber;

  for (let s = 0; s < SUBCLUSTERS_PER_STATE; s++) {
    const subAngle = (s / SUBCLUSTERS_PER_STATE) * Math.PI * 2 + Math.random() * 0.3;
    const subRadius = 100 + Math.random() * 30;
    const subCx = state.cx + Math.cos(subAngle) * subRadius;
    const subCy = state.cy + Math.sin(subAngle) * subRadius;

    const subCluster = {
      id: `${state.name}-sub-${s + 1}`,
      name: `Sub-Cluster ${s + 1}`,
      state: state.name,
      faction: state.faction,
      cx: subCx,
      cy: subCy,
    };
    subClusters.push(subCluster);

    for (let c = 0; c < CITIES_PER_SUBCLUSTER; c++) {
      const cityAngle = (c / CITIES_PER_SUBCLUSTER) * Math.PI * 2 + Math.random() * 0.4;
      const cityRadius = 28 + Math.random() * 22;
      const numStr = String(cityCounter).padStart(3, "0");

      cities.push({
        id: `${realmPrefix}-${numStr}`,
        state: state.name,
        subCluster: subCluster.name,
        faction: state.faction,
        x: subCx + Math.cos(cityAngle) * cityRadius,
        y: subCy + Math.sin(cityAngle) * cityRadius,
        owner: null,
      });
      cityCounter++;
    }
  }

  return { cities, subClusters };
}

// TEMP: random ownership for visual testing only — delete once wired to backend
function withMockOwners(cities) {
  return cities.map((c) =>
    Math.random() < 0.3 ? { ...c, owner: "mock_player" } : c
  );
}

export function generateMap({ mockOwners = false } = {}) {
  let allCities = [];
  let allSubClusters = [];

  FIRE_STATES.forEach((state, idx) => {
    const { cities, subClusters } = buildStateCities(
      { ...state, faction: "fire" },
      "AGNI",
      idx * 30 + 1
    );
    allCities = allCities.concat(cities);
    allSubClusters = allSubClusters.concat(subClusters);
  });

  WATER_STATES.forEach((state, idx) => {
    const { cities, subClusters } = buildStateCities(
      { ...state, faction: "water" },
      "JALA",
      idx * 30 + 1
    );
    allCities = allCities.concat(cities);
    allSubClusters = allSubClusters.concat(subClusters);
  });

  return {
    cities: mockOwners ? withMockOwners(allCities) : allCities,
    subClusters: allSubClusters,
  };
}