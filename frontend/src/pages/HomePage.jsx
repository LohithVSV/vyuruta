// src/pages/HomePage.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import fireCharacter from "../assets/landing/fire-character.png";
import waterCharacter from "../assets/landing/water-character.png";
import vyurutaLogo from "../assets/landing/logo.png";

import { api, clearToken, getToken } from "../api";

import "./HomePage.css";

const DAILY_TREASURE_AMOUNT = 20000;

function formatTimestamp(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatCountdown(target, now) {
  const targetTime = new Date(target).getTime();
  if (Number.isNaN(targetTime)) return null;
  const totalSeconds = Math.max(0, Math.ceil((targetTime - now) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export default function HomePage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [dashboard, setDashboard] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [seasonInfo, setSeasonInfo] = useState(null);
  const [dailyTreasure, setDailyTreasure] = useState(null);
  const [dailyTreasureError, setDailyTreasureError] = useState("");
  const [claimingDailyTreasure, setClaimingDailyTreasure] = useState(false);
  const [treasureHistory, setTreasureHistory] = useState([]);
  const [treasureHistoryError, setTreasureHistoryError] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!getToken()) return undefined;

    let cancelled = false;
    const refreshDailyTreasure = () => {
      api.dailyTreasure()
        .then((status) => {
          if (!cancelled) {
            setDailyTreasure(status);
            setDailyTreasureError("");
          }
        })
        .catch((error) => {
          if (!cancelled) setDailyTreasureError(error.message);
        });
    };
    api.treasureHistory()
      .then((entries) => {
        if (!cancelled) {
          setTreasureHistory(entries);
          setTreasureHistoryError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setTreasureHistoryError(error.message);
      });
    refreshDailyTreasure();

    const interval = window.setInterval(refreshDailyTreasure, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return undefined;
    }

    let cancelled = false;

    Promise.all([
      api.me(),
      api.myBattles(),
      api.mySprints(),
      api.cities(),
      api.recentBattles(),
      api.leaderboard("weekly", "all", 100).then(
        (result) => ({ result }),
        (error) => ({ error }),
      ),
    ])
      .then(([user, battles, sprints, cities, recentBattles, rankingResult]) => {
        if (cancelled) return;
        setDashboard({ user, battles, sprints, cities, recentBattles });
        if ("error" in rankingResult) {
          setLeaderboardError(true);
          setLeaderboard([]);
        } else {
          setLeaderboardError(false);
          setLeaderboard(rankingResult.result.entries);
          setSeasonInfo({
            ...rankingResult.result,
            daysRemaining: Math.max(
              0,
              Math.ceil(
                (new Date(rankingResult.result.season_end).getTime() - Date.now()) /
                  86_400_000,
              ),
            ),
          });
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLeaderboardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!getToken()) return undefined;

    let cancelled = false;
    let refreshing = false;
    const refreshBattles = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const [user, battles, sprints] = await Promise.all([
          api.me(),
          api.myBattles(),
          api.mySprints(),
        ]);
        if (cancelled) return;
        setDashboard((current) =>
          current ? { ...current, user, battles, sprints } : current,
        );
        setRefreshError("");
      } catch (error) {
        if (!cancelled) setRefreshError(error.message);
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
  }, []);

  const ownerById = useMemo(
    () =>
      new Map(
        (dashboard?.cities ?? [])
          .filter((city) => city.owner_id != null)
          .map((city) => [city.owner_id, city.owner_username]),
      ),
    [dashboard],
  );

  if (loadError) {
    return (
      <div className="home">
        <main className="home__state" role="alert">
          <p>Unable to load your realm: {loadError}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </main>
      </div>
    );
  }
  if (!dashboard) {
    return (
      <div className="home">
        <main className="home__state" role="status">
          Loading your realm...
        </main>
      </div>
    );
  }

  const { user, battles: allBattles, sprints, cities, recentBattles } = dashboard;
  const playerCity = cities.find((city) => city.owner_id === user.id) ?? null;
  const currentBattles = allBattles.filter((battle) =>
    ["pending", "accepted"].includes(battle.status),
  );
  const finishedSprints = sprints.filter(
    (sprint) => sprint.status === "finished" && sprint.winner_id != null,
  );
  const team = {
    id: user.id,
    username: user.username,
    faction: playerCity?.faction ?? "fire",
    wins: user.wins,
    losses: user.losses,
    streak: user.win_streak,
    currency: user.currency,
  };
  const avatar = team.faction === "fire" ? fireCharacter : waterCharacter;
  const history = finishedSprints
    .map((sprint) => {
      const battle = allBattles.find((entry) => entry.id === sprint.battle_id);
      const opponentId = battle
        ? battle.challenger_id === user.id
          ? battle.opponent_id
          : battle.challenger_id
        : null;
      const won = sprint.winner_id === user.id;
      return {
        id: sprint.id,
        type: won ? "win" : "loss",
        text: `${won ? "Won" : "Lost"} a sprint${opponentId ? ` against ${ownerById.get(opponentId) ?? `Player ${opponentId}`}` : ""}`,
        time: formatTimestamp(sprint.created_at),
        createdAt: sprint.created_at,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const feed = recentBattles.map((entry) => ({
    id: entry.id,
    text: entry.text,
    time: formatTimestamp(entry.created_at),
  }));

  const currentUserIndex = leaderboard.findIndex(
    (entry) =>
      String(entry.user_id) === String(team.id) ||
      entry.username === team.username
  );

  const currentUserRank =
    currentUserIndex !== -1 ? currentUserIndex + 1 : null;

  const topTen = leaderboard.slice(0, 10);
  const seasonDaysRemaining = seasonInfo?.daysRemaining ?? null;

  const currentUserOutsideTopTen =
    currentUserRank !== null && currentUserRank > 10;
  const nextRewardCountdown =
    dailyTreasure?.claimed_today && dailyTreasure.next_claim_at
      ? formatCountdown(dailyTreasure.next_claim_at, clockNow)
      : null;

  const handleSignOut = () => {
    clearToken();
    navigate("/", { replace: true });
  };

  const handleClaimDailyTreasure = async () => {
    if (claimingDailyTreasure || dailyTreasure?.claimed_today) return;
    setClaimingDailyTreasure(true);
    setDailyTreasureError("");
    try {
      const status = await api.claimDailyTreasure();
      setDailyTreasure(status);
      setDashboard((current) =>
        current
          ? { ...current, user: { ...current.user, currency: status.currency } }
          : current,
      );
      try {
        const result = await api.leaderboard("weekly", "all", 100);
        setLeaderboard(result.entries);
        setSeasonInfo({
          ...result,
          daysRemaining: Math.max(
            0,
            Math.ceil((new Date(result.season_end).getTime() - Date.now()) / 86_400_000),
          ),
        });
        setLeaderboardError(false);
      } catch {
        setLeaderboardError(true);
      }
    } catch (error) {
      setDailyTreasureError(error.message);
    } finally {
      setClaimingDailyTreasure(false);
    }
  };

  return (
    <div className="home">

      {/* =====================================================
          TOP NAV
      ===================================================== */}

      <header
        className={`home__topbar ${scrolled ? "home__topbar--scrolled" : ""}`}
      >

        <button
          className="home__brand"
          onClick={() => navigate("/")}
          aria-label="Vyuruta home"
        >
          <img src={vyurutaLogo} alt="Vyuruta" />
        </button>

        <nav className="home__nav">

          <button
            className="home__nav-item home__nav-item--active"
            onClick={() => navigate("/home")}
          >
            Home
          </button>

          <button
            className="home__nav-item"
            onClick={() => navigate("/map")}
          >
            World
          </button>

          <button
            className="home__nav-item"
            onClick={() => navigate("/leaderboard")}
          >
            Leaderboard
          </button>

        </nav>

        <div className="home__header-actions">
          <div className="home__claim-group">
            <button
              type="button"
              className="home__claim-button"
              onClick={handleClaimDailyTreasure}
              disabled={!dailyTreasure || dailyTreasure.claimed_today || claimingDailyTreasure}
            >
              {claimingDailyTreasure
                ? "Claiming..."
                : dailyTreasure?.claimed_today
                  ? "Daily reward claimed"
                  : `Claim daily reward · ${(dailyTreasure?.amount ?? DAILY_TREASURE_AMOUNT).toLocaleString()}`}
            </button>
            {nextRewardCountdown && (
              <span className="home__reward-countdown" aria-live="off">
                Next daily reward in {nextRewardCountdown}
              </span>
            )}
          </div>
          <button
            type="button"
            className="home__map-button"
            onClick={() => navigate("/daily-question")}
          >
            Daily Question
          </button>
        </div>

      </header>

      {(dailyTreasureError || refreshError) && (
        <div className="home__header-feedback" role="status">
          {dailyTreasureError && (
            <p role="alert">Daily reward unavailable: {dailyTreasureError}</p>
          )}
          {refreshError && (
            <p>Live player stats are temporarily unavailable: {refreshError}</p>
          )}
        </div>
      )}


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="home__content">

        {/* =================================================
            LEFT / CENTER
        ================================================= */}

        <section className="home__main">

          {/* Welcome */}

          <div className="home__welcome">

            <span className="home__eyebrow">
              COMMANDER'S QUARTERS
            </span>

            <h1>
              Welcome back,
              <span>@{team.username}</span>
            </h1>

            <p>
              Your territory awaits.
            </p>

            <div className="home__season-note">
              <span>SEASON FORMAT</span>
              <strong>4 weeks · 28 days</strong>
              <span>
                {seasonDaysRemaining == null
                  ? "Season dates loading"
                  : `${seasonDaysRemaining} ${seasonDaysRemaining === 1 ? "day" : "days"} remaining · balances reset to zero at season end`}
              </span>
            </div>

          </div>


          <section className="leaderboard">
            <div className="section-heading">
              <div>
                <span className="section-heading__eyebrow">
                  TREASURE THIS WEEK · ALL WORLD
                </span>
                <h2>Leaderboard</h2>
              </div>
              <button
                className="section-action"
                onClick={() => navigate("/leaderboard")}
              >
                <span>All rankings</span>
                <span>↗</span>
              </button>
            </div>

            {leaderboardLoading ? (
              <div className="leaderboard__state">Loading rankings...</div>
            ) : leaderboardError ? (
              <div className="leaderboard__state" role="alert">
                Unable to load rankings.
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="leaderboard__state">No rankings yet.</div>
            ) : (
              <div className="leaderboard__list">
                {topTen.map((entry, index) => {
                  const isCurrentUser =
                    String(entry.user_id) === String(team.id) ||
                    entry.username === team.username;
                  return (
                    <div
                      key={entry.user_id}
                      className={`leaderboard__row ${isCurrentUser ? "leaderboard__row--current" : ""}`}
                    >
                      <span className="leaderboard__rank">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="leaderboard__name">
                        {entry.username}
                      </span>
                      <span className="leaderboard__treasure">
                        {entry.treasure.toLocaleString()} ◈
                      </span>
                    </div>
                  );
                })}
                {currentUserOutsideTopTen && (
                  <>
                    <div className="leaderboard__separator">
                      <span />
                      <small>YOUR POSITION</small>
                      <span />
                    </div>
                    <div className="leaderboard__row leaderboard__row--current">
                      <span className="leaderboard__rank">
                        {String(currentUserRank).padStart(2, "0")}
                      </span>
                      <span className="leaderboard__name">{team.username}</span>
                      <span className="leaderboard__treasure">
                        {(leaderboard[currentUserIndex]?.treasure ?? 0).toLocaleString()} ◈
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>


          {/* =================================================
              LOWER CONTENT
          ================================================= */}

          <div className="home__lower">

            <section className="battles">
              <div className="section-heading section-heading--small">
                <div>
                  <span className="section-heading__eyebrow">THE ARENA</span>
                  <h2>Current Battles</h2>
                </div>
                <button
                  className="section-action"
                  type="button"
                  onClick={() => navigate("/map")}
                >
                  <span>Open world</span>
                  <span>↗</span>
                </button>
              </div>

              {currentBattles.length === 0 ? (
                <div className="battles__empty">
                  <p>You have no current battles.</p>
                  <button
                    className="gold-button"
                    type="button"
                    onClick={() => navigate("/map")}
                  >
                    Find a battle
                  </button>
                </div>
              ) : (
                <div className="battles__list">
                  {currentBattles.map((battle, index) => {
                    const incoming = battle.opponent_id === user.id;
                    const opponentId = incoming
                      ? battle.challenger_id
                      : battle.opponent_id;
                    const opponentName =
                      ownerById.get(opponentId) ?? `Player ${opponentId}`;
                    const cityName =
                      cities.find((city) => city.id === battle.city_id)?.name ??
                      "Unknown city";
                    const battleStatus =
                      battle.status === "accepted" ? "Accepted" : "Pending";

                    return (
                      <article className="home__battle-row" key={battle.id}>
                        <span className="battle-row__number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="home__battle-details">
                          <strong>
                            {incoming
                              ? `${opponentName} challenged you`
                              : `You challenged ${opponentName}`}
                          </strong>
                          <small>
                            {cityName} · {formatTimestamp(battle.proposed_time)}
                          </small>
                        </div>
                        <span
                          className={`battle-row__status home__battle-status home__battle-status--${battle.status}`}
                        >
                          {battleStatus}
                        </span>
                        {battle.status === "accepted" ? (
                          <button
                            className="battle-row__arrow"
                            type="button"
                            aria-label={`Enter battle with ${opponentName}`}
                            onClick={() => navigate(`/battle/${battle.id}`)}
                          >
                            ↗
                          </button>
                        ) : (
                          <span className="home__battle-placeholder" />
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* -----------------------------------------------
                CAMPUS ACTIVITY
            ----------------------------------------------- */}

            <section className="activity">

              <div className="section-heading section-heading--small">

                <div>
                  <span className="section-heading__eyebrow">THE REALM</span>

                  <h2>Recent Activity</h2>
                </div>

              </div>

              <ul className="activity__list">

                {feed.length === 0 ? (
                  <li className="activity__empty">No recent realm activity.</li>
                ) : feed.map((item) => (

                  <li
                    className="activity__item"
                    key={item.id}
                  >

                    <span className="activity__dot" />

                    <div>
                      <p>{item.text}</p>
                      <time>{item.time}</time>
                    </div>

                  </li>

                ))}

              </ul>

            </section>


          </div>

        </section>


        {/* =================================================
            PLAYER PANEL
        ================================================= */}

        <aside className="home__profile">

          <div className="profile__top">

            <span className="profile__label">
              COMMANDER
            </span>

            <span className="profile__online">
              ONLINE
            </span>

          </div>


          <div className="profile__character">

            <img
              src={avatar}
              alt={`${team.faction} faction character`}
            />

            <div className="profile__character-glow" />

          </div>


          <div className="profile__identity">

            <span className="profile__faction">
              {playerCity
                ? team.faction === "fire"
                  ? "FIRE FACTION"
                  : "WATER FACTION"
                : "UNCLAIMED"}
            </span>

            <h2>@{team.username}</h2>

            <p>{playerCity?.name ?? "No city claimed"}</p>

          </div>


          {/* Currency */}

          <div className="profile__currency">

            <div>
              <span>TREASURE</span>
              <strong>{team.currency}</strong>
            </div>

            <span className="profile__currency-symbol">
              ◈
            </span>

          </div>

          {/* Record */}

          <div className="profile__record">

            <div>
              <strong>{team.wins}</strong>
              <span>W</span>
            </div>

            <div>
              <strong>{team.losses}</strong>
              <span>L</span>
            </div>

            <div>
              <strong>{team.streak}</strong>
              <span>STREAK</span>
            </div>

          </div>


          {/* History */}

          <div className="profile__history">

            <div className="profile__history-heading">
              <span>RECENT HISTORY</span>
            </div>

            <ul>

              {history.slice(0, 4).map((item) => (

                <li
                  key={item.id}
                  className={`history-item ${
                    item.type ? `history-item--${item.type}` : ""
                  }`}
                >

                  <span className="history-item__marker" />

                  <div>
                    <p>{item.text}</p>
                    <time>{item.time}</time>
                  </div>

                </li>

              ))}

              {history.length === 0 && (
                <li className="history-item">
                  <span className="history-item__marker" />
                  <div>
                    <p>No completed sprints yet.</p>
                  </div>
                </li>
              )}

            </ul>

          </div>

          <div className="profile__history profile__treasure-history">
            <div className="profile__history-heading">
              <span>TREASURE FROM BATTLES</span>
            </div>
            <ul>
              {treasureHistory.map((entry) => {
                const won = entry.amount > 0;
                const amount = Math.abs(entry.amount).toLocaleString();
                return (
                  <li
                    key={entry.id}
                    className={`history-item ${won ? "history-item--win" : "history-item--loss"}`}
                  >
                    <span className="history-item__marker" />
                    <div>
                      <p>
                        {won ? `Won ${amount} from` : `Lost ${amount} to`}{" "}
                        @{entry.related_username ?? "battle opponent"}
                      </p>
                      <time>{formatTimestamp(entry.created_at)}</time>
                    </div>
                  </li>
                );
              })}
              {treasureHistory.length === 0 && (
                <li className="history-item">
                  <span className="history-item__marker" />
                  <div><p>No battle treasure transfers yet.</p></div>
                </li>
              )}
              {treasureHistoryError && (
                <li className="history-item" role="alert">
                  <div><p>Treasure history unavailable: {treasureHistoryError}</p></div>
                </li>
              )}
            </ul>
          </div>

          <button
            className="profile__signout"
            type="button"
            onClick={handleSignOut}
          >
            Sign out
          </button>

        </aside>

      </main>

    </div>
  );
}