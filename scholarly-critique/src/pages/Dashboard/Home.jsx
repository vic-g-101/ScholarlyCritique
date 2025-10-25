import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import InfoCard from "../../components/Cards/InfoCard";
import { AiFillStar } from "react-icons/ai";
import { LuUpload } from "react-icons/lu";
import { FaRegFileAlt } from 'react-icons/fa';

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA);
      setDashboardData(data || {});
    } catch (error) {
      console.error("Dashboard load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const credits = (() => {
  const d = dashboardData;

  // API returns a number
  if (typeof d?.credits === "number") return d.credits;

  // API returns an object { balance, total, ... }
  if (d?.credits && typeof d.credits === "object") {
    const n = Number(d.credits.balance ?? d.credits.total ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  // fallback to localStorage user
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (typeof u?.credits === "number") return u.credits;
    if (u?.credits && typeof u.credits === "object") {
      const n = Number(u.credits.balance ?? u.credits.total ?? 0);
      return Number.isFinite(n) ? n : 0;
    }
  } catch {}

  return 0;
})();

//For AI bot that generates prompts
const [generating, setGenerating] = useState(false);
const [genError, setGenError] = useState(null);

const handleGeneratePrompts = async () => {
  setGenerating(true);
  setGenError(null);
  try {
    // pull user context (major/minor/confidentAreas) from localStorage fallback
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const payload = {
      major: user?.education?.major || null,
      minor: user?.education?.minor || null,
      confidentAreas: Array.isArray(user?.preferences?.confidentAreas)
        ? user.preferences.confidentAreas
        : [],
      // optional: topic interests if you store them
      // topics: Array.isArray(user?.preferences?.topics) ? user.preferences.topics : [],
      count: 3, // ask backend for 3 concise prompts
    };

    const { data } = await axiosInstance.post(
      API_PATHS.AI.PROMPTS,
      payload
    );

    const prompts = Array.isArray(data?.prompts) ? data.prompts : [];
    // merge into dashboard data so UI updates
    setDashboardData((prev) => ({ ...(prev || {}), prompts }));
  } catch (e) {
    setGenError(
      e?.response?.data?.message || "Could not generate prompts. Please try again."
    );
  } finally {
    setGenerating(false);
  }
};

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5 mx-auto max-w-[1150px]">
        {/* Header row (greeting + top reviewers aside) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-lg font-semibold text-[#5a3a2f]">
                Hi {dashboardData?.firstName || JSON.parse(localStorage.getItem("user") || "{}")?.firstName || "there"}! 👋
              </p>
              <p className="mt-1 text-[#5a3a2f]">
                <span className="font-semibold">You have {credits} credits available.</span>
              </p>
              <p className="text-[#5a3a2f]">What would you like to do today?</p>

              {/* Action tiles */}
             <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => navigate("/upload-essay")}
                  className="w-full bg-white hover:bg-[#f9f5f2] transition-colors rounded-xl border border-gray-200 p-6 text-left flex items-center gap-4"
                  aria-label="Upload Essay"
                >
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#e5d6cd]">
                    <LuUpload size={24} className="text-[#5a3a2f]" />
                  </span>
                  <span className="text-[#5a3a2f] font-semibold">Upload Essay</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/browse-essays")}
                  className="w-full bg-white hover:bg-[#f9f5f2] transition-colors rounded-xl border border-gray-200 p-6 text-left flex items-center gap-4"
                  aria-label="Review Essays"
                >
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#e5d6cd]">
                    <FaRegFileAlt size={24} className="text-[#5a3a2f]" />
                  </span>
                  <span className="text-[#5a3a2f] font-semibold">Review Essays</span>
                </button>
              </div>


            </div>

            {/* Suggested For You */}
            <div className="border-t border-dashed mt-6 pt-6">
              <h3 className="underline font-semibold text-[#5a3a2f]">
                Suggested For You
              </h3>

              <div className="mt-3 space-y-5">
                {(dashboardData?.suggestions || []).map((s, idx) => (
                  <div key={idx}>
                    <button
                      className="text-[#5a3a2f] font-semibold hover:underline text-left"
                      onClick={() => navigate(`/my-reviews?suggested=${encodeURIComponent(s.id || idx)}`)}
                    >
                      {s.title}
                    </button>
                    <div className="text-sm text-[#6f5145]">
                      {s.topic} — {s.wordCount.toLocaleString()} words
                      {typeof s.creditsEarnable === "number" ? (
                        <> ({s.creditsEarnable} credits earned)</>
                      ) : null}
                    </div>
                  </div>
                ))}

                {/* Fallbacks while loading or if empty */}
                {!loading && (!dashboardData?.suggestions || dashboardData.suggestions.length === 0) && (
                  <>
                    <div>
                      <span className="text-[#5a3a2f] font-semibold">
                        Should Free Speech protect Hate Speech?
                      </span>
                      <div className="text-sm text-[#6f5145]">
                        Political Science – 3,871 words (8 credits earned)
                      </div>
                    </div>
                    <div>
                      <span className="text-[#5a3a2f] font-semibold">
                        Price Controls in Modern Markets
                      </span>
                      <div className="text-sm text-[#6f5145]">
                        Economics – 882 words (2 credits earned)
                      </div>
                    </div>
                    <div>
                      <span className="text-[#5a3a2f] font-semibold">
                        P. Diddy’s Verdict and why it makes sense
                      </span>
                      <div className="text-sm text-[#6f5145]">
                        Law &amp; Journalism – 1,672 words (3 credits earned)
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Right aside: Top reviewers + prompts */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-[#5a3a2f]">
                Top Reviewers This Month
              </h4>

              <div className="mt-4 space-y-4">
                {(dashboardData?.topReviewers || []).map((r, idx) => (
                  <div key={idx} className="flex items-start justify-between">
                    <div>
                      <div className="text-[#5a3a2f] font-semibold">{r.name}</div>
                      <div className="text-xs text-[#7a5c4d]">
                        {r.school ? `${r.school}` : ""}
                        {r.major ? ` – ${r.major}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#7a5c4d]">
                      <AiFillStar className="text-yellow-500" />
                      <span className="text-sm">{Number(r.rating).toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {/* Example placeholders if API empty */}
                {(!dashboardData?.topReviewers || dashboardData.topReviewers.length === 0) && (
                  <>
                    {[
                      { name: "Kenny D.", school: "USC – International Relations & Econ", rating: 4.9 },
                      { name: "Victor G.", school: "UCSD – Math & Computer Science", rating: 4.88 },
                      { name: "Ryan M.", school: "HS Graduate – Pilot", rating: 4.6 },
                      { name: "Nick K.", school: "UCSD – Biology", rating: 4.5 },
                    ].map((r, i) => (
                      <div key={i} className="flex items-start justify-between">
                        <div>
                          <div className="text-[#5a3a2f] font-semibold">{r.name}</div>
                          <div className="text-xs text-[#7a5c4d]">{r.school}</div>
                        </div>
                        <div className="flex items-center gap-1 text-[#7a5c4d]">
                          <AiFillStar className="text-yellow-500" />
                          <span className="text-sm">{r.rating}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                <p className="text-xs text-[#7a5c4d] mt-2">
                  Give quality reviews to get on this list!
                </p>
              </div>
            </div>

            {/* Prompts */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-[#5a3a2f]">Need prompts for a new essay?</h4>
                <button
                  type="button"
                  onClick={handleGeneratePrompts}
                  disabled={generating}
                  className="px-3 py-1.5 rounded-md border border-[#874f3e] text-[#874f3e] hover:bg-[#f2e6de] disabled:opacity-60"
                >
                  {generating ? "Generating…" : "Generate"}
                </button>
              </div>

              {genError && (
                <p className="text-red-500 text-xs mt-2" role="alert" aria-live="polite">
                  {genError}
                </p>
              )}

              <div className="mt-3 space-y-4 text-[#6f5145] text-sm">
                {(dashboardData?.prompts || []).map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}

                {/* Fallbacks if none yet */}
                {(!dashboardData?.prompts || dashboardData.prompts.length === 0) && !generating && (
                  <>
                    <p>
                      As the richest country in the world, does the United States have an inherent responsibility
                      to share its wealth and help less developed countries? Why or why not?
                    </p>
                    <p>Why are younger generations increasingly less religious?</p>
                    <p>How do you define the word “smart” in every sense of the word?</p>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;