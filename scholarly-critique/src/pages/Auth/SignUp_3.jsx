import React, { useState, useEffect, useContext  } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import "./signup.css";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";

export default function SignUp_3() {
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const [selected, setSelected] = useState(
    () => localStorage.getItem("signup.college_year") || null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const OPTIONS = [
    { key: "freshman",  label: "Freshman"  },
    { key: "sophomore", label: "Sophomore" },
    { key: "junior",    label: "Junior"    },
    { key: "senior",    label: "Senior"    },
  ];

  // Rehydrate from storage so the choice sticks if they come back
  useEffect(() => {
    const saved = localStorage.getItem("signup.college_year");
    if (saved) setSelected(saved);
  }, []);

  const handleSelect = (key) => {
    setSelected(key);
    localStorage.setItem("signup.college_year", key);
  };

const handleNext = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      // Save to backend (only patching the 'education.year' field)
      const { data: updatedUser } = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        { education: { year: selected }, onboarding: { step: 3 } }
      );

      // Merge into context + localStorage
      updateUser((prev) => {
        const next = {
          ...(prev || {}),
          ...(updatedUser || {}),
          education: {
            ...(prev?.education || {}),
            ...(updatedUser?.education || {}),
            year: selected,
          },
        };
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });

      localStorage.removeItem("signup.college_year");
      navigate("/signup4", { state: { collegeYear: selected } });
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
      {/* Header */}
      <header className="welcome-header">
        <div className="logo-section">
          <Link to="/welcome">
            <img src={logo} alt="Logo" className="logo-image" />
          </Link>
          <h1 className="logo-text">ScholarlyCritique</h1>
        </div>
      </header>

     
      <main className="signup2-main" style={{ "--step": 2, "--steps": 7 }}>
        <div className="progress-wrap" aria-label="progress">
          <div className="progress-bar">
            {/* Inline width to force EXACT 30% per your spec */}
            <span className="progress-bar__fill" style={{ width: "30%" }} />
          </div>
          <div className="progress-text">2 of 7</div>
        </div>

        <h2 className="title">What year are you in college?</h2>
        <p className="subtitle">Select one</p>

        {/* Answer is persisted to localStorage as signup.college_year*/}
        <div className="options" role="radiogroup" aria-label="College year">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={selected === opt.key}
              className={"status-option" + (selected === opt.key ? " is-selected" : "")}
              onClick={() => handleSelect(opt.key)}
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