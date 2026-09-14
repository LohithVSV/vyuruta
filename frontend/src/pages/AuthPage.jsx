import { useState } from "react";
import "./AuthPage.css";

const FACTIONS = [
  { id: "fire", label: "Fire", tagline: "Aggressive · fast conquest" },
  { id: "water", label: "Water", tagline: "Defensive · steady growth" },
];

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [step, setStep] = useState(1); // signup only: 1 | 2
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [login, setLogin] = useState({ identifier: "", password: "" });
  const [signup, setSignup] = useState({
    email: "",
    password: "",
    college: "",
    username: "",
    faction: "",
  });

  function switchMode(next) {
    setMode(next);
    setStep(1);
    setError("");
  }

  function updateLogin(field, value) {
    setLogin((prev) => ({ ...prev, [field]: value }));
  }

  function updateSignup(field, value) {
    setSignup((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");
    if (!login.identifier || !login.password) {
      setError("Enter your email/username and password.");
      return;
    }
    setLoading(true);
    try {
      // TODO: wire to FastAPI once the auth route exists
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      console.log("logged in", data);
      // TODO: redirect to /map or wherever the game home is
    } catch (err) {
      setError(err.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleStep1Next(e) {
    e.preventDefault();
    setError("");
    if (!signup.email || !signup.password || !signup.college) {
      setError("Fill in email, password, and college to continue.");
      return;
    }
    if (signup.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setStep(2);
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    setError("");
    if (!signup.username || !signup.faction) {
      setError("Pick a username and a faction.");
      return;
    }
    setLoading(true);
    try {
      // TODO: wire to FastAPI once the auth route exists
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup),
      });
      if (!res.ok) throw new Error("Could not create account");
      const data = await res.json();
      console.log("signed up", data);
      // TODO: redirect to /map — a city gets auto-assigned on the backend
    } catch (err) {
      setError(err.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stage">
      <img className="bg" src="/vyuruta-bg.png" alt="" />

      <div className="panel">
        <div className="tabs">
          <button
            type="button"
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {mode === "login" && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label className="field">
              <span>Email or Username</span>
              <input
                type="text"
                value={login.identifier}
                onChange={(e) => updateLogin("identifier", e.target.value)}
                autoComplete="username"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={login.password}
                onChange={(e) => updateLogin("password", e.target.value)}
                autoComplete="current-password"
              />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="cta" disabled={loading}>
              {loading ? "Entering..." : "Enter Vyuruta"}
            </button>
          </form>
        )}

        {mode === "signup" && step === 1 && (
          <form className="auth-form" onSubmit={handleStep1Next}>
            <div className="steps">
              <span className="dot on" />
              <span className="dot" />
            </div>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={signup.email}
                onChange={(e) => updateSignup("email", e.target.value)}
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={signup.password}
                onChange={(e) => updateSignup("password", e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="field">
              <span>College</span>
              <input
                type="text"
                value={signup.college}
                onChange={(e) => updateSignup("college", e.target.value)}
              />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="cta">
              Next
            </button>
          </form>
        )}

        {mode === "signup" && step === 2 && (
          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <div className="steps">
              <span className="dot" />
              <span className="dot on" />
            </div>

            <label className="field">
              <span>Username</span>
              <input
                type="text"
                value={signup.username}
                onChange={(e) => updateSignup("username", e.target.value)}
                autoComplete="nickname"
              />
            </label>

            <div className="factions">
              {FACTIONS.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  className={
                    "faction-card " +
                    f.id +
                    (signup.faction === f.id ? " selected" : "")
                  }
                  onClick={() => updateSignup("faction", f.id)}
                >
                  <span className="faction-name">{f.label}</span>
                  <span className="faction-tag">{f.tagline}</span>
                </button>
              ))}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="row">
              <button
                type="button"
                className="ghost"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button type="submit" className="cta" disabled={loading}>
                {loading ? "Conquering..." : "Begin Conquest"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}