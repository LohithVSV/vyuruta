import { useRef, useState } from 'react';
import waterCharacter from '../assets/landing/water-character.png';
import fireCharacter from '../assets/landing/fire-character.png';
import logo from '../assets/landing/logo.png';
import map from '../assets/landing/map.png';
import battleDemo from '../assets/landing/battle-demo.png';
import homeDemo from '../assets/landing/home-demo.png';
import './Landing.css';

const DEMO_SLIDES = [
  { title: 'Campaign map', image: map, alt: 'Vyuruta campaign map' },
  { title: 'Battle room', image: battleDemo, alt: 'Vyuruta coding battle room' },
  { title: 'Home dashboard', image: homeDemo, alt: 'Vyuruta player dashboard' },
];

export default function Landing({ onGetStarted }) {
  const [waterOk, setWaterOk] = useState(true);
  const [fireOk, setFireOk] = useState(true);
  const [logoOk, setLogoOk] = useState(true);
  const [activeDemo, setActiveDemo] = useState(0);
  const swipeStartX = useRef(null);

  const showDemo = (index) => {
    setActiveDemo((index + DEMO_SLIDES.length) % DEMO_SLIDES.length);
  };

  const handleDemoPointerDown = (event) => {
    if (event.isPrimary) swipeStartX.current = event.clientX;
  };

  const handleDemoPointerUp = (event) => {
    if (swipeStartX.current === null) return;
    const swipeDistance = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(swipeDistance) < 45) return;
    event.preventDefault();
    showDemo(activeDemo + (swipeDistance < 0 ? 1 : -1));
  };

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
Choose Fire or Water, win matches, earn treasure, and climb the weekly leaderboard.
Battle for cities and compete to become the Ultimate Ruler.


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
            Vyuruta turns DSA practice into a campus strategy game. Teams claim cities on a map and battle each other in DSA Sprints to win or lose territory.

Winners earn currency, collect tribute, and climb the season leaderboard. It’s made so students practice DSA daily because they want to win, not because they’re told to.
          </p>

          <div className="map-cta">
            <div className="map-copy">
              <span className="map-badge">{DEMO_SLIDES[activeDemo].title}</span>
              <h3>Explore Vyuruta in action.</h3>
            </div>
            <div
              className="map-frame"
              role="region"
              aria-label="Vyuruta page previews"
              aria-roledescription="carousel"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  showDemo(activeDemo + 1);
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  showDemo(activeDemo - 1);
                }
              }}
              onPointerDown={handleDemoPointerDown}
              onPointerUp={handleDemoPointerUp}
              onPointerCancel={() => {
                swipeStartX.current = null;
              }}
            >
              <img
                src={DEMO_SLIDES[activeDemo].image}
                alt={DEMO_SLIDES[activeDemo].alt}
                className="map-image"
                draggable="false"
              />
              <button
                className="demo-arrow demo-arrow--previous"
                type="button"
                aria-label="Previous preview"
                onClick={() => showDemo(activeDemo - 1)}
              >
                ‹
              </button>
              <button
                className="demo-arrow demo-arrow--next"
                type="button"
                aria-label="Next preview"
                onClick={() => showDemo(activeDemo + 1)}
              >
                ›
              </button>
              <div className="demo-pagination" aria-label="Choose a preview">
                {DEMO_SLIDES.map((slide, index) => (
                  <button
                    key={slide.title}
                    className={`demo-pagination__dot${index === activeDemo ? ' is-active' : ''}`}
                    type="button"
                    aria-label={`Show ${slide.title} preview`}
                    aria-current={index === activeDemo ? 'true' : undefined}
                    onClick={() => showDemo(index)}
                  />
                ))}
              </div>
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