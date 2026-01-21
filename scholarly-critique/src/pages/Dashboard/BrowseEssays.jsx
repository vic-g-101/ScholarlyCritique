import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";
import CharAvatar from "../../components/Cards/CharAvatar";
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuBookText } from "react-icons/lu";
import { AiFillStar } from "react-icons/ai";
import { useSearchParams } from "react-router-dom";

const TOPICS = [
  { key: "all", label: "All" },
  { key: "humanities", label: "Humanities" },
  { key: "social_sciences", label: "Social Sciences" },
  { key: "argumentative_rhetorical", label: "Argumentative & Rhetorical Essays" },
  { key: "media_writing", label: "Media Writing" },
  { key: "creative_writing", label: "Creative Writing" },
  { key: "business_law", label: "Business & Law" },
  { key: "stem", label: "STEM" },
  { key: "interdisciplinary", label: "Interdisciplinary" },
];

const topicBadge = (k) => {
 if (!k) return "Topic";
 // accept both API key format (e.g., 'social_sciences') and display strings (e.g., 'Social Sciences')
  const key = String(k).toLowerCase().replace(/\s+/g, "_");
  const map = {
    humanities: "Hum",
    social_sciences: "Soc Sci",
    argumentative_rhetorical: "A&R",
    media_writing: "Media",
    creative_writing: "Creative",
    business_law: "B&L",
    stem: "STEM",
    interdisciplinary: "Inter",
  };
  return map[key] || k; // fall back to raw topic string if unmapped
};

