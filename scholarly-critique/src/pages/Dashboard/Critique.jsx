import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance, { postForm } from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Mark } from "@tiptap/core";
import { FaStickyNote,  FaStrikethrough, FaCopy } from "react-icons/fa";

const HighlightMark = Mark.create({
  name: "reviewHighlight",
  addOptions() {
    return {
      HTMLAttributes: { class: "bg-yellow-200" },
    };
  },
  parseHTML() {
    return [{ tag: "span.review-highlight" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", { ...HTMLAttributes, class: "review-highlight bg-yellow-200" }, 0];
  },
  addCommands() {
    return {
      toggleReviewHighlight:
        () =>
        ({ chain }) => {
          return chain().toggleMark(this.name).run();
        },
    };
  },
});

const DRAFT_KEY = (id) => `critique:draft:${id}`;

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// Small pill styles
const pill = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

// Theme helpers
const border = "border border-[#ead7cd]";
const card = `bg-white rounded-2xl shadow-sm ${border}`;
const heading = "text-[#5a3a2f] font-semibold";
const textMuted = "text-[#6f5145]";



// Simple toolbar for Tiptap
function EditorToolbar({ editor }) {
  if (!editor) return null;
  return (
    <div className="flex items-center gap-2 border border-[#e8d9d0] rounded-md px-2 py-1 mb-2 bg-[#fffaf7]">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded ${editor.isActive("bold") ? "bg-[#efe3da]" : "hover:bg-[#f8f3f0]"}`}
        title="Bold (Ctrl+B)"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded ${editor.isActive("italic") ? "bg-[#efe3da]" : "hover:bg-[#f8f3f0]"}`}
        title="Italic (Ctrl+I)"
      >
        <i>I</i>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded ${editor.isActive("strike") ? "bg-[#efe3da]" : "hover:bg-[#f8f3f0]"}`}
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <div className="ml-auto text-xs text-[#6f5145]">General Comment</div>
    </div>
  );
}

export default function Critique() {
  const { id: essayId } = useParams();
  const navigate = useNavigate();
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // General comment (Tiptap or textarea)
  const [fallbackComment, setFallbackComment] = useState("");

  const editor = useEditor
    ? useEditor({
        extensions: [StarterKit],
        content: "",
        editorProps: { attributes: { class: "min-h-[140px] outline-none" } },
      })
    : null;

      // Editor for the ESSAY BODY itself (the thing we want to annotate)
  const docEditor = useEditor
    ? useEditor({
        extensions: [StarterKit, HighlightMark],
        content: essay?.bodyText || "",
        editable: true,
        editorProps: {
          attributes: {
            class:
              "tiptap-content leading-7 text-[#3b2a24] whitespace-pre-wrap max-h-[70vh] overflow-auto focus:outline-none",
          },
        },
      })
    : null;

  // Inline edits array: { selection, suggestion, note }
  const [inlineEdits, setInlineEdits] = useState([]);

  // File (optional annotated PDF/doc)
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const cardRef = useRef(null);

  // Existing critiques (for side panel)
  const [existing, setExisting] = useState([]);
  const [showToolbar, setShowToolbar] = useState(false); //is hot bar available
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 }); // pixel coords for positioning
  const [selectedText, setSelectedText] = useState(""); // current highlighted text

  const generalComment = useMemo(
    () => (editor ? editor.getHTML() : fallbackComment),
    // We read only on submit; here we just expose a getter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor?.state, fallbackComment]
  );

  useEffect(() => {
  const raw = localStorage.getItem(DRAFT_KEY(essayId));
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    if (editor && draft.generalCommentHtml) {
      editor.commands.setContent(draft.generalCommentHtml);
    }
    if (typeof draft.fallbackComment === "string") setFallbackComment(draft.fallbackComment);
    if (Array.isArray(draft.inlineEdits)) setInlineEdits(draft.inlineEdits);
  } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [essayId, editor]);

const saveTimer = useRef(null);

const scheduleSave = useCallback((payload) => {
  window.clearTimeout(saveTimer.current);
  saveTimer.current = window.setTimeout(() => {
    localStorage.setItem(DRAFT_KEY(essayId), JSON.stringify(payload));
  }, 600); // save 0.6s after last change
}, [essayId]);

// autosave when any input changes
useEffect(() => {
  const payload = {
    generalCommentHtml: editor ? editor.getHTML() : undefined,
    fallbackComment,
    inlineEdits,
    // optional: fileName: file?.name,
  };
  scheduleSave(payload);
}, [editor?.state, fallbackComment, inlineEdits, scheduleSave]);

  // Fetch essay + critiques
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [{ data: e }, { data: c }] = await Promise.all([
          axiosInstance.get(API_PATHS.ESSAYS.BY_ID(essayId)),
          axiosInstance.get(API_PATHS.CRITIQUES.FOR_ESSAY(essayId)),
        ]);
        if (!mounted) return;
        setEssay(e?.essay || null);
        setExisting(Array.isArray(c?.critiques) ? c.critiques : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load essay.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [essayId]);

  useEffect(() => {
  if (docEditor && essay?.bodyText) {
    docEditor.commands.setContent(essay.bodyText);
  }
}, [docEditor, essay?.bodyText]);

  useEffect(() => {
  const handler = (e) => {
    e.preventDefault();
    e.returnValue = ""; // shows browser native prompt
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, []);

  // Add selection from the essay body
  const addSelectionFromPage = () => {
    const sel = window.getSelection();
    const txt = sel ? sel.toString().trim() : "";
    if (!txt) {
      setError("Select some text in the essay to capture it as a highlight.");
      return;
    }
    setError("");
    setInlineEdits((prev) => [
      ...prev,
      { selection: txt, suggestion: "", note: "" },
    ]);
  };

  const updateEdit = (idx, field, value) => {
    setInlineEdits((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeEdit = (idx) => {
    setInlineEdits((prev) => prev.filter((_, i) => i !== idx));
  };
  // Helper function that is triggered when text is selected
  // When the user mouse-ups inside the essay body, check if there's a selection.
  const handleSelection = () => {
  const sel = window.getSelection();
  if (!sel) return;

  const txt = sel.toString().trim();
  if (!txt) {
    setShowToolbar(false);
    setSelectedText("");
    return;
  }

  // selection rect in viewport space
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // card rect in viewport space
  const cardEl = cardRef.current;
  if (!cardEl) return;
  const cardBox = cardEl.getBoundingClientRect();

  // convert viewport coords -> card-local coords
  const localX = rect.left - cardBox.left + rect.width / 2;
  const localY = rect.top - cardBox.top;

  setSelectedText(txt);
  setToolbarPos({
    x: localX,
    y: localY,
  });
  setShowToolbar(true);
};

  // More helper functions for hotbar
   // Highlight action
  const handleHighlight = () => {
    if (docEditor) {
    docEditor.chain().focus().toggleReviewHighlight().run();
  }
  // also log it as feedback for submission if you want
  setInlineEdits((prev) => [
    ...prev,
    { selection: selectedText, suggestion: "", note: "[highlight]" },
  ]);
  setShowToolbar(false);
  };

  // Comment action
  const handleComment = () => {
    setInlineEdits((prev) => [
      ...prev,
      { selection: selectedText, suggestion: "", note: "" },
    ]);
    setShowToolbar(false);
  };

  // Strikethrough action
  const handleStrike = () => {
  if (docEditor) {
    docEditor.chain().focus().toggleStrike().run();
  }
  setInlineEdits((prev) => [
    ...prev,
    { selection: selectedText, suggestion: "~~STRIKE~~", note: "[strikethrough]" },
  ]);
  setShowToolbar(false);
};

  // Copy action
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
    } catch (_) {
      /* ignore */
    }
    // Keep toolbar open or close? Up to you. I'll keep it open.
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedComment =
      editor ? editor.getText().trim() : fallbackComment.trim();
    const hasComment = trimmedComment.length > 0;
    const hasEdits = inlineEdits.length > 0;

    if (!hasComment && !hasEdits && !file) {
      setError("Add at least one inline edit, a general comment, or attach a file.");
      return;
    }

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append("essayId", essayId);
      if (hasComment) form.append("generalComment", editor ? editor.getHTML() : fallbackComment);
      if (hasEdits) form.append("inlineEdits", JSON.stringify(inlineEdits));
      if (file) form.append("document", file);

      await postForm(API_PATHS.CRITIQUES.SUBMIT, form);
     localStorage.removeItem(DRAFT_KEY(essayId));

 // Go to the Congrats page with context
    const authorName =
   (essay?.author?.firstName && essay?.author?.lastName)
     ? `${essay.author.firstName} ${essay.author.lastName}`
     : (essay?.author?.firstName || essay?.author?.lastName || "User X");
    navigate("/congrats", {
   replace: true,
   state: { from: "critique", authorName }
    });


    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Submission failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="My Reviews">
        <div className="p-6">
          <div className={`${card} p-6`}>Loading…</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!essay) {
    return (
      <DashboardLayout activeMenu="My Reviews">
        <div className="p-6">
          <div className={`${card} p-6 text-red-700 bg-red-50 ${border}`}>
            {error || "Essay not found."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

   // Floating toolbar (appears near selection)
  const toolbar = showToolbar ? (
    <div
      style={{
        position: "absolute",
        left: toolbarPos.x,
        top: toolbarPos.y ,
        transform: "translate(-50%, calc(-100% - 8px))",
        zIndex: 9999,
      }}
      className="flex items-center gap-2 bg-[#874f3e] text-white text-xs rounded-lg shadow-lg border border-[#ead7cd] px-3 py-2"
    >
      {/* Highlight button */}
      <button
        type="button"
        onClick={handleHighlight}
        className="flex items-center gap-1 hover:opacity-80"
        title="Highlight"
      >
        {/* icon: 3 overlapping color circles */}
        <span className="relative w-6 h-4">
          <span className="absolute top-0 bottom-0 right-1 w-4 h-4 rounded-full bg-blue-400" />
          <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-pink-400 " />
          <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-yellow-300" />
        </span>
      </button>

      {/* Comment button */}
      <button
        type="button"
        onClick={handleComment}
        className="flex items-center gap-1 hover:opacity-80"
        title="Comment"
      >
        <FaStickyNote className="w-4 h-4 bg-white text-[#3b2a24] flex items-center justify-center text-[10px] font-bold"/>
        
      </button>

      {/* Strikethrough button */}
      <button
        type="button"
        onClick={handleStrike}
        className="flex items-center gap-1 hover:opacity-80"
        title="Strikethrough"
      >
        <FaStrikethrough className="text-red-500 line-through font-semibold text-sm" />
      </button>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 hover:opacity-80"
        title="Copy"
      >
        <FaCopy className=" w-4 h-4" />
      </button>
    </div>
  ) : null;

  return (
    <DashboardLayout activeMenu="My Reviews">
      <div className="mx-auto max-w-[1200px] p-6 grid grid-cols-12 gap-5 relative">

        {/* Title + Credits */}
        <div className="col-span-12 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl" style={{ color: "#5a3a2f", fontFamily: "Playfair Display" }}>
              {essay.title || essay.topic || "Essay"}
            </h1>
            <div className={`${textMuted} mt-1`}>
              by{" "}
              <span className="font-medium">
                {essay.author?.firstName && essay.author?.lastName
                  ? `${essay.author.firstName} ${essay.author.lastName}`
                  : "Author"}
              </span>{" "}
              • {essay.wordCount?.toLocaleString?.() || "—"} words
            </div>
          </div>

          <div className={`${pill} bg-[#efe3da] text-[#5a3a2f]`}>Begin your critique</div>
        </div>

        {/* Left: Essay content */}
        <div className="col-span-12 lg:col-span-8">
          <div ref={cardRef} className={`${card} relative`}>
            {toolbar}
            <div className="px-5 py-4 border-b border-[#ead7cd] flex items-center justify-between">
              <div className={heading}>Essay</div>
              <button
                type="button"
                onClick={addSelectionFromPage}
                className="text-sm rounded-md px-3 py-1.5 bg-[#874f3e] text-white hover:opacity-90"
                title="Add selected text as an inline edit"
              >
                Add selection
              </button>
            </div>

            <div
              className="px-5 py-4"
              id="essay-body"
              onMouseUp={handleSelection}
            >
              {docEditor && EditorContent ? (
                <EditorContent editor={docEditor} className="tiptap-content" />
              ) : (
                <div className="text-[#3b2a24]">Loading editor…</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Critique panel */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Add critique */}
          <form onSubmit={onSubmit} className={`${card} p-4`}>
            <div className="flex items-center justify-between">
              <div className={heading}>Add Critiques</div>
              <label className="text-xs text-[#6f5145] cursor-pointer">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
               
              </label>
            </div>

            {/* General comment (Tiptap or textarea) */}
            <div className="mt-3">
              <label className="block text-sm text-[#5a3a2f] mb-1">General Comment</label>
              {EditorContent && useEditor ? (
                <>
                  <EditorToolbar editor={editor} />
                  <div className={`${border} rounded-md p-3`}>
                    <EditorContent editor={editor} />
                  </div>
                </>
              ) : (
                <textarea
                  value={fallbackComment}
                  onChange={(e) => setFallbackComment(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-[#e6d6cd] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a27b6a]"
                  placeholder="Share overall feedback, strengths, and suggestions…"
                />
              )}
            </div>

            {/* Inline edits */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm text-[#5a3a2f]">Inline Edits</label>
                <span className={`${pill} bg-[#fffaf7] text-[#6f5145] ${border}`}>
                  {inlineEdits.length} added
                </span>
              </div>

              {inlineEdits.length === 0 && (
                <p className={`mt-2 text-sm ${textMuted}`}>
                  Select text in the essay, then click <b>Add selection</b> to start an edit.
                </p>
              )}

              <div className="mt-2 space-y-3">
                {inlineEdits.map((ed, idx) => (
                  <div key={idx} className="rounded-lg border border-[#ead7cd] p-3 bg-[#fffaf7]">
                    <div className="text-xs text-[#6f5145] mb-2">
                      <span className="font-medium">Selection:</span>{" "}
                      <span className="italic">“{ed.selection}”</span>
                    </div>
                    <input
                      type="text"
                      value={ed.suggestion}
                      onChange={(e) => updateEdit(idx, "suggestion", e.target.value)}
                      placeholder="Suggested rewrite (optional)"
                      className="w-full mb-2 rounded-md border border-[#e6d6cd] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a27b6a]"
                    />
                    <textarea
                      rows={3}
                      value={ed.note}
                      onChange={(e) => updateEdit(idx, "note", e.target.value)}
                      placeholder="Why this change helps (optional)"
                      className="w-full rounded-md border border-[#e6d6cd] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a27b6a]"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeEdit(idx)}
                        className="text-xs text-[#874f3e] hover:opacity-80"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="mt-5">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-md px-4 py-2 bg-[#874f3e] text-white font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Critique"}
              </button>
              <button
                type="button"
                onClick={() => {
                    const payload = {
                    generalCommentHtml: editor ? editor.getHTML() : undefined,
                    fallbackComment,
                    inlineEdits,
                    };
                    localStorage.setItem(DRAFT_KEY(essayId), JSON.stringify(payload));
                }}
                className="mr-2 inline-flex items-center justify-center rounded-md px-4 py-2 border border-[#ead7cd] text-[#5a3a2f] bg-white hover:bg-[#f8f3f0]"
                >
                Save Draft
                </button>
            </div>
          </form>

          {/* Existing critiques (context) */}
          <div className={`${card} p-4`}>
            <div className={heading}>Existing Notes</div>
            {existing.length === 0 ? (
              <p className={`mt-2 text-sm ${textMuted}`}>No critiques yet. Be the first!</p>
            ) : (
              <div className="mt-3 space-y-3 max-h-[40vh] overflow-auto pr-1">
                {existing.map((cr) => (
                  <div key={cr._id} className="rounded-lg border border-[#ead7cd] p-3 bg-[#fffaf7]">
                    <div className="text-sm text-[#5a3a2f] font-medium">
                      {cr.reviewer?.firstName} {cr.reviewer?.lastName}
                    </div>
                    <div className="text-xs text-[#6f5145] mb-2">
                      {new Date(cr.createdAt).toLocaleString()}
                    </div>
                    {cr.generalComment ? (
                      <div
                        className="prose prose-sm max-w-none text-[#3b2a24]"
                        dangerouslySetInnerHTML={{ __html: cr.generalComment }}
                      />
                    ) : (
                      <div className={`text-sm ${textMuted}`}>No general comment.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}