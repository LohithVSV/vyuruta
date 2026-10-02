import "./panels.css";
import ActivityFeed from "./ActivityFeed";

export default function ProfilePanel({ player, history, feed }) {
  return (
    <div className="panel">
      <section className="card profile-head">
        <div className="avatar">{player.name[0]}</div>
        <div>
          <h2 className="name">{player.name}</h2>
          <p className="muted">
            Holds <b>{player.city.name}</b>
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <Stat label="Currency" value={`🪙 ${player.currency}`} />
        <Stat label="Wins" value={player.wins} />
        <Stat label="Losses" value={player.losses} />
        <Stat label="Streak" value={`🔥 ${player.streak}`} />
      </section>

      {player.taxMode === "tax" && (
        <p className="notice">You are paying 1% tribute. Win a rematch to reclaim your city.</p>
      )}

      <ActivityFeed items={history} title="Your history" />
      <ActivityFeed items={feed} title="Campus activity" />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="muted small">{label}</div>
    </div>
  );
}