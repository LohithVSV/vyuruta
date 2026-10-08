// src/pages/HomePage.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import fireCharacter from "../assets/landing/fire-character.png";
import waterCharacter from "../assets/landing/water-character.png";
import vyurutaLogo from "../assets/landing/logo.png";

import { api, clearToken, getToken } from "../api";

import "./HomePage.css";

const BATTLE_STATUS_LABEL = {
  pending: "Battle request pending",
  accepted: "Ready to enter",
};
const DAILY_TREASURE_AMOUNT = 30000;

function formatTimestamp(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function HomePage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(false);
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
      api.weeklyLeaderboard(100).then(
        (entries) => ({ entries }),
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
          setLeaderboard(rankingResult.entries);
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

  const cityById = useMemo(
    () => new Map((dashboard?.cities ?? []).map((city) => [city.id, city])),
    [dashboard],
  );
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
  const finishedSprints = sprints.filter(
    (sprint) => sprint.status === "finished" && sprint.winner_id != null,
  );
  const team = {
    id: user.id,
    username: user.username,
    faction: playerCity?.faction ?? "fire",
    citiesHeld: cities.filter((city) => city.owner_id === user.id).length,
    wins: user.wins,
    losses: user.losses,
    streak: user.win_streak,
    currency: user.currency,
  };
  const avatar = team.faction === "fire" ? fireCharacter : waterCharacter;
  const battles = allBattles
    .filter((battle) => ["pending", "accepted"].includes(battle.status))
    .map((battle) => {
      const isOutgoing = String(battle.challenger_id) === String(user.id);
      const opponentId =
        isOutgoing ? battle.opponent_id : battle.challenger_id;
      const city = isOutgoing
        ? cityById.get(battle.city_id)
        : cities.find((entry) => String(entry.owner_id) === String(opponentId));
      return {
        id: battle.id,
        cityDbId: city?.id,
        direction: isOutgoing ? "outgoing" : "incoming",
        opponent: ownerById.get(opponentId) ?? `Player ${opponentId}`,
        cityName: city?.name ?? "Unknown city",
        status: battle.status,
      };
    });
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

  const currentUserOutsideTopTen =
    currentUserRank !== null && currentUserRank > 10;

  const handleSignOut = () => {
    clearToken();
    navigate("/auth", { replace: true });
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
        setLeaderboard(await api.weeklyLeaderboard(100));
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
            onClick={() => navigate("/map")}
          >
            Battles
          </button>

        </nav>

        <button
          className="home__map-button"
          onClick={() => navigate("/map")}
        >
          <span>Enter World</span>
          <span className="home__map-arrow">↗</span>
        </button>

      </header>


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

          </div>


          {/* =================================================
              ACTIVE BATTLES
          ================================================= */}

          <section className="battles">

            <div className="section-heading">

              <div>
                <span className="section-heading__eyebrow">
                  CONFLICT
                </span>

                <h2>Active Battles</h2>
              </div>

              <button
                className="section-action"
                onClick={() => navigate("/map")}
              >
                <span>Propose Battle</span>
                <span>+</span>
              </button>

            </div>


            {refreshError && (
              <p className="battles__refresh-error" role="status">
                Live battle updates are temporarily unavailable: {refreshError}
              </p>
            )}

            {battles.length === 0 ? (

              <div className="battles__empty">

                <span className="battles__empty-symbol">
                  ◇
                </span>

                <p>
                  {allBattles.length > 0
                    ? "No active conflicts right now."
                    : "No active conflicts yet."}
                </p>

                <button
                  className="gold-button"
                  onClick={() => navigate("/map")}
                >
                  {allBattles.length > 0 ? "Propose another battle" : "Propose your first battle"}
                </button>

              </div>

            ) : (

              <div className="battles__list">

                {battles.map((battle, index) => (

                  <div
                    className="battle-row"
                    key={battle.id}
                  >

                    <div className="battle-row__number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="battle-row__opponent">

                      <span>VS</span>

                      <strong>
                        {battle.opponent}
                      </strong>

                      <small>
                        {battle.cityName}
                      </small>

                    </div>

                    <div className="battle-row__status">
                      {battle.status === "pending"
                        ? battle.direction === "incoming"
                          ? "Awaiting your response"
                          : "Awaiting opponent"
                        : BATTLE_STATUS_LABEL[battle.status] ?? battle.status}
                    </div>

                    <button
                      className="battle-row__arrow"
                      onClick={() =>
                        navigate(
                          battle.status === "pending"
                            ? `/map?panel=battles&city=${battle.cityDbId ?? ""}`
                            : `/battle/${battle.id}`,
                        )
                      }
                      aria-label={`Open battle against ${battle.opponent}`}
                    >
                      →
                    </button>

                  </div>

                ))}

              </div>

            )}

          </section>


          {/* =================================================
              LOWER CONTENT
          ================================================= */}

          <div className="home__lower">

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


            {/* -----------------------------------------------
                LEADERBOARD
            ----------------------------------------------- */}

            <section className="leaderboard">

              <div className="section-heading section-heading--small">

                <div>
                  <span className="section-heading__eyebrow">
                    TREASURE THIS WEEK
                  </span>

                  <h2>Leaderboard</h2>
                </div>

              </div>


              {leaderboardLoading ? (

                <div className="leaderboard__state">
                  Loading rankings...
                </div>

              ) : leaderboardError ? (

                <div className="leaderboard__state">
                  Unable to load rankings.
                </div>

              ) : leaderboard.length === 0 ? (

                <div className="leaderboard__state">
                  No rankings yet.
                </div>

              ) : (

                <div className="leaderboard__list">

                  {topTen.map((entry, index) => {

                    const rank = index + 1;

                    const isCurrentUser =
                      String(entry.user_id) === String(team.id) ||
                      entry.username === team.username;

                    return (
                      <div
                        key={entry.user_id}
                        className={`leaderboard__row ${
                          isCurrentUser
                            ? "leaderboard__row--current"
                            : ""
                        }`}
                      >

                        <span className="leaderboard__rank">
                          {String(rank).padStart(2, "0")}
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


                  {/* -----------------------------------------
                      CURRENT USER OUTSIDE TOP 10
                  ----------------------------------------- */}

                  {currentUserOutsideTopTen && (
                    <>
                      <div className="leaderboard__separator">
                        <span />
                        <small>YOUR POSITION</small>
                        <span />
                      </div>

                      <div className="leaderboard__row leaderboard__row--current leaderboard__row--self">

                        <span className="leaderboard__rank">
                          {String(currentUserRank).padStart(2, "0")}
                        </span>

                        <span className="leaderboard__name">
                          {team.username}
                        </span>

                        <span className="leaderboard__treasure">
                          {(leaderboard[currentUserIndex]?.treasure ?? 0).toLocaleString()} ◈
                        </span>

                      </div>
                    </>
                  )}

                </div>

              )}

            </section>


            {/* -----------------------------------------------
                QUICK STATS
            ----------------------------------------------- */}

            <section className="territory">

              <span className="section-heading__eyebrow">
                YOUR DOMAIN
              </span>

              <div className="territory__stats">

                <div>
                  <strong>{team.citiesHeld}</strong>
                  <span>Cities</span>
                </div>

                <div>
                  <strong>{team.wins}</strong>
                  <span>Victories</span>
                </div>

                <div>
                  <strong>{team.streak}</strong>
                  <span>Streak</span>
                </div>

              </div>

              <button
                className="territory__button"
                onClick={() => navigate("/map")}
              >
                View territory
                <span>↗</span>
              </button>

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

          <div className="profile__daily-treasure">
            <div>
              <strong>Daily treasure</strong>
              <span>
                {dailyTreasure?.claimed_today
                  ? "Today's treasure claimed"
                  : `Claim ${DAILY_TREASURE_AMOUNT.toLocaleString()} treasure today`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClaimDailyTreasure}
              disabled={!dailyTreasure || dailyTreasure.claimed_today || claimingDailyTreasure}
            >
              {claimingDailyTreasure
                ? "Claiming..."
                : dailyTreasure?.claimed_today
                  ? "Claimed"
                  : "Claim"}
            </button>
            {dailyTreasureError && (
              <p role="alert">{dailyTreasureError}</p>
            )}
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
            onClick={handleSignOut}
          >
            Sign out
          </button>

        </aside>

      </main>

    </div>
  );
}