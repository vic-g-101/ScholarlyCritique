import React, { useState, useEffect, useContext} from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import "./signup.css";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

export default function SignUp_6() {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const [university, setUniversity] = useState(
    () => localStorage.getItem("signup.university") || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Rehydrate from user (if already present)
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const existing = u?.education?.university;
        if (existing && !university) setUniversity(existing);
      } catch {}
    }
  }, []); // run once

  const onChange = (e) => {
    const v = e.target.value;
    setUniversity(v);
    localStorage.setItem("signup.university", v);
  };

  const handleNext = async () => {
    const v = university.trim();
    if (!v) return; // required
    setSaving(true);
    setError(null);
    try {
      const { data: updatedUser } = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        { education: { university: v }, onboarding: { step: 6 } }
      );

      updateUser((prev) => {
        const next = {
          ...(prev || {}),
          ...(updatedUser || {}),
          education: {
            ...(prev?.education || {}),
            ...(updatedUser?.education || {}),
            university: v,
          },
        };
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });

      localStorage.removeItem("signup.university");
      navigate("/signup7", { state: { university: v } });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "Could not save your university. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = university.trim().length > 0;

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

      <main className="signup2-main" style={{ "--step": 5, "--steps": 7 }}>
        {/* Progress: 5 of 7 at 72% */}
        <div className="progress-wrap" aria-label="progress">
          <div className="progress-bar">
            <span className="progress-bar__fill" style={{ width: "72%" }} />
          </div>
          <div className="progress-text">5 of 7</div>
        </div>

        <h2 className="title">What university do you go to / did you go to?</h2>
        <p className="subtitle">This is required</p>

        <form
          className="options"
          onSubmit={(e) => {
            e.preventDefault();
            if (canProceed && !saving) handleNext();
          }}
        >
          <input
            type="text"
            className="major-input" /* reuse style */
            placeholder="Type University here"
            value={university}
            onChange={onChange}
            autoComplete="organization"
            autoFocus
            aria-label="University"
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