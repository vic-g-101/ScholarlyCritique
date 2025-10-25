import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const TOPICS = [
  {
    key: "humanities",
    title: "Humanities",
    blurb:
      "Philosophy, history, literature, linguistics, anthropology, and culture. Perfect for big ideas, ethical dilemmas, historical analysis, or how cultures evolve and blend.",
  },
  {
    key: "social_sciences",
    title: "Social Sciences",
    blurb:
      "Psychology, political science, economics, sociology, and related fields. Use theory, research, data, and case studies to explain real-world trends and patterns.",
  },
  {
    key: "argumentative_rhetorical",
    title: "Argumentative/ Rhetorical",
    blurb:
      "Persuasion and personal voice. Ideal for college essays, personal statements, or opinion pieces that stake out a clear position.",
  },
  {
    key: "media_writing",
    title: "Media Writing",
    blurb:
      "Journalism, news articles, reviews, and scripts. Great for essays on current events, storytelling, and how media shapes society and public opinion.",
  },
  {
    key: "creative_writing",
    title: "Creative Writing",
    blurb:
      "Short stories, poetry, personal narratives, and creative nonfiction. Focus on imagery, emotion, expression, and strong narrative craft.",
  },
  {
    key: "business_law",
    title: "Business and Law",
    blurb:
      "Case studies, legal analysis, ethics, contracts, and market news. From policy memos to strategy and court precedents.",
  },
  {
    key: "stem",
    title: "STEM",
    blurb:
      "From research summaries and lab results to tech’s impact. Empirical evidence, data-backed insights, and the most fascinating developments in science and tech.",
  },
  {
    key: "interdisciplinary",
    title: "Interdisciplinary",
    blurb:
      "Pieces that bridge categories. Explore unique, wide-ranging topics or simply find something interesting to read.",
  },
];

const cardBase =
  "bg-white rounded-xl border border-[#cdb6a9] p-5 text-left hover:shadow-sm hover:-translate-y-0.5 transition";
const badgeBase =
  "inline-flex items-center rounded-full bg-[#e5d3c8] text-[#5a3a2f] px-3 py-1 text-xs font-semibold";

const STORAGE_KEY = "selectedTopics";

export default function TopicsDashboard() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // keep localStorage in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  }, [selected]);

  const addAndGo = (key) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev;
      const next = [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    navigate(`/browse-essays?topic=${encodeURIComponent(key)}`);
  };

  const goToTopic = (key) => navigate(`/browse-essays?topic=${encodeURIComponent(key)}`);

  const selectedReadable = useMemo(() => {
    const m = Object.fromEntries(TOPICS.map((t) => [t.key, t.title]));
    return selected.map((k) => ({ key: k, label: m[k] || k }));
  }, [selected]);

  return (
    <DashboardLayout activeMenu="Topics">
      <div className="my-5 mx-auto max-w-[1150px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: grid of topic cards */}
          <section>
            <h2 className="text-center text-2xl font-semibold text-[#5a3a2f] underline mb-4">
              Browse By Topic
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TOPICS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => addAndGo(t.key)}
                  className={cardBase}
                  aria-label={`Browse ${t.title}`}
                >
                  <div className="text-xl font-semibold text-[#5a3a2f]">{t.title}</div>
                  <p className="mt-2 text-sm text-[#6f5145] leading-snug">{t.blurb}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Right: Selected topics panel */}
          <aside className="bg-white rounded-xl border border-[#cdb6a9] p-5">
            <h4 className="font-semibold text-[#5a3a2f] underline">Your Selected Topics</h4>

            <div className="mt-3 space-y-2">
              {selectedReadable.length === 0 ? (
                <p className="text-sm text-[#6f5145]">Pick a topic on the left to get started.</p>
              ) : (
                selectedReadable.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => goToTopic(key)}
                    className={`${badgeBase} hover:opacity-90`}
                    title={`Browse ${label}`}
                  >
                    {label}
                  </button>
                ))
              )}
            </div>

            <p className="text-sm text-[#6f5145] mt-5">
              Let’s get started! Choose a topic and we’ll show you essays to review.
            </p>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}