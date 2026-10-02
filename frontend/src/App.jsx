import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Landing from "./components/Landing";
import TerritoryMap from "./components/TerritoryMap";
import { mockPlayer, mockBattles } from "./data/mockData";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import TestReveal from "./pages/TestReveal";

function MapPage() {
  const [battles, setBattles] = useState(mockBattles);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0f1722" }}>
      <div className="map-screen">
        <TerritoryMap
          player={mockPlayer}
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
