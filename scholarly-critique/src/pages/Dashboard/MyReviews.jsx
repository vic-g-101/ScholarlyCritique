import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?worker";

// pdf.js worker setup (Vite-friendly)
pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();

const tileBase =
  "group relative rounded-xl border border-[#cdb6a9] bg-white hover:shadow-sm hover:translate-y-0.5 transition cursor-pointer overflow-hidden";

/** PDF thumbnail hook (safe if fileUrl is missing) */
function usePdfThumbnail(pdfURL, width = 240) {
  const [thumb, setThumb] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!pdfURL) return;

    (async () => {
      try {
        const cacheKey = `thumb:${pdfURL}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          if (!cancelled) setThumb(cached);
          return;
        }

        const loadingTask = pdfjsLib.getDocument({ url: pdfURL });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaled = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = scaled.width;
        canvas.height = scaled.height;

        await page.render({ canvasContext: ctx, viewport: scaled }).promise;

        const dataUrl = canvas.toDataURL("image/png");
        sessionStorage.setItem(cacheKey, dataUrl);
        if (!cancelled) setThumb(dataUrl);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "thumbnail failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfURL, width]);

  return { thumb, error: err };
}

function ReviewTile({ item, onOpen }) {
  // Your /critiques/me populates: .populate("essay", "topic wordCount author")
  // So fileUrl likely isn't present unless you expand populate fields later.
  const essay = item?.essay || {};
  const title = essay?.title || essay?.topic || "Reviewed Essay";

  const fileUrl =
    essay?.fileUrl ||
    essay?.documentUrl ||
    item?.essayFileUrl ||
    item?.fileUrl ||
    null;

  const previewImageUrl =
    essay?.previewImageUrl ||
    item?.previewImageUrl ||
    null;

  const isPdf = /\.pdf(\?|$)/i.test(fileUrl || "");
  const { thumb } = usePdfThumbnail(isPdf ? fileUrl : null, 260);

  const reviewedAt = item?.createdAt ? new Date(item.createdAt) : null;
  const rated = !!item?.rated;
  const wordCount = typeof essay?.wordCount === "number" ? essay.wordCount : null;

  return (
    <div className={tileBase} onClick={onOpen} title={title}>
      {/* preview area */}
      <div className="bg-[#f7efe9] h-40 w-full overflow-hidden">
        {previewImageUrl ? (
          <img src={previewImageUrl} alt="Preview" className="h-full w-full object-cover" />
        ) : thumb ? (
          <img src={thumb} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-[70%] h-[75%] bg-white rounded-md border border-[#e6d6cd] shadow-[0_1px_0_rgba(0,0,0,0.05)]" />
          </div>
        )}
      </div>

      {/* meta */}
      <div className="p-3">
        <div className="font-semibold text-[#5a3a2f] line-clamp-2 min-h-[2.5rem]">
          {title}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-[#6f5145]">
          <span>{wordCount ? `${wordCount.toLocaleString()} words` : ""}</span>
          <span>{reviewedAt ? reviewedAt.toLocaleDateString() : ""}</span>
        </div>

        <div className="mt-1 text-[11px] text-[#6f5145]">
          {rated ? "Rated by author" : "Awaiting rating"}
        </div>
      </div>

      <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-[#a27b6a] group-focus:ring-2 group-active:ring-2" />
    </div>
  );
}

export default function MyReviews() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);   // always an array
  const [loading, setLoading] = useState(false);

  // Client-side pagination (API doesn't paginate /critiques/me)
  const [page, setPage] = useState(1);
  const pageSize = 24;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(API_PATHS.CRITIQUES.MINE);
        const list = Array.isArray(data?.critiques) ? data.critiques : [];
        if (mounted) {
          setItems(list);
          const maxPage = Math.max(1, Math.ceil(list.length / pageSize));
          if (page > maxPage) setPage(maxPage);
        }
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetch once

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  const openEssay = (critique) => {
    const essayId =
      critique?.essay?._id || critique?.essayId || critique?.essay?.id;
    if (essayId) navigate(`/essays/${essayId}`);
  };

  return (
    <DashboardLayout activeMenu="My Reviews">
      <div className="my-5 mx-auto max-w-[1150px]">
        {/* header */}
        <div className="bg-[#efe3da] rounded-xl border border-[#cdb6a9] px-5 py-3 mb-4">
          <h2 className="text-[#5a3a2f] font-semibold">My Reviews</h2>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* loading skeletons */}
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`s${i}`}
                className="rounded-xl border border-[#e6d6cd] bg-white overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-[#f7efe9]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-[#efdfd6] rounded w-3/4" />
                  <div className="h-3 bg-[#efdfd6] rounded w-1/2" />
                </div>
              </div>
            ))}

          {/* tiles */}
          {!loading &&
            pagedItems.map((it) => (
              <ReviewTile key={String(it._id || it.id)} item={it} onOpen={() => openEssay(it)} />
            ))}
        </div>

        {/* empty state */}
        {!loading && total === 0 && (
          <div className="mt-8 text-center text-[#6f5145]">
            You haven’t written any reviews yet.
          </div>
        )}

        {/* pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-center gap-3 text-[#6f5145] text-sm mt-6">
            <button
              type="button"
              className="px-2 py-1 rounded-full border border-[#cdb6a9] hover:bg-[#f2e6de] disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            <div>
              Page <span className="font-semibold">{page}</span> of{" "}
              {totalPages.toLocaleString()}
            </div>
            <button
              type="button"
              className="px-2 py-1 rounded-full border border-[#cdb6a9] hover:bg-[#f2e6de] disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
