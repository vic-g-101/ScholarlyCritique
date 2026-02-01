import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import "./signup.css";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";

export default function SignUp2() {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const [selected, setSelected] = useState(
    () => localStorage.getItem("signup.education.status") || null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Force a reload on SignUp dont know why its not working yet
const location = useLocation();

useEffect(() => {
  const key = `signup2-reloaded-${location.key}`;

  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "true");
    window.location.reload();
  }
}, [location.key]);
  const OPTIONS = [
    { key: "undergraduate", label: "Undergraduate" },
    { key: "graduate", label: "Graduate" },
    { key: "recent", label: "Recent Graduate" },
    { key: "not", label: "Not a College Student" },
  ];

  const handleSelect = (key) => {
    setSelected(key);
    localStorage.setItem("signup.education.status", key);
  };

  const handleNext = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      // Save to backend
      const { data: updatedUser } = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        { education: { status: selected }, onboarding: { step: 2 } }
      );

      // Merge into context + localStorage
      updateUser((prev) => {
        const next = {
          ...(prev || {}),
          ...(updatedUser || {}),
          education: {
            ...(prev?.education || {}),
            ...(updatedUser?.education || {}),
            status: selected,
          },
        };
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });

      localStorage.removeItem("signup.education.status");

      // Route logic
      if (selected === "undergraduate") {
        navigate("/signup3", { state: { role: selected } });
      } else if (selected === "graduate" || selected === "recent") {
        navigate("/signup4", { state: { role: selected } });
      } else if (selected === "not") {
        navigate("/signup7", { state: { role: selected } });
      } else {
        navigate("/signup4", { state: { role: selected } });
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "Could not save your selection. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="signup2-shell">
      {/* Header with logo */}
      <header className="welcome-header">
        <div className="logo-section">
          <Link to="/welcome">
            <img src={logo} alt="Logo" className="logo-image" />
          </Link>
          <h1 className="logo-text">ScholarlyCritique</h1>
        </div>
      </header>

      <main className="signup2-main">
        {/* Progress */}
        <div className="progress-wrap" aria-label="progress">
          <div className="progress-bar">
            <span className="progress-bar__fill" style={{ width: "15%" }} />
          </div>
          <div className="progress-text">1 of 7</div>
        </div>

        <h2 className="title">What is your current academic status?</h2>
        <p className="subtitle">Select one</p>

        <div className="options" role="radiogroup" aria-label="Academic status">
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
            onClick={handleNext}
          >
            {saving ? "Saving..." : "Next"}
          </button>
        </div>
      </main>
    </div>
  );
}
