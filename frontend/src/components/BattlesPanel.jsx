import { useState } from "react";
import "./panels.css";
import { DEFAULT_TERMS } from "../data/mockData";

const STATUS_LABEL = {
  proposed: "Awaiting terms response",
  terms_accepted: "Awaiting time slot response",
  scheduled: "Scheduled",
  rejected: "Rejected",
  done: "Finished",
};

export default function BattlesPanel({
  battles,
  setBattles,
  players,
  challengeTarget, // city object from the map, or null
  clearChallenge,
  myName,
}) {
  const [opponent, setOpponent] = useState("");
  const [minutes, setMinutes] = useState(DEFAULT_TERMS.minutes);
  const [questions, setQuestions] = useState(DEFAULT_TERMS.questions);
  const [slot, setSlot] = useState("");

  const update = (id, status) =>
    setBattles((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));

  const propose = () => {
    if (!slot.trim()) return alert("Enter a time slot");
    const targetName =
      challengeTarget?.ownerName || opponent || players[0]?.name || "Unknown";
    const cityName = challengeTarget?.name || "Unknown city";
    setBattles((bs) => [
      {
        id: "b" + Date.now(),
        direction: "outgoing",
        opponent: targetName,
        cityName,
        status: "proposed",
        terms: { format: "DSA Sprint", questions: Number(questions), minutes: Number(minutes) },
        slot,
      },
      ...bs,
    ]);
    setSlot("");
    clearChallenge();
  };

  return (
    <div className="panel">
      {challengeTarget && (
        <section className="card">
          <h3 className="card-title">Challenge for {challengeTarget.name}</h3>
          <label className="field">
            Opponent
            <select
              value={opponent || challengeTarget.ownerName || ""}
              onChange={(e) => setOpponent(e.target.value)}
            >
              {players.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
          <div className="row">
            <label className="field">
              Questions
              <input type="number" min="1" max="5" value={questions}
                onChange={(e) => setQuestions(e.target.value)} />
            </label>
            <label className="field">
              Minutes
              <input type="number" min="10" max="90" value={minutes}
                onChange={(e) => setMinutes(e.target.value)} />
            </label>
          </div>
          <label className="field">
            Proposed time slot
            <input type="text" placeholder="e.g. Sat, 6:00 PM" value={slot}
              onChange={(e) => setSlot(e.target.value)} />
          </label>
          <div className="row">
            <button className="btn primary" onClick={propose}>Send challenge</button>
            <button className="btn" onClick={clearChallenge}>Cancel</button>
          </div>
        </section>
      )}

      <h3 className="section-title">Your battles</h3>
      {battles.length === 0 && <p className="muted">No battles yet. Pick a city on the map.</p>}

      {battles.map((b) => (
        <section key={b.id} className="card">
          <div className="battle-top">
            <b>{b.direction === "incoming" ? `${b.opponent} challenges you` : `You challenged ${b.opponent}`}</b>
            <span className={`pill ${b.status}`}>{STATUS_LABEL[b.status]}</span>
          </div>
          <p className="muted small">
            {b.cityName} · {b.terms.format} · {b.terms.questions} Qs · {b.terms.minutes} min
          </p>
          <p>🕒 {b.slot}</p>

          {b.direction === "incoming" && b.status === "proposed" && (
            <div className="row">
              <button className="btn primary" onClick={() => update(b.id, "terms_accepted")}>Accept terms</button>
              <button className="btn danger" onClick={() => update(b.id, "rejected")}>Reject</button>
            </div>
          )}
          {b.direction === "incoming" && b.status === "terms_accepted" && (
            <div className="row">
              <button className="btn primary" onClick={() => update(b.id, "scheduled")}>Accept time</button>
              <button className="btn danger" onClick={() => update(b.id, "rejected")}>Reject</button>
            </div>
          )}
          {b.direction === "outgoing" && ["proposed", "terms_accepted"].includes(b.status) && (
            <div className="row">
              <span className="muted small">Waiting for {b.opponent}…</span>
              {/* DEV ONLY: simulate the opponent answering. Remove when the backend exists. */}
              <button className="btn small-btn" onClick={() =>
                update(b.id, b.status === "proposed" ? "terms_accepted" : "scheduled")}>
                (dev) opponent accepts
              </button>
            </div>
          )}
          {b.status === "scheduled" && (
            <button className="btn primary" disabled>Battle room (coming soon)</button>
          )}
        </section>
      ))}
    </div>
  );
}