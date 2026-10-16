import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

const DIFFICULTIES = [
  { value: 1, label: "Easy", detail: "Warm up" },
  { value: 2, label: "Medium", detail: "Balanced" },
  { value: 3, label: "Difficult", detail: "Challenge" },
];

const START_COUNTDOWN = 3;

function formatElapsed(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function QuickPlayDialog({ onClose, onMatch }) {
  const [view, setView] = useState("checking");
  const [difficulty, setDifficulty] = useState(2);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [queuedAt, setQueuedAt] = useState(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [battleId, setBattleId] = useState(null);
  const [countdown, setCountdown] = useState(START_COUNTDOWN);
  const matchedRef = useRef(false);

  const applyQueueStatus = useCallback((queue) => {
    if (matchedRef.current) return;
    setOnlinePlayers(queue.online_players);
    if (queue.status === "matched") {
      if (queue.battle_id != null) {
        matchedRef.current = true;
        setError("");
        setBattleId(queue.battle_id);
        setCountdown(START_COUNTDOWN);
        setView("matched");
      } else {
        setError("The match was created, but its battle room could not be found.");
      }
      return;
    }
    if (queue.status === "waiting") {
      setDifficulty(queue.difficulty ?? 2);
      setQueuedAt(queue.queued_at ? new Date(queue.queued_at).getTime() : Date.now());
      setNow(Date.now());
      setView("searching");
      return;
    }
    setQueuedAt(null);
    setView("ready");
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.quickPlayStatus()
      .then((queue) => {
        if (!cancelled) applyQueueStatus(queue);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
          setView("ready");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyQueueStatus]);

  useEffect(() => {
    if (view !== "searching") return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [view]);

  useEffect(() => {
    if (view !== "ready" && view !== "searching") return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const queue = await api.quickPlayStatus();
        if (!cancelled) {
          setError("");
          applyQueueStatus(queue);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      }
    };
    const interval = window.setInterval(poll, view === "searching" ? 2500 : 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [applyQueueStatus, view]);

  // Match found: count down, then enter the battle
  useEffect(() => {
    if (view !== "matched" || battleId == null) return undefined;
    if (countdown <= 0) {
      onMatch(battleId);
      return undefined;
    }
    const timeout = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [view, battleId, countdown, onMatch]);

  const leaveQueue = async () => {
    setBusy(true);
    setError("");
    try {
      const queue = await api.cancelQuickPlay();
      applyQueueStatus(queue);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async () => {
    if (busy || view === "matched") return;
    if (view !== "ready" && !(await leaveQueue())) return;
    onClose();
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy && view !== "matched") {
        event.preventDefault();
        void handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const startSearch = async () => {
    setBusy(true);
    setError("");
    try {
      const queue = await api.joinQuickPlay(difficulty);
      setNow(Date.now());
      applyQueueStatus(queue);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const elapsedSeconds = queuedAt
    ? Math.max(0, Math.floor((now - queuedAt) / 1000))
    : 0;

  return (
    <div
      className="quick-play-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) void handleClose();
      }}
    >
      <section
        className="quick-play-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-play-title"
        aria-describedby="quick-play-description"
      >
        {view !== "matched" && (
          <button
            className="quick-play-dialog__close"
            type="button"
            onClick={() => void handleClose()}
            disabled={busy}
            aria-label="Close Quick Play"
          >
            ×
          </button>
        )}

        <div className="quick-play-dialog__eyebrow">
          <span className="quick-play-dialog__eyebrow-mark" />
          REALM MATCHMAKING
        </div>
        <h2 id="quick-play-title">
          {view === "matched"
            ? "Match found"
            : view === "searching"
              ? "Finding your rival"
              : "Quick Play"}
        </h2>
        <p className="quick-play-dialog__intro" id="quick-play-description">
          {view === "matched"
            ? "Your opponent is ready. Prepare yourself."
            : view === "searching"
              ? "Stay ready. We’ll take you straight into the arena when a player joins."
              : "Choose your challenge and get matched with another player searching at the same level."}
        </p>

        {view === "matched" ? (
          <div className="quick-play-match">
            <p className="quick-play-match__start" aria-live="polite">
              {countdown > 0
                ? `Battle starts in ${countdown}...`
                : "Entering the arena..."}
            </p>
          </div>
        ) : (
          <div className="quick-play-dialog__online">
            <span className="quick-play-dialog__online-dot" />
            <span>
              <strong>{onlinePlayers}</strong>{" "}
              {onlinePlayers === 1 ? "player searching" : "players searching"}
            </span>
            <span className="quick-play-dialog__live">LIVE</span>
          </div>
        )}

        {view === "searching" && (
          <div className="quick-play-search">
            <div className="quick-play-search__timer" aria-live="off">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className="quick-play-search__track" cx="60" cy="60" r="53" />
                <circle className="quick-play-search__ring" cx="60" cy="60" r="53" />
              </svg>
              <strong>{formatElapsed(elapsedSeconds)}</strong>
            </div>
            <span className="quick-play-search__difficulty">
              {DIFFICULTIES.find((option) => option.value === difficulty)?.label} MATCH
            </span>
            <p>Searching the realm for your next opponent...</p>
            <button
              className="quick-play-dialog__secondary"
              type="button"
              disabled={busy}
              onClick={() => void leaveQueue()}
            >
              {busy ? "Cancelling..." : "Cancel search"}
            </button>
          </div>
        )}

        {(view === "checking" || view === "ready") && (
          <>
            <fieldset
              className="quick-play-difficulties"
              role="radiogroup"
              aria-label="Challenge difficulty"
              disabled={busy || view === "checking"}
            >
              <legend>Choose difficulty</legend>
              {DIFFICULTIES.map((option) => (
                <button
                  key={option.value}
                  className={`quick-play-difficulty${difficulty === option.value ? " quick-play-difficulty--selected" : ""}`}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === option.value}
                  onClick={() => setDifficulty(option.value)}
                >
                  <span className="quick-play-difficulty__name">{option.label}</span>
                  <span className="quick-play-difficulty__detail">{option.detail}</span>
                </button>
              ))}
            </fieldset>
            <div className="quick-play-dialog__note">
              <span aria-hidden="true">✦</span>
              You’ll both receive a coding question at this difficulty.
            </div>
            <button
              className="quick-play-dialog__start"
              type="button"
              disabled={busy || view === "checking"}
              onClick={() => void startSearch()}
            >
              {view === "checking"
                ? "Checking queue..."
                : busy
                  ? "Joining queue..."
                  : "Start searching"}
              {!busy && view !== "checking" && <span aria-hidden="true">→</span>}
            </button>
          </>
        )}

        {error && <p className="quick-play-dialog__error" role="alert">{error}</p>}
        {view !== "matched" && (
          <p className="quick-play-dialog__footnote">
            Matches are created as soon as two players choose the same difficulty.
          </p>
        )}
      </section>
    </div>
  );
}