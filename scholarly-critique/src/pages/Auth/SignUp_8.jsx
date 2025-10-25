import React, { useEffect, useState, useContext} from 'react';
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import "./signup.css";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

export default function SignUp_8() {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const OPTIONS = [
    { key: "big_picture", label: "Big-picture critique (structure, clarity, flow)" },
    { key: "line_edits", label: "Line-level edits (grammar, clarity, word choice)" },
    { key: "mix", label: "A mix of both" },
  ];

  const [selected, setSelected] = useState(
    () => localStorage.getItem("signup.feedback_type") || null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Preload from user profile if present
  useEffect(() => {
    if (!selected) {
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          const u = JSON.parse(raw);
          const existing = u?.preferences?.feedbackType;
          if (existing) setSelected(existing);
        } catch {}
      }
    }
  }, []); // once

  const handleSelect = (key) => {
    setSelected(key);
    localStorage.setItem("signup.feedback_type", key);
  };

  const handleFinish = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const { data: updatedUser } = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        { preferences: { feedbackType: selected },onboarding: { completed: true } }
      );

      updateUser((prev) => {
        const next = {
          ...(prev || {}),
          ...(updatedUser || {}),
          preferences: {
            ...(prev?.preferences || {}),
            ...(updatedUser?.preferences || {}),
            feedbackType: selected,
          },
        };
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });

      localStorage.removeItem("signup.feedback_type");
      navigate("/dashboard");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "Could not save your preference. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="signup2-shell">
      <header className="welcome-header">
        <div className="logo-section">
          <Link to="/welcome">
            <img src={logo} alt="Logo" className="logo-image" />
          </Link>
          <h1 className="logo-text">ScholarlyCritique</h1>
        </div>
      </header>

      <main className="signup2-main" style={{ "--step": 7, "--steps": 7 }}>
        <div className="progress-wrap" aria-label="progress">
          <div className="progress-bar">
            <span className="progress-bar__fill" style={{ width: "100%" }} />
          </div>
          <div className="progress-text">7 of 7</div>
        </div>

        <h2 className="title">What type of feedback do you usually give?</h2>
        <p className="subtitle">Select one</p>

        <div className="options" role="radiogroup" aria-label="Feedback type">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={selected === opt.key}
              className={"status-option" + (selected === opt.key ? " is-selected" : "")}
              onClick={() => handleSelect(opt.key)}
              disabled={saving}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-xs pb-2.5" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <div className="signup2-actions" role="group" aria-label="Step actions">
          <button
            type="button"
            className={"next-btn" + (selected ? " ready" : "")}
            disabled={!selected || saving}
            onClick={handleFinish}
          >
            {saving ? "Saving..." : "Finish"}
          </button>
        </div>
      </main>
    </div>
  );
}