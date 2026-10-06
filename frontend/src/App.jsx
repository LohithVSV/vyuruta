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
import HomePage from "./pages/HomePage";
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

function MapPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null); // { player, cities }
  const [error, setError] = useState("");
  // Battles still local for now; wired to the backend in the next step.
  const [battles, setBattles] = useState([]);

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return;
    }
    let cancelled = false;
    Promise.all([api.me(), api.myCity().catch(() => null), api.cities()])
      .then(([me, myCity, cities]) => {
        if (cancelled) return;
        setData({
          cities,
          player: {
            id: me.id,
            name: me.username,
            city: myCity ? { id: myCity.map_id, name: myCity.name } : null,
            currency: me.currency,
            wins: 0, // TODO: needs a stats endpoint
            losses: 0,
            streak: me.win_streak,
          },
        });
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // "agni-1-3" -> who owns it
  const owners = useMemo(() => {
    const map = {};
    (data?.cities || []).forEach((c) => {
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
  }, [data]);

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
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}