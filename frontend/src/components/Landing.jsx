import { useState } from 'react';
import waterCharacter from '../assets/landing/water-character.png';
import fireCharacter from '../assets/landing/fire-character.png';
import logo from '../assets/landing/logo.png';
import map from '../assets/landing/map.png';
import './Landing.css';

export default function Landing({ onGetStarted }) {
  const [waterOk, setWaterOk] = useState(true);
  const [fireOk, setFireOk] = useState(true);
  const [logoOk, setLogoOk] = useState(true);

  return (
    <div className="landing">
      <header className="landing-header">
        {logoOk ? (
          <img
            src={logo}
            alt="Vyuruta — Code to Conquer"
            className="header-logo"
            onError={() => setLogoOk(false)}
          />
        ) : (
          <div className="header-logo-fallback">VYURUTA</div>
        )}
      </header>
      <div className="header-divider" />

      <section className="hero">
        <div className="hero-glow hero-glow-jal" />
        <div className="hero-glow hero-glow-agni" />

        <div className="hero-character hero-character-jal">
          {waterOk ? (
            <img
              src={waterCharacter}
              alt="Jal faction champion"
              onError={() => setWaterOk(false)}
            />
          ) : (
            <div className="hero-placeholder placeholder-jal">
              <span>JAL</span>
              <p>water-character.png</p>
            </div>
          )}
        </div>

        <div className="hero-center">
          <p className="hero-kicker">Season 1</p>
          <h1 className="hero-title">
            Your campus is a battlefield.<br />Claim it in code.
          </h1>
          <p className="hero-sub">
VYURUTA is a solo coding strategy game where players battle others through coding challenges.
Choose **Fire or Water**, win matches, earn treasure, and climb the weekly leaderboard.
Battle for cities and compete to become the **ultimate ruler**.


          </p>
          <button className="cta-button cta-hero" onClick={onGetStarted}>
            Start Conquering
          </button>
        </div>

        <div className="hero-character hero-character-agni">
          {fireOk ? (
            <img
              src={fireCharacter}
              alt="Agni faction champion"
              onError={() => setFireOk(false)}
            />
          ) : (
            <div className="hero-placeholder placeholder-agni">
              <span>AGNI</span>
              <p>fire-character.png</p>
            </div>
          )}
        </div>
      </section>

      <section className="about">
        <div className="about-inner">
          <h2 className="about-kicker">What is Vyuruta?</h2>
          <p className="about-lead">
            Vyuruta is a solo coding strategy game where players battle through coding challenges to earn treasure.
Choose Fire or Water, battle for cities, and climb the weekly treasure leaderboard.
          </p>

          <div className="map-cta">
            <div className="map-copy">
              <span className="map-badge">Campaign map</span>
              <h3>This is the map you need to conquer.</h3>
            </div>
            <div className="map-frame">
              <img src={map} alt="Vyuruta campaign map" className="map-image" />
            </div>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <h3>Coding Battles</h3>
              <p>Challenge players through DSA and coding matches.
Win battles to earn treasure and influence.</p>
            </div>
            <div className="about-card">
              <h3>Choose your side</h3>
              <p>Choose your element at the beginning.
Build your legacy with either Fire or Water.</p>
            </div>
            <div className="about-card">
              <h3>Climb the Campus</h3>
              <p>Weekly contests, win streaks, hosting rights. One map, every team, one season.</p>
            </div>
            <div className="about-card">
              <h3>10 States</h3>
              <p>The world is divided into 5 Fire and 5 Water states.
Rise through them to become the ultimate ruler.</p>
            </div>
            <div className="about-card">
              <h3>Tribute System</h3>
              <p>After a loss, players can make a one-time treasure payment.
XP and tax mechanics are shelved for now.</p>
            </div>
            <div className="about-card">
              <h3>Ultimate Ruler</h3>
              <p>Compete against players across the entire world.
Prove your coding skills and claim the top spot.</p>
            </div>
          </div>

          <button className="cta-button" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </section>
    </div>
  );
}