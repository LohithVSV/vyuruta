// One place for every backend call. Import { api } and use api.me(), api.cities(), etc.
export const API_BASE_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "vyuruta_access_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_URL is not configured.", 0);
  }
  return API_BASE_URL.replace(/\/+$/, "");
}

function errorMessage(data, fallback) {
  const d = data && data.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d.length) return d.map((x) => x.msg).join(", ");
  return fallback;
}

export async function apiFetch(
  path,
  { method = "GET", body, auth = true, redirectOnUnauthorized = true } = {},
) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (res.status === 401 && auth) {
    // Token missing/expired: log out and send to login.
    clearToken();
    if (redirectOnUnauthorized && window.location.pathname !== "/auth") {
      window.location.href = "/auth";
    }
  }
  if (!res.ok) {
    throw new ApiError(errorMessage(data, `Request failed (${res.status})`), res.status);
  }
  return data;
}

export const api = {
  me: (options) => apiFetch("/auth/me", options),
  usernameAvailable: (username) =>
    apiFetch(`/auth/username-availability?username=${encodeURIComponent(username)}`, {
      auth: false,
    }),
  cities: () => apiFetch("/cities"),
  myCity: () => apiFetch("/cities/mine"),

  myBattles: () => apiFetch("/battles/mine"),
  quickPlayStatus: () => apiFetch("/quick-play/queue"),
  joinQuickPlay: (difficulty) =>
    apiFetch("/quick-play/queue", { method: "POST", body: { difficulty } }),
  cancelQuickPlay: () =>
    apiFetch("/quick-play/queue", { method: "DELETE" }),
  proposeBattle: (city_id, proposed_time, difficulty) =>
    apiFetch("/battles", { method: "POST", body: { city_id, proposed_time, difficulty } }),
  acceptBattle: (id) => apiFetch(`/battles/${id}/accept`, { method: "POST" }),
  joinBattle: (id) => apiFetch(`/battles/${id}/join`, { method: "POST" }),
  rejectBattle: (id) => apiFetch(`/battles/${id}/reject`, { method: "POST" }),

  mySprints: () => apiFetch("/sprints/mine"),
  dailyTreasure: () => apiFetch("/treasure/daily"),
  claimDailyTreasure: () =>
    apiFetch("/treasure/daily/claim", { method: "POST" }),
  treasureHistory: (limit = 10) =>
    apiFetch(`/treasure/history?limit=${limit}`),
  problem: (id) => apiFetch(`/problems/${id}`),
  runSprint: (id, code) =>
    apiFetch(`/sprints/${id}/run`, { method: "POST", body: { code } }),
  submitSprint: (id, code) =>
    apiFetch(`/sprints/${id}/submit`, { method: "POST", body: { code } }),
  forfeitSprint: (id) =>
    apiFetch(`/sprints/${id}/forfeit`, { method: "POST" }),

  weeklyLeaderboard: (limit = 20) =>
    apiFetch(`/leaderboard/weekly?limit=${limit}`),
  seasonLeaderboard: () => apiFetch("/leaderboard/season"),
  leaderboard: (period = "weekly", world = "all", limit = 100) =>
    apiFetch(
      `/leaderboard/rankings?period=${encodeURIComponent(period)}&world=${encodeURIComponent(world)}&limit=${limit}`,
    ),
  dailyChallenge: () => apiFetch("/daily-challenges/today"),
  runDailyChallenge: (code) =>
    apiFetch("/daily-challenges/today/run", { method: "POST", body: { code } }),
  submitDailyChallenge: (code) =>
    apiFetch("/daily-challenges/today/submit", { method: "POST", body: { code } }),
  forfeitDailyChallenge: () =>
    apiFetch("/daily-challenges/today/forfeit", { method: "POST" }),
  dailyChallengeLeaderboard: () =>
    apiFetch("/daily-challenges/today/leaderboard"),
  recentBattles: () => apiFetch("/battles/recent"),
};