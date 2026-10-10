import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import vyurutaLogo from "../assets/landing/logo.png";
import { api, getToken } from "../api";
import "./CodingBattlePage.css";
import "./DailyQuestionPage.css";

function formatDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    dateStyle: "full",
    timeZone: "UTC",
  });
}

export default function DailyQuestionPage() {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("# Write your solution below\n");
  const [runResult, setRunResult] = useState(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return undefined;
    }

    let cancelled = false;
    api.dailyChallenge()
      .then((result) => {
        if (!cancelled) {
          setChallenge(result);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const problem = challenge?.problem;
  const attemptStatus = challenge?.attempt.status;
  const isTerminal = attemptStatus === "solved" || attemptStatus === "forfeited";
  const samples = problem?.sample_test_cases ?? [];
  const sampleResults = runResult?.results.filter((result) => result.is_sample) ?? [];
  const lineCount = Math.max(1, code.split("\n").length);

  const updateCode = (event) => {
    setCode(event.target.value);
    setRunResult(null);
    setMessage("");
    setActionError("");
  };

  const handleEditorKeyDown = (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const editor = event.currentTarget;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      setCode(`${code.slice(0, start)}    ${code.slice(end)}`);
      requestAnimationFrame(() => {
        editor.selectionStart = editor.selectionEnd = start + 4;
      });
    } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleAction("run");
    }
  };

  const handleAction = async (action) => {
    if (busyAction || isTerminal) return;
    setBusyAction(action);
    setActionError("");
    try {
      if (action === "forfeit") {
        const confirmed = window.confirm(
          "Give up on today's question? This cannot be undone, and you will not earn the 5,000 treasure reward.",
        );
        if (!confirmed) return;
        const attempt = await api.forfeitDailyChallenge();
        setChallenge((current) =>
          current ? { ...current, attempt } : current,
        );
        return;
      }

      const result = action === "submit"
        ? await api.submitDailyChallenge(code)
        : await api.runDailyChallenge(code);
      setRunResult(result);
      setMessage(result.message);
      if (result.status === "solved") {
        setChallenge((current) =>
          current
            ? {
                ...current,
                attempt: {
                  ...current.attempt,
                  status: result.status,
                  completed_at: new Date().toISOString(),
                },
              }
            : current,
        );
      }
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  if (loadError) {
    const notPublished = loadError.toLowerCase().includes("not been seeded");
    return (
      <main className="coding-room coding-room--state">
        <section className="coding-room__state-card" role="alert">
          <span className="coding-room__eyebrow">DAILY CHALLENGE</span>
          <h1>{notPublished ? "Today's question isn't published yet" : "Unable to load today's question"}</h1>
          <p>
            {notPublished
              ? "Seed today's question from backend/seed_daily_problems.py, then refresh this page."
              : loadError}
          </p>
          <button
            type="button"
            className="coding-room__button coding-room__button--quiet"
            onClick={() => navigate("/home")}
          >
            Return to dashboard
          </button>
        </section>
      </main>
    );
  }

  if (!challenge) {
    return (
      <main className="coding-room coding-room--state" role="status">
        <div className="coding-room__loading-mark" />
        <p>Preparing today's challenge...</p>
      </main>
    );
  }

  return (
    <main className="coding-room daily-room">
      <header className="coding-room__topbar">
        <div className="coding-room__brand-group">
          <button
            type="button"
            className="coding-room__brand"
            onClick={() => navigate("/home")}
            aria-label="Return to dashboard"
          >
            <img src={vyurutaLogo} alt="Vyuruta" />
          </button>
          <nav className="coding-room__nav" aria-label="Main navigation">
            <button type="button" onClick={() => navigate("/home")}>Dashboard</button>
            <span aria-hidden="true">/</span>
            <span>Daily question</span>
          </nav>
        </div>
        <div className="coding-room__schedule">
          <span>DAILY REWARD</span>
          <strong>{challenge.reward.toLocaleString()} treasure</strong>
        </div>
        <div className="daily-room__date">
          <span>QUESTION FOR</span>
          <strong>{formatDate(challenge.challenge_date)}</strong>
        </div>
      </header>

      <section className="coding-room__workspace">
        <aside className="coding-room__question-pane">
          <div className="coding-room__pane-heading">
            <span className="coding-room__eyebrow">THE DAILY CHALLENGE</span>
            <span className="coding-room__difficulty">Daily</span>
          </div>
          <div className="coding-room__question-content">
            <h1>{problem.title}</h1>
            <div className="coding-room__topics">
              {(problem.topics ?? []).map((topic) => (
                <span key={topic.id ?? topic.name}>{topic.name}</span>
              ))}
            </div>
            <p className="coding-room__description">{problem.description}</p>

            <section className="coding-room__tests" aria-live="polite">
              <div className="coding-room__tests-heading">
                <div>
                  <span className="coding-room__eyebrow">VALIDATION</span>
                  <h2>Sample test cases</h2>
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
                          <pre>{result.actual_output || result.error || "(no output)"}</pre>
                        </div>
                      )}
                    </div>
                  </article>
                );
              }) : (
                <p className="coding-room__empty-tests">No public sample cases were provided.</p>
              )}
              {runResult?.hidden_test_count > 0 && (
                <p className="coding-room__hidden-tests">
                  + {runResult.hidden_test_count} hidden test{runResult.hidden_test_count === 1 ? "" : "s"} checked privately
                </p>
              )}
            </section>
          </div>
        </aside>

        <section className="coding-room__editor-pane" aria-label="Daily question code editor">
          <div className="coding-room__editor-toolbar">
            <div className="coding-room__file-tab">
              <span className="coding-room__python-mark">Py</span>
              <span>solution.py</span>
              <i aria-hidden="true" />
            </div>
            <div className="coding-room__toolbar-status">
              <span className="coding-room__language">Python 3</span>
              <span className="daily-room__status">
                {attemptStatus === "solved"
                  ? "SOLVED"
                  : attemptStatus === "forfeited"
                    ? "FORFEITED"
                    : "IN PROGRESS"}
              </span>
            </div>
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
              disabled={isTerminal || Boolean(busyAction)}
            />
          </div>

          <div className="coding-room__editor-footer">
            <span>{lineCount} lines <span aria-hidden="true">·</span> UTF-8</span>
            <span>Ctrl + Enter to run</span>
          </div>

          <div className="coding-room__actions">
            <div className="coding-room__run-status" role="status">
              {busyAction ? (
                <><span className="coding-room__spinner" /> {busyAction === "submit" ? "Submitting..." : busyAction === "forfeit" ? "Forfeiting..." : "Running tests..."}</>
              ) : message ? (
                <span className={runResult?.all_passed ? "is-passed" : "is-failed"}>{message}</span>
              ) : isTerminal ? (
                <span>
                  {attemptStatus === "solved"
                    ? `Solved. You earned ${challenge.reward.toLocaleString()} treasure.`
                    : "You forfeited today's question. No treasure was awarded."}
                </span>
              ) : (
                <span>Run against the sample and hidden test cases.</span>
              )}
            </div>
            {actionError && <p className="coding-room__error" role="alert">{actionError}</p>}
            {!isTerminal ? (
              <div className="daily-room__buttons">
                <div className="coding-room__action-buttons">
                  <button
                    type="button"
                    className="coding-room__button coding-room__button--run"
                    onClick={() => handleAction("run")}
                    disabled={Boolean(busyAction)}
                  >
                    {busyAction === "run" ? "Running..." : "▶ Run"}
                  </button>
                  <button
                    type="button"
                    className="coding-room__button coding-room__button--submit"
                    onClick={() => handleAction("submit")}
                    disabled={Boolean(busyAction)}
                  >
                    {busyAction === "submit" ? "Submitting..." : "Submit solution"}
                  </button>
                </div>
                <button
                  type="button"
                  className="coding-room__button coding-room__button--quiet"
                  onClick={() => handleAction("forfeit")}
                  disabled={Boolean(busyAction)}
                >
                  Give up
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="coding-room__button coding-room__button--submit daily-room__leaderboard-button"
                onClick={() => navigate("/daily-question/leaderboard")}
              >
                View today's leaderboard
              </button>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
