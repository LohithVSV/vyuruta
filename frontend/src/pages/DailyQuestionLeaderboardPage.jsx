import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vyurutaLogo from "../assets/landing/logo.png";
import { api, getToken } from "../api";
import "./CodingBattlePage.css";
import "./DailyQuestionPage.css";

function formatDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    dateStyle: "full",
    timeZone: "UTC",
  });
}

function formatSolveTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

export default function DailyQuestionLeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return undefined;
    }

    let cancelled = false;
    api.dailyChallengeLeaderboard()
      .then((result) => {
        if (!cancelled) {
          setLeaderboard(result);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <main className="coding-room coding-room--state">
        <section className="coding-room__state-card" role="alert">
          <span className="coding-room__eyebrow">DAILY RANKINGS</span>
          <h1>Leaderboard unavailable</h1>
          <p>
            {error.includes("Solve today's")
              ? "Solve today's question or forfeit to unlock this leaderboard."
              : error}
          </p>
          <button
            type="button"
            className="coding-room__button coding-room__button--quiet"
            onClick={() => navigate("/daily-question")}
          >
            Return to today's question
          </button>
        </section>
      </main>
    );
  }

  if (!leaderboard) {
    return (
      <main className="coding-room coding-room--state" role="status">
        <div className="coding-room__loading-mark" />
        <p>Loading today's leaderboard...</p>
      </main>
    );
  }

  return (
    <main className="coding-room daily-room">
      <header className="coding-room__topbar">
        <div className="coding-room__brand-group">
          <button
            type="button"
            className="coding-room__brand"
            onClick={() => navigate("/home")}
            aria-label="Return to dashboard"
          >
            <img src={vyurutaLogo} alt="Vyuruta" />
          </button>
          <nav className="coding-room__nav" aria-label="Main navigation">
            <button type="button" onClick={() => navigate("/home")}>Dashboard</button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => navigate("/daily-question")}>Daily question</button>
            <span aria-hidden="true">/</span>
            <span>Leaderboard</span>
          </nav>
        </div>
        <div className="coding-room__schedule">
          <span>DAILY REWARD</span>
          <strong>{leaderboard.reward.toLocaleString()} treasure</strong>
        </div>
        <div className="daily-room__date">
          <span>QUESTION FOR</span>
          <strong>{formatDate(leaderboard.challenge_date)}</strong>
        </div>
      </header>

      <section className="daily-leaderboard">
        <div className="daily-leaderboard__heading">
          <span className="coding-room__eyebrow">TODAY'S CHALLENGE</span>
          <h1>Daily leaderboard</h1>
          <p>Solvers rank by completion time. Forfeits are listed after everyone who solved it.</p>
        </div>
        {leaderboard.entries.length === 0 ? (
          <p className="daily-leaderboard__empty">No one has completed today's challenge yet.</p>
        ) : (
          <ol className="daily-leaderboard__list">
            {leaderboard.entries.map((entry) => (
              <li
                key={`${entry.rank}-${entry.username}`}
                className={`daily-leaderboard__row${entry.status === "forfeited" ? " is-forfeited" : ""}`}
              >
                <span className="daily-leaderboard__rank">
                  {String(entry.rank).padStart(2, "0")}
                </span>
                <strong className="daily-leaderboard__name">@{entry.username}</strong>
                <span className="daily-leaderboard__result">
                  {entry.status === "solved"
                    ? `Solved · ${formatSolveTime(entry.solve_time_seconds ?? 0)}`
                    : "Forfeited"}
                </span>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          className="coding-room__button coding-room__button--quiet daily-leaderboard__back"
          onClick={() => navigate("/daily-question")}
        >
          Back to daily question
        </button>
      </section>
    </main>
  );
}
