import "./panels.css";

export default function ActivityFeed({ items, title = "Activity" }) {
  return (
    <section className="card">
      <h3 className="card-title">{title}</h3>
      {items.length === 0 && <p className="muted">Nothing yet.</p>}
      <ul className="feed">
        {items.map((it) => (
          <li key={it.id} className="feed-item">
            <span>{it.text}</span>
            <span className="muted small">{it.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}