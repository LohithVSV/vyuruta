// ── Structure: Realm -> State (5 per realm, 1 island image each) -> Cluster (6 per state) -> City (5 per cluster)
// 2 realms x 5 states x 6 clusters x 5 cities = 300 cities total
//
// Layout: two "X" formations of 5 islands each — fire X on the left half of
// the sea, water X on the right half — surrounded by open ocean, so zooming
// out shows mostly sea with two small island clusters, not a packed grid.

const TILE_SIZE = 500; // px each island renders at, in SVG units

export const VIEWBOX_WIDTH = 6000;
export const VIEWBOX_HEIGHT = 4000;

const FIRE_CLUSTER_CENTER = { x: 1500, y: 2000 };
const WATER_CLUSTER_CENTER = { x: 4500, y: 2000 };
const X_RADIUS = 550; // distance from cluster center to each corner island

// top-left, top-right, center, bottom-left, bottom-right — the "X" shape
const X_OFFSETS = [
  { dx: -X_RADIUS, dy: -X_RADIUS },
  { dx: X_RADIUS, dy: -X_RADIUS },
  { dx: 0, dy: 0 },
  { dx: -X_RADIUS, dy: X_RADIUS },
  { dx: X_RADIUS, dy: X_RADIUS },
];

function xLayout(center) {
  return X_OFFSETS.map(({ dx, dy }) => ({
    tileX: center.x + dx - TILE_SIZE / 2,
    tileY: center.y + dy - TILE_SIZE / 2,
  }));
}

const FIRE_STATES = [
  { name: "Emberfall",   image: "firestate1" },
  { name: "Cinderspire", image: "firestate2" },
  { name: "Pyregate",    image: "firestate3" },
  { name: "Scorchhold",  image: "firestate4" },
  { name: "Wraithflame", image: "firestate5" },
];

const WATER_STATES = [
  { name: "Tidefall",      image: "waterstate1" },
  { name: "Frostspire",    image: "waterstate2" },
  { name: "Wavegate",      image: "waterstate3" },
  { name: "Depthhold",     image: "waterstate4" },
  { name: "Wraithcurrent", image: "waterstate5" },
];

const fireLayout = xLayout(FIRE_CLUSTER_CENTER);
const waterLayout = xLayout(WATER_CLUSTER_CENTER);

export const STATES = [
  ...FIRE_STATES.map((s, i) => ({
    ...s,
    faction: "fire",
    tileX: fireLayout[i].tileX,
    tileY: fireLayout[i].tileY,
    tileSize: TILE_SIZE,
  })),
  ...WATER_STATES.map((s, i) => ({
    ...s,
    faction: "water",
    tileX: waterLayout[i].tileX,
    tileY: waterLayout[i].tileY,
    tileSize: TILE_SIZE,
  })),
];

// Six cluster anchors as % of the island image's width/height — from your placement table
const CLUSTER_ANCHORS = [
  { x: 22, y: 14 },
  { x: 68, y: 15 },
  { x: 18, y: 48 },
  { x: 78, y: 42 },
  { x: 30, y: 78 },
  { x: 68, y: 80 },
];

const CITIES_PER_CLUSTER = 5;
const CLUSTER_SPREAD_PCT = 4.2;

function cityOffset(cityIndex) {
  const angle = (cityIndex / CITIES_PER_CLUSTER) * Math.PI * 2 - Math.PI / 2;
  return {
    dx: Math.cos(angle) * CLUSTER_SPREAD_PCT,
    dy: Math.sin(angle) * CLUSTER_SPREAD_PCT,
  };
}

function buildStateCities(state, realmPrefix, startNumber) {
  const cities = [];
  let cityCounter = startNumber;

  CLUSTER_ANCHORS.forEach((anchor, clusterIdx) => {
    for (let c = 0; c < CITIES_PER_CLUSTER; c++) {
      const { dx, dy } = cityOffset(c);
      const pctX = anchor.x + dx;
      const pctY = anchor.y + dy;
      const numStr = String(cityCounter).padStart(3, "0");

      cities.push({
        id: `${realmPrefix}-${numStr}`,
        state: state.name,
        cluster: clusterIdx + 1,
        faction: state.faction,
        x: state.tileX + (pctX / 100) * state.tileSize,
        y: state.tileY + (pctY / 100) * state.tileSize,
        owner: null,
      });
      cityCounter++;
    }
  });

  return cities;
}

// TEMP: random ownership for visual testing only — delete once wired to backend
function withMockOwners(cities) {
  return cities.map((c) =>
    Math.random() < 0.3 ? { ...c, owner: "mock_player" } : c
  );
}

export function generateMap({ mockOwners = false } = {}) {
  let allCities = [];

  STATES.forEach((state, idx) => {
    const realmPrefix = state.faction === "fire" ? "AGNI" : "JALA";
    const localIdx = idx % 5;
    allCities = allCities.concat(buildStateCities(state, realmPrefix, localIdx * 30 + 1));
  });

  return {
    cities: mockOwners ? withMockOwners(allCities) : allCities,
  };
}