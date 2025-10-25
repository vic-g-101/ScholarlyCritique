import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import "./signup.css";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

export default function SignUp_7() {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const OPTIONS = [
    { key: "humanities", label: "Humanities" },
    { key: "social_sciences", label: "Social Sciences" },
    { key: "argumentative_rhetorical", label: "Argumentative & Rhetorical Essays" },
    { key: "media_writing", label: "Media Writing" },
    { key: "creative_writing", label: "Creative Writing" },
    { key: "business_law", label: "Business & Law" },
    { key: "stem", label: "STEM" },
    { key: "interdisciplinary", label: "Interdisciplinary" },
  ];

  const [selected, setSelected] = useState(() => {
    try {
      const raw = localStorage.getItem("signup.confident_areas");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Preload from user profile if present
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw && (!selected || selected.length === 0)) {
      try {
        const u = JSON.parse(raw);
        const existing = Array.isArray(u?.preferences?.confidentAreas)
          ? u.preferences.confidentAreas
          : [];
        if (existing.length) setSelected(existing);
      } catch {}
    }
  }, []); // once

  const toggle = (key) => {
    setSelected((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem("signup.confident_areas", JSON.stringify(next));
      return next;
    });
  };

  const handleNext = async () => {
    if (!selected.length) return; // require at least 1
    setSaving(true);
    setError(null);
    try {
      const { data: updatedUser } = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        { preferences: { confidentAreas: selected }, onboarding: { step: 7 } }
      );

      updateUser((prev) => {
        const next = {
          ...(prev || {}),
          ...(updatedUser || {}),
          preferences: {
            ...(prev?.preferences || {}),
            ...(updatedUser?.preferences || {}),
            confidentAreas: selected,
          },
        };
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });

      localStorage.removeItem("signup.confident_areas");
      navigate("/signup8", { state: { confidentAreas: selected } });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "Could not save your selections. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = selected.length > 0;

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

      <main className="signup2-main" style={{ "--step": 6, "--steps": 7 }}>
        <div className="progress-wrap" aria-label="progress">
          <div className="progress-bar">
            <span className="progress-bar__fill" style={{ width: "86%" }} />
          </div>
          <div className="progress-text">6 of 7</div>
        </div>

        <h2 className="title">Which academic areas do you feel most confident in?</h2>
        <p className="subtitle">Select all that apply</p>

        {/* 3×3 pill grid */}
        <div
          className="options"
          role="group"
          aria-label="Confident academic areas"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 18 }}
        >
          {OPTIONS.map((opt) => {
            const isSelected = selected.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                className={"status-option" + (isSelected ? " is-selected" : "")}
                onClick={() => toggle(opt.key)}
                aria-pressed={isSelected}
                disabled={saving}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-red-500 text-xs pb-2.5" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <div className="signup2-actions" role="group" aria-label="Step actions">
          <button
            type="button"
            className={"next-btn" + (canProceed ? " ready" : "")}
            disabled={!canProceed || saving}
            onClick={handleNext}
          >
            {saving ? "Saving..." : "Next"}
          </button>
        </div>
      </main>
    </div>
  );
}