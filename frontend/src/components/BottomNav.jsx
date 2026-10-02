import "./panels.css";

const TABS = [
  { id: "map", label: "Map", icon: "🗺️" },
  { id: "battles", label: "Battles", icon: "⚔️" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function BottomNav({ screen, onChange, badge = 0 }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-btn ${screen === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
          {t.id === "battles" && badge > 0 && (
            <span className="nav-badge">{badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}