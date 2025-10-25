import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import feather from "../../assets/images/Feather-Photoroom.png";

export default function Congrats() {
  const navigate = useNavigate();
  const location = useLocation();

  const isFromCritique = location.state?.from === "critique";
  const authorName = location.state?.authorName || "User X";

  // Compute which text to show
  const title = isFromCritique
    ? `Congrats on reviewing “${authorName}’s” essay!`
    : "Congrats on uploading your essay!";

  const body = isFromCritique
    ? "You’ve earned credits for your review. The author can rate your critique to award you even more. Use your credits to upload your own essays!"
    : "We’ll notify you when somebody reviews your essay.\nTake a break and be proud of your work!";

  return (
    <div className="min-h-screen bg-[#efe3da] flex flex-col">
      {/* Top bar*/}
      <header className="bg-white border-t-4 border-[#874f3e]">
        <div className="max-w-6xl mx-auto h-16 flex items-center px-4">
          <Link
            to="/dashboard"
            className="flex items-center group"
            aria-label="Go to Dashboard"
          >
            <img src={logo} alt="ScholarlyCritique" className="h-8 w-auto mr-3" />
            <span
              className="text-xl tracking-tight group-hover:opacity-80"
              style={{ fontFamily: "Playfair Display", color: "#874f3e" }}
            >
              ScholarlyCritique
            </span>
          </Link>
        </div>
      </header>

      {/*Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-xl">
          {/* Feather illustration */}
          <img
            src={feather}
            alt="Feather illustration"
            className="mx-auto mb-8 h-20 w-20 object-contain select-none pointer-events-none"
            draggable="false"
          />

          {/*Unified conditional text */}
          <h1 className="text-3xl md:text-4xl font-semibold text-[#7a493a] mb-4">
            {title}
          </h1>

          <p
            className="text-[#6f5145] leading-relaxed mb-8"
            style={{ whiteSpace: "pre-line" }}
          >
            {body}
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard", { replace: true })}
            className="inline-flex items-center justify-center rounded-full px-6 py-2 bg-[#874f3e] text-white font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a26a59]"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
