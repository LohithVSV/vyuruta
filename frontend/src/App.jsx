import TerritoryMap from './components/TerritoryMap';
import './App.css';

export default function App() {
  return (
    <div className="hud">
      <header className="hud-topbar">
        <span className="hud-wordmark">VYURUTA</span>
        <div className="hud-factions">
          <span className="faction-tag faction-agni">AGNI · 148</span>
          <span className="faction-tag faction-jal">JAL · 152</span>
        </div>
      </header>

      <main className="hud-main">
        <TerritoryMap />

        <aside className="hud-panel">
          <div className="panel-block">
            <p className="panel-label">Your city</p>
            <p className="panel-value">Agni-095</p>
          </div>
          <div className="panel-block">
            <p className="panel-label">XP</p>
            <p className="panel-value">1,240</p>
          </div>
          <div className="panel-block">
            <p className="panel-label">Win streak</p>
            <p className="panel-value">2</p>
          </div>
        </aside>
      </main>
    </div>
  );
}