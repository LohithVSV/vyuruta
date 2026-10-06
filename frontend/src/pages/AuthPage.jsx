import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "./AuthPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [step, setStep] = useState(1); // signup only: 1 | 2
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle");

  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({
    email: "",
    password: "",
    college_name: "",
    username: "",
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

  function handleUsernameChange(value) {
    updateSignup("username", value);
    setUsernameStatus(value ? "checking" : "idle");
    setError("");
  }

  useEffect(() => {
    if (mode !== "signup" || step !== 2 || !signup.username) return undefined;

    let active = true;
    const timeout = setTimeout(async () => {
      try {
        const result = await api.usernameAvailable(signup.username);
        if (active) {
          setUsernameStatus(result.available ? "available" : "taken");
        }
      } catch {
        if (active) setUsernameStatus("error");
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [mode, step, signup.username]);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");
    if (!login.email || !login.password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }
      const profileResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const profile = await profileResponse.json();
      if (!profileResponse.ok) {
        throw new Error(profile.detail || "Could not load your account");
      }

      localStorage.setItem("vyuruta_access_token", data.access_token);
      const onboardingKey = `vyuruta_onboarding_seen_user:${profile.id}`;
      const faction =
        localStorage.getItem(`vyuruta_faction_user:${profile.id}`) || "fire";
      if (localStorage.getItem(onboardingKey) !== "true") {
        navigate(`/reveal/${faction}/NEW-CITY`, {
          state: { onboardingKey },
        });
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleStep1Next(e) {
    e.preventDefault();
    setError("");
    if (!signup.email || !signup.password || !signup.college_name) {
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
    if (!signup.username) {
      setError("Pick a username.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("That username is already taken. Try another one.");
      return;
    }
    if (usernameStatus === "checking") {
      setError("Checking username availability. Please wait.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Could not create account");
      }
      navigate("/reveal/fire/NEW-CITY", {
        state: { onboardingKey: `vyuruta_onboarding_seen_user:${data.id}` },
      });
    } catch (err) {
      if (err.message === "Username already taken") {
        setUsernameStatus("taken");
        setError("That username is already taken. Try another one.");
      } else {
        setError(err.message || "Signup failed. Try again.");
      }
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
              <span>Email</span>
              <input
                type="email"
                value={login.email}
                onChange={(e) => updateLogin("email", e.target.value)}
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
                value={signup.college_name}
                onChange={(e) => updateSignup("college_name", e.target.value)}
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

            <div className="username-intro">
              <h2>YOUR ASCENSION BEGINS</h2>
              <p>Choose the name by which the realms shall know you.</p>
            </div>

            <label className="field">
              <span>Username</span>
              <input
                type="text"
                value={signup.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                autoComplete="nickname"
                aria-describedby="username-availability"
                aria-invalid={usernameStatus === "taken"}
              />
            </label>

            <p
              id="username-availability"
              className={`username-availability username-availability--${usernameStatus}`}
              role={usernameStatus === "taken" || usernameStatus === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {usernameStatus === "checking" && "Checking username..."}
              {usernameStatus === "available" && "Username is available."}
              {usernameStatus === "taken" && "Username already exists. Try another username."}
              {usernameStatus === "error" && "Couldn't check username availability. You can still try signing up."}
            </p>

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