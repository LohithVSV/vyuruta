import { useState } from 'react';
import waterCharacter from '../assets/landing/water-character.png';
import fireCharacter from '../assets/landing/fire-character.png';
import logo from '../assets/landing/logo.png';
import './Landing.css';

export default function Landing() {
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
            100 cities. Two elements. One season. Form a team, win coding
            battles, and take territory — city by city — until your banner
            covers the map.
          </p>
          <button className="cta-button cta-hero">Start Conquering</button>
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
          <h2 className="about-kicker">What is Vyuruta</h2>
          <p className="about-lead">
            Your campus, redrawn as a map of 100 cities. Every team starts by
            claiming one. Every coding battle you win is territory you take.
          </p>

          <div className="about-grid">
            <div className="about-card">
              <h3>Form a team</h3>
              <p>Squad up, pick a name and banner, get auto-assigned a home city on the map.</p>
            </div>
            <div className="about-card">
              <h3>Battle for territory</h3>
              <p>Challenge rival teams to DSA sprints. Win, and their city — or their tribute — is yours.</p>
            </div>
            <div className="about-card">
              <h3>Climb the campus</h3>
              <p>Weekly contests, win streaks, hosting rights. One map, every team, one season.</p>
            </div>
          </div>

          <button className="cta-button">Get Started</button>
        </div>
      </section>
    </div>
  );
}