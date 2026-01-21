import React, { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import { API_PATHS } from "../../utils/apiPaths";
import { postForm } from "../../utils/axiosinstance";

const SUBJECTS = [
  { key: "humanities", label: "Humanities" },
  { key: "social_sciences", label: "Social Sciences" },
  { key: "argumentative_rhetorical", label: "Argumentative & Rhetorical Essays" },
  { key: "media_writing", label: "Media Writing" },
  { key: "creative_writing", label: "Creative Writing" },
  { key: "business_law", label: "Business & Law" },
  { key: "stem", label: "STEM" },
  { key: "interdisciplinary", label: "Interdisciplinary" },
];

const EDIT_PREFERENCES = [
  { value: "big_picture", label: "Big Picture" },
  { value: "line_edits", label: "Line Edits" },
  { value: "mix", label: "Mix (Both)" },
];

export default function UploadEssay() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // form state
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState(SUBJECTS[0].key);
  const [summary, setSummary] = useState("");
  const [editPreference, setEditPreference] = useState("mix");
  const [file, setFile] = useState(null);

  // ui state
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onFileSelected = (f) => {
    if (!f) return;
    // Accept common doc & PDF; backend parser handles
    setFile(f);
    setError("");
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onFileSelected(f);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please attach your essay file before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      const form = new FormData();
      // Backend required fields
      form.append("document", file);
      form.append("topic", topic);
      form.append("editPreference", editPreference);
      // Optional
      if (summary) form.append("summary", summary);
      // (Title is not in current schema; sending it is harmless, server may ignore)
      if (title) form.append("title", title);

      await postForm(API_PATHS.ESSAYS.SUBMIT, form);

      navigate("/congrats", { replace: true });
    } catch (err) {
      // Handle known credit error or generic server error
      const status = err?.response?.status;
      if (status === 402) {
        setError(
          err?.response?.data?.message ||
            "You don’t have enough credits to submit this essay."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            "Upload failed. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efe3da] flex flex-col">
      {/* Header (same as Congrats, clickable to dashboard) */}
      <header className="bg-white border-t-4 border-[#874f3e]">
        <div className="max-w-6xl mx-auto h-16 flex items-center px-4">
          <Link to="/dashboard" className="flex items-center group" aria-label="Go to Dashboard">
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

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <h1
            className="text-3xl md:text-4xl mb-6"
            style={{ color: "#5a3a2f", fontFamily: "Playfair Display" }}
          >
            Upload Your Essay
          </h1>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-[#ead7cd] p-6 md:p-7"
          >
            {/* Title */}
            <label className="block text-[#5a3a2f] font-medium mb-2">
              Essay Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              className="w-full mb-4 rounded-md border border-[#e6d6cd] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a27b6a]"
            />

            {/* Subject */}
            <label className="block text-[#5a3a2f] font-medium mb-2">
              Subject Category
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full mb-4 rounded-md border border-[#e6d6cd] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a27b6a] bg-white"
            >
              {SUBJECTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Edit preference */}
            <label className="block text-[#5a3a2f] font-medium mb-2">
              Edit Preference
            </label>
            <select
              value={editPreference}
              onChange={(e) => setEditPreference(e.target.value)}
              className="w-full mb-4 rounded-md border border-[#e6d6cd] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a27b6a] bg-white"
            >
              {EDIT_PREFERENCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Summary / Description */}
            <label className="block text-[#5a3a2f] font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Briefly describe your essay or highlight areas you want feedback on"
              className="w-full mb-5 rounded-md border border-[#e6d6cd] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a27b6a] resize-y"
            />

            {/* Dropzone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={[
                "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                dragOver ? "border-[#a27b6a] bg-[#f7efe9]" : "border-[#d9c5ba] bg-[#fffaf7]",
              ].join(" ")}
            >
              <div className="mb-3 text-[#5a3a2f]">
                <div className="text-2xl" aria-hidden>↥</div>
                <div className="mt-2 font-medium">
                  Drag & drop your essay here
                </div>
                <div className="text-sm text-[#6f5145]">
                  or click to upload
                </div>
              </div>

              {file ? (
                <div className="text-sm text-[#6f5145] mb-3">
                  Selected: <span className="font-medium">{file.name}</span>
                </div>
              ) : null}

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-[#5a736f] text-white font-medium hover:opacity-90"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx" //Only allowing two of these files because of the middleware being used
                className="hidden"
                onChange={(e) => onFileSelected(e.target.files?.[0])}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-md px-4 py-2 bg-[#874f3e] text-white font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Essay"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}