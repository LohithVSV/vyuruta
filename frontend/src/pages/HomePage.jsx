// src/pages/HomePage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import fireCharacter from "../assets/landing/fire-character.png";
import waterCharacter from "../assets/landing/water-character.png";
import vyurutaLogo from "../assets/landing/logo.png";

import {
  mockTeam,
  mockBattles,
  mockTeamHistory,
  mockActivityFeed,
} from "../data/mockData";

import "./HomePage.css";

const BATTLE_STATUS_LABEL = {
  awaiting_time_slot: "Awaiting time slot",
  terms_sent: "Terms sent",
  awaiting_terms: "Awaiting your response",
};

export default function HomePage() {
  const navigate = useNavigate();

  const [team] = useState(mockTeam);
  const [battles] = useState(mockBattles);
  const [history] = useState(mockTeamHistory);
  const [feed] = useState(mockActivityFeed);

  const avatar =
    team.faction === "fire" ? fireCharacter : waterCharacter;

  const handleSignOut = () => {
    navigate("/auth");
  };

  return (
    <div className="home">

      {/* =====================================================
          TOP NAV
      ===================================================== */}

      <header className="home__topbar">

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
            onClick={() => navigate("/")}
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
            onClick={() => navigate("/battle/new")}
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

        {/* -----------------------------------------------
            LEFT / CENTER
        ------------------------------------------------ */}

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


          {/* Active Battles */}
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
                onClick={() => navigate("/battle/new")}
              >
                <span>Propose Battle</span>
                <span>+</span>
              </button>

            </div>


            {battles.length === 0 ? (

              <div className="battles__empty">

                <span className="battles__empty-symbol">
                  ◇
                </span>

                <p>No active conflicts.</p>

                <button
                  className="gold-button"
                  onClick={() => navigate("/battle/new")}
                >
                  Propose your first battle
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
                        {battle.city}
                      </small>

                    </div>

                    <div className="battle-row__status">
                      {BATTLE_STATUS_LABEL[battle.status] ??
                        battle.status}
                    </div>

                    <button
                      className="battle-row__arrow"
                      onClick={() => navigate(`/battle/${battle.id}`)}
                    >
                      →
                    </button>

                  </div>

                ))}

              </div>

            )}

          </section>


          {/* Bottom information */}
          <div className="home__lower">

            {/* Activity */}
            <section className="activity">

              <div className="section-heading section-heading--small">

                <div>
                  <span className="section-heading__eyebrow">
                    THE REALM
                  </span>

                  <h2>Campus Activity</h2>
                </div>

              </div>

              <ul className="activity__list">

                {feed.map((item) => (

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


            {/* Quick stats */}
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
              {team.faction === "fire"
                ? "FIRE FACTION"
                : "WATER FACTION"}
            </span>

            <h2>@{team.username}</h2>

            <p>{team.college}</p>

          </div>


          {/* Currency */}
          <div className="profile__currency">

            <div>
              <span>RESONANCE</span>
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
                  className={`history-item history-item--${item.type}`}
                >

                  <span className="history-item__marker" />

                  <div>
                    <p>{item.text}</p>
                    <time>{item.time}</time>
                  </div>

                </li>

              ))}

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