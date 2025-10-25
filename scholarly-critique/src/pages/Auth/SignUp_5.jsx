import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import "./signup.css";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

export default function SignUp_5() {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const [minor, setMinor] = useState(() => localStorage.getItem("signup.minor") || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // If user already has a minor saved, prefer that over draft (optional)
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const existing = u?.education?.minor;
        if (existing && !minor) setMinor(existing);
      } catch {}
    }
  }, []); // run once

  const onChange = (e) => {
    const v = e.target.value;
    setMinor(v);
    localStorage.setItem("signup.minor", v);
  };

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    try {
      const v = minor.trim();

      // Optional field:
      // Only call API if user provided a value; otherwise skip straight ahead.
      let updatedUser = null;
      if (v) {
        const res = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, 
          { education: { minor: v },  onboarding: { step: 5 }, });
        updatedUser = res.data;
      }
      if (!v) {
        await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, 
          { onboarding: { step: 5 } });
      } 

      // Merge into context + localStorage (only if we updated)
      if (updatedUser) {
        updateUser((prev) => {
          const next = {
            ...(prev || {}),
            ...(updatedUser || {}),
            education: {
              ...(prev?.education || {}),
              ...(updatedUser?.education || {}),
              minor: v,
            },
          };
          localStorage.setItem("user", JSON.stringify(next));
          return next;
        });
      }

      localStorage.removeItem("signup.minor");
      navigate("/signup6", { state: { minor: v || null } });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "Could not save your minor. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

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

      <main className="signup2-main" style={{ "--step": 4, "--steps": 7 }}>
        {/* Progress: 4 of 7 at 52% */}
        <div className="progress-wrap" aria-label="progress">
          <div className="progress-bar">
            <span className="progress-bar__fill" style={{ width: "52%" }} />
          </div>
          <div className="progress-text">4 of 7</div>
        </div>

        <h2 className="title">Do you have a minor or secondary area of study?</h2>
        <p className="subtitle">Optional — you can skip this</p>

        <form
          className="options"
          onSubmit={(e) => {
            e.preventDefault();
            if (!saving) handleNext();
          }}
        >
          <input
            type="text"
            className="major-input" /* reuse style */
            placeholder="Write minor / secondary area here"
            value={minor}
            onChange={onChange}
            autoComplete="on"
            aria-label="Minor or secondary area (optional)"
          />

          {error && (
            <p className="text-red-500 text-xs pb-2.5" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <div className="signup2-actions" role="group" aria-label="Step actions">
            {/* Optional → Next is always enabled (unless saving) */}
            <button type="submit" className="next-btn ready" disabled={saving}>
              {saving ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}