import { useEffect, useRef, useState } from "react";
import "./OnboardingReveal.css";
import throneFire from "../assets/thrones/throne-fire.png";
import throneWater from "../assets/thrones/throne-water.png";
import logo from "../assets/landing/logo.png";
import revealMusic from "../assets/audio/onboarding-music.mp3";

// element: "fire" | "water"
// cityName: e.g. "AGNI-023"
// onComplete: callback fired when sequence ends (or skipped)
export default function OnboardingReveal({ element, cityName, onComplete }) {
  const [beat, setBeat] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [throneFailed, setThroneFailed] = useState(false);
  const audioRef = useRef(null);

  const EXIT_DURATION = 700; // ms, must match CSS transition below

  const beats = [
    { text: "The old campus wars ended. New ones began.", duration: 5000 },
    { text: "No swords. No armies. Just code, and the will to conquer.", duration: 5200 },
    { type: "throne", duration: 3500 },
    { text: "You have ascended.", duration: 3800 },
    { type: "city", duration: 4200 },
    { type: "brand", duration: 3200 },
  ];

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    const audio = new Audio(revealMusic);
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;

    audio.play().catch(() => {
      console.warn("Reveal music could not autoplay until the page is interacted with.");
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (exiting) return; // already wrapping up, stop advancing beats

    const t = setTimeout(() => {
      if (beat === beats.length - 1) {
        setExiting(true);
        return;
      }

      setBeat((b) => b + 1);
    }, beats[beat].duration);

    return () => clearTimeout(t);
  }, [beat, exiting]);

  useEffect(() => {
    if (!exiting) return;

    const audio = audioRef.current;
    const startingVolume = audio?.volume ?? 0;
    const fadeStartedAt = performance.now();
    const fadeTimer = setInterval(() => {
      const progress = Math.min(
        (performance.now() - fadeStartedAt) / EXIT_DURATION,
        1,
      );

      if (audio) audio.volume = startingVolume * (1 - progress);
      if (progress === 1) clearInterval(fadeTimer);
    }, 40);

    const redirectTimer = setTimeout(() => onComplete?.(), EXIT_DURATION);
    return () => {
      clearInterval(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [exiting, onComplete]);

  const handleSkip = () => {
    if (exiting) return;
    setExiting(true);
  };

  const current = beats[Math.min(beat, beats.length - 1)];
  const throneImg =
    element === "fire"
      ? throneFire
      : throneWater;
  const factionClass = element === "fire" ? "faction-fire" : "faction-water";

  return (
    <div className={`reveal-overlay ${factionClass} ${exiting ? "exiting" : ""}`}>
      {showSkip && !exiting && (
        <button className="skip-btn" onClick={handleSkip}>
          Skip
        </button>
      )}

      <div
        className="reveal-stage"
        key={beat}
        style={{ "--beat-duration": `${current.duration}ms` }}
      >
        {current.text && <p className="reveal-line">{current.text}</p>}

        {current.type === "throne" && (
          <div className="throne-wrap">
            {!throneFailed ? (
              <img
                src={throneImg}
                alt=""
                className="throne-img"
                onError={() => {
                  console.error("Throne image failed to load:", throneImg);
                  setThroneFailed(true);
                }}
              />
            ) : (
              <div className="throne-fallback">
                <p>[ throne image missing: {throneImg} ]</p>
              </div>
            )}
            <div className="throne-vignette" />
          </div>
        )}

        {current.type === "city" && (
          <div className="city-reveal">
            <p className="city-sub">YOUR CITY</p>
            <h1 className="city-name">{cityName} IS YOURS</h1>
          </div>
        )}

        {current.type === "brand" && (
          <img className="brand-stamp" src={logo} alt="Vyuruta Code to Conquer" />
        )}
      </div>
    </div>
  );
}