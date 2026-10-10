import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import vyurutaLogo from "../assets/landing/logo.png";
import { api, getToken } from "../api";
import "./HomePage.css";
import "./LeaderboardPage.css";

const PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "season", label: "Season" },
];
const WORLDS = [
  { value: "all", label: "All World" },
  { value: "fire", label: "Fire World" },
  { value: "water", label: "Water World" },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("weekly");
  const [world, setWorld] = useState("all");
  const [user, setUser] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return undefined;
    }

    let cancelled = false;
    Promise.all([api.me(), api.leaderboard(period, world, 100)])
      .then(([currentUser, result]) => {
        if (cancelled) return;
        setUser(currentUser);
        setRankings(result);
        setError("");
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, period, world]);

  const entries = rankings?.entries ?? [];
  const periodLabel = PERIODS.find((item) => item.value === period)?.label;

  return (
    <div className="home leaderboard-page">
      <header className="home__topbar">
        <button
          className="home__brand"
          onClick={() => navigate("/home")}
          aria-label="Back to home"
        >
          <img src={vyurutaLogo} alt="Vyuruta" />
        </button>
        <nav className="home__nav" aria-label="Main navigation">
          <button className="home__nav-item" onClick={() => navigate("/home")}>
            Home
          </button>
          <button className="home__nav-item" onClick={() => navigate("/map")}>
            World
          </button>
          <button className="home__nav-item home__nav-item--active" onClick={() => navigate("/leaderboard")}>
            Leaderboard
          </button>
        </nav>
        <button
          className="home__map-button"
          onClick={() => navigate("/home")}
        >
          Back to home
        </button>
      </header>

      <main className="leaderboard-page__content">
        <section className="leaderboard-page__intro">
          <span className="home__eyebrow">THE RANKINGS</span>
          <h1>Leaderboard</h1>
          <p>See who is earning the most treasure across the realm.</p>
        </section>

        <section className="leaderboard-page__season" aria-label="Season length">
          <div>
            <span>SEASON FORMAT</span>
            <strong>4 weeks · 28 days</strong>
          </div>
          <div>
            <span>SEASON DATES</span>
            <strong>
              {rankings
                ? `${formatDate(rankings.season_start)} — ${formatDate(rankings.season_end)}`
                : "Loading season dates"}
            </strong>
          </div>
          <p>At the end of each season, every player's treasure balance resets to zero.</p>
        </section>

        <section className="leaderboard-page__panel">
          <div className="leaderboard-page__filters">
            <div>
              <span className="leaderboard-page__filter-label">PERIOD</span>
              <div className="leaderboard-page__tabs" role="group" aria-label="Leaderboard period">
                {PERIODS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={period === option.value ? "is-active" : ""}
                    aria-pressed={period === option.value}
                    onClick={() => {
                      setLoading(true);
                      setPeriod(option.value);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="leaderboard-page__filter-label">WORLD</span>
              <div className="leaderboard-page__tabs" role="group" aria-label="Leaderboard world">
                {WORLDS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={world === option.value ? "is-active" : ""}
                    aria-pressed={world === option.value}
                    onClick={() => {
                      setLoading(true);
                      setWorld(option.value);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="leaderboard-page__heading">
            <div>
              <span>{world === "all" ? "ALL WORLD" : `${world.toUpperCase()} WORLD`}</span>
              <h2>{periodLabel} treasure</h2>
            </div>
            <span className="leaderboard-page__count">
              {entries.length} {entries.length === 1 ? "player" : "players"}
            </span>
          </div>

          {loading ? (
            <div className="leaderboard-page__state">Loading rankings...</div>
          ) : error ? (
            <div className="leaderboard-page__state" role="alert">
              Unable to load rankings: {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="leaderboard-page__state">No rankings for this world yet.</div>
          ) : (
            <ol className="leaderboard-page__list">
              {entries.map((entry, index) => {
                const isCurrentUser = user && entry.user_id === user.id;
                return (
                  <li
                    key={entry.user_id}
                    className={isCurrentUser ? "leaderboard-page__row is-current" : "leaderboard-page__row"}
                  >
                    <span className="leaderboard-page__rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="leaderboard-page__name">
                      @{entry.username}{isCurrentUser ? " (you)" : ""}
                    </span>
                    <strong className="leaderboard-page__treasure">
                      {entry.treasure.toLocaleString()} <span>◈</span>
                    </strong>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
