import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Landing from "./components/Landing";
import TerritoryMap from "./components/TerritoryMap";
import { api, getToken } from "./api";
import AuthPage from "./pages/AuthPage";
import CodingBattlePage from "./pages/CodingBattlePage";
import DailyQuestionPage from "./pages/DailyQuestionPage";
import DailyQuestionLeaderboardPage from "./pages/DailyQuestionLeaderboardPage";
import HomePage from "./pages/HomePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import TestReveal from "./pages/TestReveal";

const centered = {
  position: "fixed",
  inset: 0,
  background: "#0f1722",
  color: "#e8eef7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "sans-serif",
  textAlign: "center",
  padding: 24,
};

function formatBattles(battles, cities, userId) {
  return battles.map((battle) => {
    const outgoing = String(battle.challenger_id) === String(userId);
    const opponentId = outgoing ? battle.opponent_id : battle.challenger_id;
    const city = outgoing
      ? cities.find((entry) => entry.id === battle.city_id)
      : cities.find((entry) => String(entry.owner_id) === String(opponentId));
    return {
      ...battle,
      direction: outgoing ? "outgoing" : "incoming",
      opponent:
        cities.find((entry) => String(entry.owner_id) === String(opponentId))
          ?.owner_username ?? `Player ${opponentId}`,
      cityName: city?.name ?? "Unknown city",
    };
  });
}

function MapPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null); // { player, cities }
  const [error, setError] = useState("");
  const [battleRefreshError, setBattleRefreshError] = useState("");
  const [battles, setBattles] = useState([]);
  const mapPlayerId = data?.player.id;
  const mapCities = data?.cities;

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return;
    }
    let cancelled = false;
    Promise.all([
      api.me(),
      api.myCity().catch(() => null),
      api.cities(),
      api.myBattles(),
    ])
      .then(([me, myCity, cities, myBattles]) => {
        if (cancelled) return;
        setData({
          cities,
          player: {
            id: me.id,
            name: me.username,
            city: myCity ? { id: myCity.map_id, name: myCity.name } : null,
            currency: me.currency,
            wins: me.wins,
            losses: me.losses,
            streak: me.win_streak,
          },
        });
        setBattles(formatBattles(myBattles, cities, me.id));
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!mapCities || mapPlayerId == null) return undefined;

    let cancelled = false;
    let refreshing = false;
    const refreshBattles = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const [me, currentBattles] = await Promise.all([
          api.me(),
          api.myBattles(),
        ]);
        if (cancelled) return;
        setBattles(formatBattles(currentBattles, mapCities, mapPlayerId));
        setData((current) => current ? {
          ...current,
          player: {
            ...current.player,
            currency: me.currency,
            wins: me.wins,
            losses: me.losses,
            streak: me.win_streak,
          },
        } : current);
        setBattleRefreshError("");
      } catch (refreshError) {
        if (!cancelled) setBattleRefreshError(refreshError.message);
      } finally {
        refreshing = false;
      }
    };

    const interval = window.setInterval(refreshBattles, 2000);
    window.addEventListener("focus", refreshBattles);
    document.addEventListener("visibilitychange", refreshBattles);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshBattles);
      document.removeEventListener("visibilitychange", refreshBattles);
    };
  }, [mapCities, mapPlayerId]);

  // "agni-1-3" -> who owns it
  const owners = useMemo(() => {
    const map = {};
    (mapCities || []).forEach((c) => {
      if (c.owner_id && c.map_id) {
        map[c.map_id] = {
          ownerId: c.owner_id,
          ownerName: c.owner_username,
          cityName: c.name,
          cityDbId: c.id,
        };
      }
    });
    return map;
  }, [mapCities]);

  if (error) return <div style={centered}>Couldn't load the map: {error}</div>;
  if (!data) return <div style={centered}>Loading map…</div>;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0f1722" }}>
      <div className="map-screen">
        <TerritoryMap
          player={data.player}
          owners={owners}
          battles={battles}
          setBattles={setBattles}
          battleRefreshError={battleRefreshError}
        />
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  return <Landing onGetStarted={() => navigate("/auth")} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reveal/:element/:city" element={<TestReveal />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/daily-question" element={<DailyQuestionPage />} />
        <Route
          path="/daily-question/leaderboard"
          element={<DailyQuestionLeaderboardPage />}
        />
        <Route path="/battle/:battleId" element={<CodingBattlePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}