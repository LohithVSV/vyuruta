import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import fireCharacter from "../assets/landing/fire-character.png";
import waterCharacter from "../assets/landing/water-character.png";
import vyurutaLogo from "../assets/landing/logo.png";
import { api, getToken } from "../api";
import "./CodingBattlePage.css";

const TRIBUTE = {
  1: { payment: 2000, tax: 1 },
  2: { payment: 4000, tax: 1 },
  3: { payment: 8000, tax: 1 },
};

function difficultyLabel(difficulty) {
  return ["", "Easy", "Medium", "Hard"][difficulty] ?? "Challenge";
}

export default function CodingBattlePage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [code, setCode] = useState("# Write your solution below\n");
  const [runResult, setRunResult] = useState(null);
  const [runMessage, setRunMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [actionError, setActionError] = useState("");
  const [failedSubmit, setFailedSubmit] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tributeChoice, setTributeChoice] = useState("");
  const [choosingTribute, setChoosingTribute] = useState(false);
  const [clockNow, setClockNow] = useState(0);
  const joinAttempt = useRef(null);

  const refreshOutcome = useCallback(async () => {
    const [battles, sprints] = await Promise.all([
      api.myBattles(),
      api.mySprints(),
    ]);
    const battle = battles.find((entry) => String(entry.id) === String(battleId));
    const sprint = sprints.find(
      (entry) => String(entry.battle_id) === String(battleId),
    );
    if (!battle || !sprint) {
      throw new Error("This battle or its sprint could not be found.");
    }
    setRoom((current) => (current ? { ...current, battle, sprint } : current));
    setStatusError("");
    return { battle, sprint };
  }, [battleId]);

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return undefined;
    }

    let cancelled = false;
    async function loadRoom() {
      try {
        const [user, cities, battles, sprints] = await Promise.all([
          api.me(),
          api.cities(),
          api.myBattles(),
          api.mySprints(),
        ]);
        const battle = battles.find(
          (entry) => String(entry.id) === String(battleId),
        );
        const sprint = sprints.find(
          (entry) => String(entry.battle_id) === String(battleId),
        );
        if (!battle || !sprint) {
          throw new Error("This battle or its sprint could not be found.");
        }
        if (!sprint.problem_id) {
          throw new Error("This battle does not have a coding challenge yet.");
        }
        const problem = await api.problem(sprint.problem_id);
        if (!cancelled) {
          setRoom({ user, cities, battle, sprint, problem });
        }
      } catch (error) {
        if (!cancelled) setLoadError(error.message);
      }
    }

    loadRoom();
    return () => {
      cancelled = true;
    };
  }, [battleId, navigate]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshOutcome().catch((error) => setStatusError(error.message));
    }, 2000);
    return () => window.clearInterval(interval);
  }, [refreshOutcome]);

  useEffect(() => {
    if (!room || room.sprint.status === "finished" || room.battle.status !== "accepted") {
      return undefined;
    }

    const userJoinedAt =
      String(room.battle.challenger_id) === String(room.user.id)
        ? room.battle.challenger_joined_at
        : room.battle.opponent_joined_at;
    if (userJoinedAt || joinAttempt.current === String(room.battle.id)) {
      return undefined;
    }

    joinAttempt.current = String(room.battle.id);
    api.joinBattle(room.battle.id)
      .then((battle) => {
        setRoom((current) => current ? { ...current, battle } : current);
        return refreshOutcome();
      })
      .catch((error) => {
        joinAttempt.current = null;
        setStatusError(error.message);
      });
    return undefined;
  }, [room, refreshOutcome]);

  const sprintStatus = room?.sprint.status;
  useEffect(() => {
    if (!sprintStatus || sprintStatus === "finished") return undefined;
    const interval = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [sprintStatus]);

  const samples = room?.problem.sample_test_cases ?? [];
  const sampleResults = runResult?.results.filter((result) => result.is_sample) ?? [];
  const hiddenResults = runResult?.results.filter((result) => !result.is_sample) ?? [];
  const lineCount = Math.max(1, code.split("\n").length);
  const tribute = TRIBUTE[room?.battle.difficulty] ?? TRIBUTE[1];
  const currentPlayerJoined =
    room &&
    (String(room.battle.challenger_id) === String(room.user.id)
      ? room.battle.challenger_joined_at
      : room.battle.opponent_joined_at);
  const opponentJoined =
    room &&
    (String(room.battle.challenger_id) === String(room.user.id)
      ? room.battle.opponent_joined_at
      : room.battle.challenger_joined_at);
  const matchStarted = Boolean(room?.battle.match_started_at);
  const scheduledTime = room ? new Date(room.battle.proposed_time).getTime() : 0;
  const graceEndsAt = scheduledTime + 60_000;
  const countdownSeconds = Math.max(0, Math.ceil((graceEndsAt - (clockNow || scheduledTime)) / 1000));
  const countdownLabel = `${String(Math.floor(countdownSeconds / 60)).padStart(2, "0")}:${String(countdownSeconds % 60).padStart(2, "0")}`;

  const opponent = useMemo(() => {
    if (!room) return null;
    const opponentId =
      String(room.battle.challenger_id) === String(room.user.id)
        ? room.battle.opponent_id
        : room.battle.challenger_id;
    const opponentCity = room.cities.find(
      (city) => String(city.owner_id) === String(opponentId),
    );
    const username = opponentCity?.owner_username ?? `Player ${opponentId}`;
    const faction = opponentCity?.faction ?? "water";
    return {
      username,
      faction,
      avatar: faction === "fire" ? fireCharacter : waterCharacter,
    };
  }, [room]);

  const updateCode = (event) => {
    setCode(event.target.value);
    setRunResult(null);
    setRunMessage("");
    setActionError("");
  };

  const handleEditorKeyDown = (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const editor = event.currentTarget;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const next = `${code.slice(0, start)}    ${code.slice(end)}`;
      setCode(next);
      setRunResult(null);
      requestAnimationFrame(() => {
        editor.selectionStart = editor.selectionEnd = start + 4;
      });
    } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleRun();
    }
  };

  const handleRun = async () => {
    if (!room || running || submitting || !matchStarted) return;
    setRunning(true);
    setActionError("");
    setFailedSubmit(null);
    setRunMessage("");
    try {
      const result = await api.runSprint(room.sprint.id, code);
      setRunResult(result);
      setRunMessage(result.message);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!room || running || submitting || !matchStarted) return;
    setSubmitting(true);
    setActionError("");
    setFailedSubmit(null);
    try {
      const result = await api.submitSprint(room.sprint.id, code);
      setRunResult(result);
      setRunMessage(result.message);
      if (result.all_passed) {
        setRoom((current) =>
          current
            ? {
                ...current,
                sprint: {
                  ...current.sprint,
                  status: "finished",
                  winner_id: current.user.id,
                },
              }
            : current,
        );
        await refreshOutcome();
      } else {
        setFailedSubmit(result);
      }
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTribute = async (choice) => {
    if (!room || choosingTribute) return;
    setChoosingTribute(true);
    setTributeChoice(choice);
    setActionError("");
    try {
      await api.chooseTribute(room.battle.id, choice);
      await refreshOutcome();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setChoosingTribute(false);
      setTributeChoice("");
    }
  };

  if (loadError) {
    return (
      <main className="coding-room coding-room--state">
        <section className="coding-room__state-card" role="alert">
          <span className="coding-room__eyebrow">BATTLE ROOM</span>
          <h1>Unable to enter the arena</h1>
          <p>{loadError}</p>
          <button type="button" className="coding-room__button coding-room__button--quiet" onClick={() => navigate("/home")}>
            Return to dashboard
          </button>
        </section>
      </main>
    );
  }

  if (!room || !opponent) {
    return (
      <main className="coding-room coding-room--state" role="status">
        <div className="coding-room__loading-mark" />
        <p>Preparing your arena...</p>
      </main>
    );
  }

  const isFinished = room.sprint.status === "finished";
  const didWin = String(room.sprint.winner_id) === String(room.user.id);
  const awaitingTribute = room.battle.status === "awaiting_tribute";
  const forfeited = room.battle.status === "forfeit_resolved";
  const showOutcome = isFinished;
  const tributePayment = tribute.payment.toLocaleString();
  const tributeOutcomeMessage =
    room.battle.tribute_choice === "pay"
      ? didWin
        ? `@${opponent.username} paid you ${tributePayment} treasure.`
        : `You paid ${tributePayment} treasure to @${opponent.username}.`
      : room.battle.tribute_choice === "tax"
        ? didWin
          ? `@${opponent.username} accepted a temporary 1% XP tribute to you for seven days.`
          : "You accepted a temporary 1% XP tribute to the winner for seven days."
        : didWin
          ? "Your opponent has made their tribute choice. Your victory is secured."
          : "Your tribute choice is confirmed. The battle is resolved.";

  return (
    <main className="coding-room">
      <header className="coding-room__topbar">
        <div className="coding-room__brand-group">
          <button
            type="button"
            className="coding-room__brand"
            onClick={() => navigate("/home")}
            aria-label="Return to Vyuruta dashboard"
          >
            <img src={vyurutaLogo} alt="Vyuruta" />
          </button>
          <nav className="coding-room__nav" aria-label="Main navigation">
            <button type="button" onClick={() => navigate("/home")}>Dashboard</button>
            <span aria-hidden="true">/</span>
            <span>Live battle</span>
          </nav>
        </div>

        <div className="coding-room__schedule">
          <span>SCHEDULED TIME</span>
          <strong>{new Date(room.battle.proposed_time).toLocaleString()}</strong>
        </div>

        <div className="coding-room__opponent">
          <div className={`coding-room__opponent-avatar coding-room__opponent-avatar--${opponent.faction}`}>
            <img src={opponent.avatar} alt="" />
          </div>
          <div className="coding-room__opponent-name">
            <span>YOUR OPPONENT</span>
            <strong>@{opponent.username}</strong>
          </div>
          <span className="coding-room__battle-id">#{room.battle.id}</span>
        </div>
      </header>

      <section className="coding-room__workspace">
        <aside className="coding-room__question-pane">
          {matchStarted ? (
            <>
              <div className="coding-room__pane-heading">
                <span className="coding-room__eyebrow">THE CHALLENGE</span>
                <span className={`coding-room__difficulty coding-room__difficulty--${room.battle.difficulty}`}>
                  {difficultyLabel(room.battle.difficulty)}
                </span>
              </div>

              <div className="coding-room__question-content">
                <h1>{room.problem.title}</h1>
                <div className="coding-room__topics">
                  {(room.problem.topics ?? []).map((topic) => (
                    <span key={topic.id ?? topic.name}>{topic.name}</span>
                  ))}
                </div>
                <p className="coding-room__description">{room.problem.description}</p>

                <section className="coding-room__tests" aria-live="polite">
                  <div className="coding-room__tests-heading">
                    <div>
                      <span className="coding-room__eyebrow">VALIDATION</span>
                      <h2>Test cases</h2>
                    </div>
                    {runResult && (
                      <span className={`coding-room__test-count ${runResult.all_passed ? "is-passed" : "is-failed"}`}>
                        {runResult.passed_count}/{runResult.total_count} passed
                      </span>
                    )}
                  </div>

                  {samples.length > 0 ? samples.map((testCase, index) => {
                    const result = sampleResults[index];
                    return (
                      <article
                        className={`coding-room__test-case${result ? (result.passed ? " is-passed" : " is-failed") : ""}`}
                        key={testCase.id}
                      >
                        <div className="coding-room__test-case-title">
                          <span className={`coding-room__test-icon${result ? (result.passed ? " is-passed" : " is-failed") : ""}`}>
                            {result ? (result.passed ? "✓" : "×") : String(index + 1).padStart(2, "0")}
                          </span>
                          <strong>Example {index + 1}</strong>
                          <span>{result ? (result.passed ? "Passed" : "Failed") : "Sample"}</span>
                        </div>
                        <div className="coding-room__test-io">
                          <div>
                            <span>INPUT</span>
                            <pre>{testCase.input_data}</pre>
                          </div>
                          <div>
                            <span>EXPECTED</span>
                            <pre>{testCase.expected_output}</pre>
                          </div>
                          {result && (
                            <div className={result.passed ? "coding-room__actual--passed" : "coding-room__actual--failed"}>
                              <span>YOUR OUTPUT</span>
                              <pre>{result.error || result.actual_output || "(no output)"}</pre>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  }) : (
                    <p className="coding-room__empty-tests">No public sample cases were provided.</p>
                  )}

                  {hiddenResults.length > 0 && (
                    <p className="coding-room__hidden-tests">
                      + {hiddenResults.length} hidden test{hiddenResults.length === 1 ? "" : "s"} checked privately
                    </p>
                  )}
                </section>
              </div>
            </>
          ) : (
            <div className="coding-room__lobby coding-room__question-lock" role="status">
              <span className="coding-room__lobby-mark" aria-hidden="true">◇</span>
              <span className="coding-room__eyebrow">CHALLENGE LOCKED</span>
              <h2>The question is waiting</h2>
              <p>
                {currentPlayerJoined
                  ? `The challenge and test cases will appear when @${opponent.username} joins.`
                  : "The challenge and test cases will appear after both players check in."}
              </p>
            </div>
          )}
        </aside>

        <section className="coding-room__editor-pane" aria-label="Code editor">
          {matchStarted ? (
            <>
              <div className="coding-room__editor-toolbar">
                <div className="coding-room__file-tab">
                  <span className="coding-room__python-mark">Py</span>
                  <span>solution.py</span>
                  <i aria-hidden="true" />
                </div>
                <span className="coding-room__language">Python 3</span>
              </div>

              <div className="coding-room__editor">
                <div className="coding-room__line-numbers" aria-hidden="true">
                  {Array.from({ length: lineCount }, (_, index) => (
                    <span key={index}>{index + 1}</span>
                  ))}
                </div>
                <textarea
                  ref={editorRef}
                  aria-label="Python solution code"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={code}
                  onChange={updateCode}
                  onKeyDown={handleEditorKeyDown}
                  placeholder="Write your Python solution..."
                  disabled={isFinished}
                />
              </div>

              <div className="coding-room__editor-footer">
                <span>{lineCount} lines <span aria-hidden="true">·</span> UTF-8</span>
                <span>Ctrl + Enter to run</span>
              </div>

              <div className="coding-room__actions">
                <div className="coding-room__run-status" role="status">
                  {running ? (
                    <><span className="coding-room__spinner" /> Running tests...</>
                  ) : runMessage ? (
                    <span className={runResult?.all_passed ? "is-passed" : "is-failed"}>{runMessage}</span>
                  ) : (
                    <span>Run your solution against the test suite.</span>
                  )}
                </div>
                <div className="coding-room__action-buttons">
                  <button
                    type="button"
                    className="coding-room__button coding-room__button--run"
                    onClick={handleRun}
                    disabled={running || submitting || isFinished}
                  >
                    {running ? "Running..." : "▶ Run"}
                  </button>
                  <button
                    type="button"
                    className="coding-room__button coding-room__button--submit"
                    onClick={handleSubmit}
                    disabled={running || submitting || isFinished}
                  >
                    {submitting ? "Submitting..." : "Submit solution"}
                    {!submitting && <span aria-hidden="true">↑</span>}
                  </button>
                </div>
              </div>
              {(actionError || statusError) && (
                <p className="coding-room__error" role="alert">{actionError || `Battle status could not refresh: ${statusError}`}</p>
              )}
            </>
          ) : (
            <div className="coding-room__lobby" role="status">
              <span className="coding-room__lobby-mark">{currentPlayerJoined ? "⌛" : "◇"}</span>
              <span className="coding-room__eyebrow">ARENA CHECK-IN</span>
              <h2>{currentPlayerJoined ? "Your rival is due" : "Joining the arena..."}</h2>
              <p>
                {currentPlayerJoined
                  ? `You are checked in. Waiting for @${opponent.username} to join.`
                  : "Checking in. The code editor unlocks when both players are here."}
              </p>
              {currentPlayerJoined && !opponentJoined && (
                <div className="coding-room__countdown">
                  <span>NO-SHOW WINDOW</span>
                  <strong>{countdownLabel}</strong>
                  <small>
                    If they do not arrive by the scheduled time plus one minute, you win by forfeit.
                  </small>
                </div>
              )}
              {!currentPlayerJoined && (
                <span className="coding-room__lobby-note">
                  You may begin as soon as your opponent checks in.
                </span>
              )}
              {statusError && <p className="coding-room__error" role="alert">{statusError}</p>}
            </div>
          )}
        </section>
      </section>

      {failedSubmit && (
        <div className="coding-room__modal-backdrop">
          <section className="coding-room__outcome coding-room__outcome--loss" role="dialog" aria-modal="true" aria-labelledby="failed-submit-title">
            <span className="coding-room__outcome-sigil" aria-hidden="true">×</span>
            <span className="coding-room__eyebrow">SUBMISSION NOT ACCEPTED</span>
            <h2 id="failed-submit-title">
              {failedSubmit.passed_count === 0 ? "No test cases passed" : "Some test cases failed"}
            </h2>
            <p>
              {failedSubmit.passed_count}/{failedSubmit.total_count} test cases passed.
              {" "}Adjust your code and try again.
            </p>
            <button
              type="button"
              className="coding-room__button coding-room__button--quiet"
              onClick={() => {
                setFailedSubmit(null);
                editorRef.current?.focus();
              }}
            >
              Try again
            </button>
          </section>
        </div>
      )}

      {showOutcome && (
        <div className="coding-room__modal-backdrop">
          <section className={`coding-room__outcome${didWin ? " coding-room__outcome--win" : " coding-room__outcome--loss"}`} role="dialog" aria-modal="true" aria-labelledby="battle-outcome-title">
            <span className="coding-room__outcome-sigil" aria-hidden="true">{didWin ? "✦" : "×"}</span>
            <span className="coding-room__eyebrow">{didWin ? "VICTORY" : "BATTLE OVER"}</span>
            <h2 id="battle-outcome-title">{didWin ? "You won the battle" : "You lost this round"}</h2>
            <p>
              {didWin
                ? forfeited
                  ? `@${opponent.username} missed the check-in. Their temporary 1% XP tribute is active for seven days.`
                  : awaitingTribute
                  ? `@${opponent.username} is choosing their tribute. Hold your ground while they decide.`
                  : room.battle.status === "resolved"
                    ? tributeOutcomeMessage
                    : "You solved the challenge first. The arena is recording the result."
                : forfeited
                  ? "You missed the check-in. A temporary 1% XP tribute is applied for seven days."
                  : awaitingTribute
                  ? "Choose how you will honor your defeat."
                  : room.battle.status === "resolved"
                    ? tributeOutcomeMessage
                    : "Your opponent solved the challenge first. Regroup and return stronger."}
            </p>

            {!didWin && awaitingTribute ? (
              <div className="coding-room__tribute-options">
                <button
                  type="button"
                  className="coding-room__tribute-choice coding-room__tribute-choice--pay"
                  onClick={() => handleTribute("pay")}
                  disabled={choosingTribute || room.user.currency < tribute.payment}
                >
                  <span>Pay tribute</span>
                  <strong>{tributePayment} treasure</strong>
                  <small>{room.user.currency < tribute.payment ? "Not enough treasure" : "One-time payment"}</small>
                </button>
                <button
                  type="button"
                  className="coding-room__tribute-choice coding-room__tribute-choice--tax"
                  onClick={() => handleTribute("tax")}
                  disabled={choosingTribute}
                >
                  <span>Accept the tax</span>
                  <strong>{tribute.tax}% XP</strong>
                  <small>1% of XP for seven days</small>
                </button>
                {choosingTribute && <span className="coding-room__tribute-pending">Confirming {tributeChoice}...</span>}
                {actionError && <p className="coding-room__error" role="alert">{actionError}</p>}
              </div>
            ) : (
              <div className="coding-room__outcome-actions">
                {didWin && awaitingTribute && <span className="coding-room__waiting"><span /> Waiting for tribute choice</span>}
                <button
                  type="button"
                  className="coding-room__button coding-room__button--quiet"
                  onClick={() => navigate("/home")}
                >
                  Return to dashboard
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
