import React, { useMemo, useContext, useRef, useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { AiFillStar } from 'react-icons/ai';

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?worker";
pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();

const tileBase = "group relative rounded-xl border border-[#cdb6a9] bg-white hover:shadow-sm hover:translate-y-0.5 transition cursor pointer overflow-hidden";

// --- PDF thumbnail hook ---
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

// --- Tile ---
function EssayTile({ item, onOpen }) {
  const fileUrl = item?.fileUrl || item?.documentUrl || null;
  const previewImageUrl = item?.previewImageUrl || null;

  const isPdf = /\.pdf(\?|$)/i.test(fileUrl || "");
  const { thumb } = usePdfThumbnail(isPdf ? fileUrl : null, 260);

  const ratingVal = Number.isFinite(Number(item?.ratingAvg))
    ? Number(item?.ratingAvg)
    : null;
  const reviews = Number(item?.reviewCount ?? item?.reviewsCount ?? 0);

  return (
    <div className={tileBase} onClick={onOpen} title={item?.title || "Open"}>
      {/* preview */}
      <div className="bg-[#f7efe9] h-40 w-full overflow-hidden">
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />
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
          {item?.title || item?.topic || "Untitled Essay"}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-[#6f5145]">
          <span className="inline-flex items-center gap-1">
            <AiFillStar className="text-yellow-500" />
            {ratingVal !== null ? ratingVal.toFixed(2) : "—"}
          </span>
          <span>{reviews} reviews</span>
        </div>
      </div>

      {/* subtle focus ring */}
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-[#a27b6a] group-focus:ring-2 group-active:ring-2" />
    </div>
  );
}

export default function MyEssays() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]); // always an array
  const [loading, setLoading] = useState(false);

  // Client-side paging (API /me does not paginate yet)
  const [page, setPage] = useState(1);
  const pageSize = 24;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // (status filter optional) const params = { status: 'open' };
        const { data } = await axiosInstance.get(API_PATHS.ESSAYS.MINE);
        const list = Array.isArray(data?.essays) ? data.essays : [];
        if (mounted) {
          setItems(list);
          // reset page if list shrinks below current page range
          const maxPage = Math.max(1, Math.ceil(list.length / pageSize));
          if (page > maxPage) setPage(maxPage);
        }
      } catch (_e) {
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

  const openEssay = (id) => navigate(`/essays/${id}`);
  const goUpload = () => navigate("/upload-essay");

  return (
    <DashboardLayout activeMenu="My Essays">
      <div className="my-5 mx-auto max-w-[1150px]">
        {/* header */}
        <div className="bg-[#efe3da] rounded-xl border border-[#cdb6a9] px-5 py-3 mb-4">
          <h2 className="text-[#5a3a2f] font-semibold">My Essays</h2>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* New tile */}
          <button
            type="button"
            onClick={goUpload}
            className={`${tileBase} flex flex-col items-center justify-center h-[260px]`}
            aria-label="Upload a new essay"
          >
            <div className="w-14 h-14 rounded-full border border-[#e5d3c8] flex items-center justify-center text-[#5a3a2f] text-2xl">
              +
            </div>
            <div className="mt-3 font-semibold text-[#5a3a2f]">New Essay</div>
            <div className="text-xs text-[#6f5145]">Upload or start a draft</div>
          </button>

          {/* Loading skeletons */}
          {loading &&
            Array.from({ length: 7 }).map((_, i) => (
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

          {/* Essay tiles */}
          {!loading &&
            pagedItems.map((it) => (
              <EssayTile
                key={String(it._id || it.id)}
                item={it}
                onOpen={() => openEssay(it._id || it.id)}
              />
            ))}
        </div>

        {/* empty state */}
        {!loading && total === 0 && (
          <div className="mt-8 text-center text-[#6f5145]">
            You haven’t uploaded any essays yet.
          </div>
        )}

        {/* footer / pagination (client-side) */}
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