import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import "./signup.css";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

export default function SignUp_4() {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const [major, setMajor] = useState(() => localStorage.getItem("signup.major") || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Rehydrate from user (if already present on profile)
  useEffect(() => {
    // optional: if user already has a major saved, prefer that over draft
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const existing = u?.education?.major;
        if (existing && !major) setMajor(existing);
      } catch {}
    }
  }, []); // run once

  const onChange = (e) => {
    const v = e.target.value;
    setMajor(v);
    localStorage.setItem("signup.major", v);
  };

  const handleNext = async () => {
    const v = major.trim();
    if (!v) return;
    setSaving(true);
    setError(null);
    try {
      // save to backend: education.major
      const { data: updatedUser } = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        { education: { major: v }, onboarding: { step: 4 }  }
      );

      // merge into context + localStorage
      updateUser((prev) => {
        const next = {
          ...(prev || {}),
          ...(updatedUser || {}),
          education: {
            ...(prev?.education || {}),
            ...(updatedUser?.education || {}),
            major: v,
          },
        };
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });

      // clear draft + continue
      localStorage.removeItem("signup.major");
      navigate("/signup5", { state: { major: v } });
    } catch (e) {
      const msg =
        e?.response?.data?.message || "Could not save your major. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = major.trim().length > 0;

  return (
    <div className="signup2-shell">
      {/* Header */}
      <header className="welcome-header">
        <div className="logo-section">
          <Link to="/welcome">
            <img src={logo} alt="Logo" className="logo-image" />
          </Link>
          <h1 className="logo-text">ScholarlyCritique</h1>
        </div>
      </header>

      <main className="signup2-main" style={{ "--step": 3, "--steps": 7 }}>
        {/* Progress: 3 of 7 at 42% */}
        <div className="progress-wrap" aria-label="progress">
          <div className="progress-bar">
            <span className="progress-bar__fill" style={{ width: "42%" }} />
          </div>
          <div className="progress-text">3 of 7</div>
        </div>

        <h2 className="title">What is your major?</h2>
        <p className="subtitle">Type your answer</p>

        <form
          className="options"
          onSubmit={(e) => {
            e.preventDefault();
            if (canProceed && !saving) handleNext();
          }}
        >
          <input
            type="text"
            className="major-input"
            placeholder="Write major here"
            value={major}
            onChange={onChange}
            autoComplete="on"
            autoFocus
            aria-label="Major"
          />

          {error && (
            <p className="text-red-500 text-xs pb-2.5" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <div className="signup2-actions" role="group" aria-label="Step actions">
            <button
              type="submit"
              className={"next-btn" + (canProceed ? " ready" : "")}
              disabled={!canProceed || saving}
            >
              {saving ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}