export default function BrowseEssays() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [topic, setTopic] = useState("all");
  const [openDrop, setOpenDrop] = useState(false);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 13;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const [loading, setLoading] = useState(false);
  const [myReviewsCount, setMyReviewsCount] = useState(0);
  const [myEssaysCount, setMyEssaysCount] = useState(0);
  const [credits, setCredits] = useState(0);

  //To filter page if user comes from topics page
  const [searchParams] = useSearchParams();

  useEffect(() => {
  const q = searchParams.get("topic");
  const allowed = new Set([
    "all",
    "humanities",
    "social_sciences",
    "argumentative_rhetorical",
    "media_writing",
    "creative_writing",
    "business_law",
    "stem",
    "interdisciplinary",
  ]);
  if (q && allowed.has(q) && q !== topic) {
    setTopic(q);
    setPage(1);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);

  // credits + counts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [creditsRes, myCritsRes, myEssRes] = await Promise.all([
          axiosInstance.get(API_PATHS.CREDITS.ME),
          axiosInstance.get(API_PATHS.CRITIQUES.MINE),
          axiosInstance.get(API_PATHS.ESSAYS.MINE, { params: { page: 1, pageSize: 1 } }),
        ]);

        if (!mounted) return;

        const cr =
          typeof creditsRes.data?.credits === "number"
            ? creditsRes.data.credits
            : Number(creditsRes.data?.balance ?? 0);
        setCredits(Number.isFinite(cr) ? cr : 0);

        const myCrits = Array.isArray(myCritsRes.data?.critiques)
        ? myCritsRes.data.critiques
        : (Array.isArray(myCritsRes.data?.items) ? myCritsRes.data.items : []);
        setMyReviewsCount(myCrits.length);

        const totalMine = Number(myEssRes.data?.total ?? 0);
        const mineItems = Array.isArray(myEssRes.data?.essays)
        ? myEssRes.data.essays
        : (Array.isArray(myEssRes.data?.items) ? myEssRes.data.items : []);
        setMyEssaysCount(mineItems.length);
      } catch {
        /* soft fail */
      }
    })();
    return () => (mounted = false);
  }, []);

  // feed
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = { page, pageSize, excludeMine: true };
        if (topic !== "all") params.topic = topic;

        const { data } = await axiosInstance.get(API_PATHS.ESSAYS.FEED, { params });
        if (!mounted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total ?? 0));
      } catch {
        if (!mounted) return;
        setItems([]);
        setTotal(0);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [topic, page]);

  const openEssay = (id) => navigate(`/essays/${id}/critique`);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5 mx-auto max-w-[1100px]">
        {/* credits chip */}
        <div className="flex justify-end mb-3">
          <div className="bg-[#f2e6de] border border-[#cdb6a9] rounded-full px-4 py-1.5 text-sm text-[#5a3a2f]">
            You have <span className="font-semibold">{credits}</span> credits available.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* list panel */}
          <div className="bg-[#efe3da] rounded-xl border border-[#cdb6a9] p-4">
            {/* filter header */}
            <div className="flex items-center justify-between">
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setOpenDrop((v) => !v)}
                  className="flex items-center gap-2 bg-[#cbb7aa] text-white rounded-full px-4 py-1.5"
                >
                  <LuBookText />
                  {TOPICS.find((t) => t.key === topic)?.label || "Topics"}
                  <LuChevronDown />
                </button>
                {openDrop && (
                  <div className="absolute z-10 mt-2 w-80 bg-white border border-[#cdb6a9] rounded-lg shadow">
                    {TOPICS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setTopic(t.key);
                          setPage(1);
                          setOpenDrop(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#f7efe9] ${
                          topic === t.key ? "bg-[#f3e8e1]" : ""
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-[#6f5145]">{total.toLocaleString()} Results</div>
            </div>

            {/* list */}
            <div className="mt-3 space-y-3">
              {loading && <div className="text-[#6f5145] text-sm">Loading essays…</div>}

              {!loading &&
                items.map((it) => (
                  <button
                    key={it._id}
                    type="button"
                    onClick={() => openEssay(it._id)}
                    className="w-full bg-white rounded-full px-3 py-2 border border-[#cdb6a9] hover:bg-[#f8f1ec] text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center gap-1 bg-[#e5d3c8] text-[#5a3a2f] text-xs font-semibold rounded-full px-2 py-0.5 shrink-0">
                        {topicBadge(it.topic)}
                      </span>
                      <span className="truncate text-[#5a3a2f]">
                        {it.title || it.topic || "Untitled Essay"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[#6f5145] text-sm">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-4 h-3 rounded-sm bg-[#874f3e]" />
                        ({(it.wordCount ?? 0).toLocaleString()} Words)
                      </span>
                      <span className="text-[#5a3a2f]">
                        ~ {(it.creditsCost ?? Math.ceil((it.wordCount || 0) / 500)).toLocaleString()} Credits
                      </span>
                    </div>
                  </button>
                ))}

              {!loading && items.length === 0 && (
                <div className="text-[#6f5145] text-sm">No essays found.</div>
              )}
            </div>

            {/* pagination */}
            <div className="mt-4 flex items-center justify-center gap-3 text-[#6f5145] text-sm">
              <button
                type="button"
                className="p-1 rounded-full border border-[#cdb6a9] hover:bg-[#f2e6de] disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <LuChevronLeft />
              </button>
              <div>
                Page <span className="font-semibold">{page}</span> of {totalPages.toLocaleString()}
              </div>
              <button
                type="button"
                className="p-1 rounded-full border border-[#cdb6a9] hover:bg-[#f2e6de] disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <LuChevronRight />
              </button>
            </div>
          </div>

          {/* right column: user panel */}
          <aside className="space-y-4">
            <div className="bg-white rounded-xl border border-[#cdb6a9] p-5 text-[#5a3a2f]">
              <div className="flex items-center gap-3">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover bg-slate-200"
                  />
                ) : (
                  <CharAvatar
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    width="w-12"
                    height="h-12"
                  />
                )}
                <div>
                  <div className="font-semibold">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
                  </div>
                  {user?.email && <div className="text-xs text-[#6f5145]">{user.email}</div>}
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AiFillStar />
                    {(user?.ratingAvg ?? 0).toFixed(2)} Reviewer Rating
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#f5ece6] rounded-lg px-3 py-2 text-center">
                  <div className="font-semibold">{myEssaysCount}</div>
                  <div className="text-[#6f5145]">Essays Uploaded</div>
                </div>
                <div className="bg-[#f5ece6] rounded-lg px-3 py-2 text-center">
                  <div className="font-semibold">{myReviewsCount}</div>
                  <div className="text-[#6f5145]">Essays Critiqued</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}