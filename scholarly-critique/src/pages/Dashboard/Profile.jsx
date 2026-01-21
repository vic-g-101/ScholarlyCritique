import React, { useEffect, useState, useContext} from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";
import CharAvatar from "../../components/Cards/CharAvatar";
import { AiFillStar } from "react-icons/ai";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import uploadImage from "../../utils/uploadImage";

const StarRow = ({ value = 0, size = 18 }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <AiFillStar key={`f${i}`} size={size} className="text-yellow-500" />
      ))}
      {half === 1 && (
        <AiFillStar
          key="half"
          size={size}
          className="text-yellow-500 opacity-60"
        />
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <AiFillStar
          key={`e${i}`}
          size={size}
          className="text-gray-300"
        />
      ))}
    </div>
  );
};

const line = "border-t border-dashed border-[#b89d8f]";



export default function Profile() {
  const { user } = useContext(UserContext);
  const [me, setMe] = useState(user || null);

  // history
  const [myReviews, setMyReviews] = useState([]); // critiques I wrote
  const [myEssays, setMyEssays] = useState([]);   // essays I uploaded
  const [loading, setLoading] = useState(false);

  // avatar editing
    const [profileFile, setProfileFile] = useState(null); // new file picked
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState(null);
    const [avatarSuccess, setAvatarSuccess] = useState(null);

    const { updateUser } = useContext(UserContext);
    const handleSaveAvatar = async () => {
  if (!profileFile) return;
  setSavingAvatar(true);
  setAvatarError(null);
  setAvatarSuccess(null);

  try {
    // 1) Upload to server (returns { imageUrl })
    const up = await uploadImage(profileFile);
    const imageUrl = up?.imageUrl;
    if (!imageUrl) throw new Error("Upload failed: no imageUrl returned.");

    // 2) Persist on user profile
    const { data: updated } = await axiosInstance.put(
      API_PATHS.AUTH.UPDATE_PROFILE,
      { profileImageUrl: imageUrl }
    );

    // 3) Update local state + context + localStorage
    setMe((prev) => ({ ...(prev || {}), profileImageUrl: imageUrl }));
    updateUser((prev) => ({ ...(prev || {}), profileImageUrl: imageUrl }));

    setAvatarSuccess("Profile photo updated!");
    setProfileFile(null); // clear the local file selection
  } catch (e) {
    setAvatarError(
      e?.response?.data?.message || e?.message || "Could not update profile photo."
    );
  } finally {
    setSavingAvatar(false);
    // auto-hide success after a moment (optional)
    setTimeout(() => setAvatarSuccess(null), 2500);
  }
};

  // pull latest user + history
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        // user
        const meRes = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);
        if (mounted) setMe(meRes.data);

        // reviews I wrote
        const r = await axiosInstance.get(API_PATHS.PROFILE.MY_REVIEWS);
        if (mounted) setMyReviews(Array.isArray(r.data?.items) ? r.data.items : (r.data || []));

        // essays I uploaded
        const e = await axiosInstance.get(API_PATHS.PROFILE.MY_ESSAYS);
        if (mounted) setMyEssays(Array.isArray(e.data?.items) ? e.data.items : (e.data || []));
      } catch (err) {
        // soft-fail; page still renders with fallbacks
        console.error("Profile load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => (mounted = false);
  }, []);

  const ratingAvg = Number(me?.ratingAvg ?? 0);
  const ratingCount = Number(me?.ratingCount ?? 0);

  const fullName =
    [me?.firstName, me?.lastName].filter(Boolean).join(" ") || "—";

  const edu = me?.education || {};
  const status = edu?.status === "not" ? "Not a Student" : (edu?.status ? edu.status[0]?.toUpperCase() + edu.status.slice(1) : "—");
  const year = edu?.year ? edu.year[0]?.toUpperCase() + edu.year.slice(1) : "";
  const major = edu?.major || "—";
  const minor = edu?.minor || "—";
  const university = edu?.university || "—";
  const interests =
    Array.isArray(me?.preferences?.confidentAreas) && me.preferences.confidentAreas.length
      ? me.preferences.confidentAreas.join(", ")
      : "—";

  const reviewsCount = myReviews.length;
  const essaysCount = myEssays.length;

  // credits received lifetime (fallback to current balance if not provided in items)
  const creditsReceived = myReviews.reduce(
    (sum, r) => sum + Number(r?.creditsAwarded ?? 0),
    0
  );

  const nice = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

  // build document history (latest 8 combined)
  const history = [
    ...myReviews.map((r) => ({
      kind: "review",
      topic: r?.topic || r?.category || "General",
      title: r?.title || r?.essayTitle || "—",
      credits: Number(r?.creditsAwarded ?? 0),
      date: r?.createdAt ? new Date(r.createdAt) : null,
    })),
    ...myEssays.map((e) => ({
      kind: "upload",
      topic: e?.topic || e?.category || "General",
      title: e?.title || "—",
      credits: -Math.abs(Number(e?.creditsSpent ?? e?.creditsCost ?? 0)),
      date: e?.createdAt ? new Date(e.createdAt) : null,
    })),
  ]
    .sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0))
    .slice(0, 8);

  return (
    <DashboardLayout activeMenu="Profile">
      <div className="my-5 mx-auto max-w-[1100px]">
        {/* Header section */}
        <div className="bg-[#efe3da] rounded-xl border border-[#cdb6a9] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Avatar + note */}
            <div className="flex items-start gap-5">

              {/* The picker with initials default + overlay upload button */}
              <div >
                <ProfilePhotoSelector
                  image={profileFile}
                  setImage={setProfileFile}
                  firstName={me?.firstName}
                  lastName={me?.lastName}
                  variant="initials" // keeps Signup unchanged
                />
                

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={!profileFile || savingAvatar}
                    className="px-3 py-1.5 rounded-md border border-[#874f3e] text-[#874f3e] hover:bg-[#f2e6de] disabled:opacity-60"
                  >
                    {savingAvatar ? "Saving…" : "Save Photo"}
                  </button>
                  {profileFile && (
                    <button
                      type="button"
                      onClick={() => setProfileFile(null)}
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {avatarError && (
                  <p className="text-red-500 text-xs mt-2" role="alert">
                    {avatarError}
                  </p>
                )}
                {avatarSuccess && (
                  <p className="text-green-600 text-xs mt-2" role="status">
                    {avatarSuccess}
                  </p>
                )}
              </div>
              <p>Upload a clear headshot (PNG or JPG).</p>
            </div>

            {/* Middle — name & details */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-semibold text-[#5a3a2f]">
                {fullName}
              </h2>

              <div className="mt-3">
                <h4 className="font-semibold text-[#5a3a2f] inline-block bg-[#e5d3c8] px-2 py-0.5 rounded">
                  Personal Information
                </h4>
                <div className="mt-2 text-sm text-[#5a3a2f]">
                  <div>
                    <span className="font-medium">Email: </span>
                    {me?.email || "—"}
                  </div>

                {/* Should implement a change password option later */}

                  {/* { <button
                    type="button"
                    className="underline text-[#874f3e] mt-1"
                    onClick={() => /}}
                  >
                    Change your password here
                  </button> } */}
                </div>
              </div>

              <div className={`${line} mt-4 pt-4`}>
                <h4 className="font-semibold text-[#5a3a2f] inline-block bg-[#e5d3c8] px-2 py-0.5 rounded">
                  Academic Summary
                </h4>
                <div className="mt-2 text-sm text-[#5a3a2f] space-y-1">
                  <div><span className="font-medium">College:</span> {university}</div>
                  <div>
                    <span className="font-medium">Year:</span>{" "}
                    {status === "Not a Student" ? status : `${status} ${year || ""}`}
                  </div>
                  <div><span className="font-medium">Major(s):</span> {major}</div>
                  {edu?.specialization && (
                    <div><span className="font-medium">Specialization (if needed):</span> {edu.specialization}</div>
                  )}
                  <div><span className="font-medium">Minor(s):</span> {minor}</div>
                  <div><span className="font-medium">Interests:</span> {interests}</div>
                </div>
              </div>
            </div>

            {/* Right — Stats */}
            <div className="lg:col-span-1">
  <div className="bg-white rounded-lg border border-[#cdb6a9] p-4 h-full">
    <h4 className="font-semibold text-[#5a3a2f]">Your Impact</h4>

    {/* 3 cards: equal height, centered */}
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      <div className="rounded-lg bg-[#f5ece6] p-3 text-center min-h-[92px] flex flex-col items-center justify-center">
        <div className="text-xs font-semibold text-[#5a3a2f]">Essays Critiqued</div>
        <div className="text-2xl font-bold text-[#5a3a2f] mt-1">
          {nice(reviewsCount)}
        </div>
      </div>

      <div className="rounded-lg bg-[#f5ece6] p-3 text-center min-h-[92px] flex flex-col items-center justify-center">
        <div className="text-xs font-semibold text-[#5a3a2f]">Essays Uploaded</div>
        <div className="text-2xl font-bold text-[#5a3a2f] mt-1">
          {nice(essaysCount)}
        </div>
      </div>

      <div className="rounded-lg bg-[#f5ece6] p-3 text-center min-h-[92px] flex flex-col items-center justify-center">
        <div className="text-xs font-semibold text-[#5a3a2f]">Credits Received</div>
        <div className="text-2xl font-bold text-[#5a3a2f] mt-1">
          {nice(creditsReceived)}
        </div>
      </div>
    </div>

    <div className={`${line} mt-4 pt-4`}>
      <p className="text-sm text-[#6f5145]">
        Keep giving clear, constructive suggestions to grow your impact and rating.
      </p>
    </div>
  </div>
</div>


          </div>
        </div>
{/* Stars + History row (side-by-side) */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  {/* Left: Your Star Ratings */}
  <div className="bg-white rounded-xl border border-[#cdb6a9] p-5">
    <div className="text-sm font-semibold text-[#5a3a2f]">Your Star Ratings</div>
    <div className="flex justify-center mt-2">
      <StarRow value={ratingAvg} size={20} />
    </div>
    <div className="text-sm text-[#6f5145] mt-1">
      {ratingAvg.toFixed(1)} Stars{" "}
      <span className="opacity-70">({nice(ratingCount)} ratings)</span>
    </div>

    <div className="text-xs text-[#6f5145] mt-2">
      {ratingAvg >= 3.5
        ? "🎉 Congrats! Keep up the great work helping others improve."
        : "Congrats on getting started—add more detailed, helpful suggestions to climb!"}
    </div>
  </div>

  {/* Right: Document History */}
  <div className="bg-white rounded-xl border border-[#cdb6a9] p-5">
    <h4 className="font-semibold text-[#5a3a2f]">Document History</h4>

    {/* make this panel scroll if it gets long */}
    <div className="mt-3 grid grid-cols-1 gap-3 max-h-[360px] overflow-y-auto pr-1">
      {(history.length ? history : []).map((h, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-[#f5ece6] rounded-full px-4 py-2 text-sm text-[#5a3a2f]"
        >
          <span className="truncate mr-3">
            <span className="font-medium">
              {h.topic?.slice(0, 4).toUpperCase()}
            </span>
            : {h.title?.length > 36 ? `${h.title.slice(0, 36)}…` : h.title}
            {h.kind === "upload" ? " — uploaded" : " — credits received"}
          </span>
          <span className="shrink-0">
            {h.credits > 0 ? `(+${h.credits})` : `(${h.credits})`}
          </span>
        </div>
      ))}

      {!loading && history.length === 0 && (
        <>
          <div className="flex items-center justify-between bg-[#f5ece6] rounded-full px-4 py-2 text-sm text-[#5a3a2f]">
            <span>Hum: example review — credits received</span>
            <span>(+2)</span>
          </div>
          <div className="flex items-center justify-between bg-[#f5ece6] rounded-full px-4 py-2 text-sm text-[#5a3a2f]">
            <span>STEM: example upload — uploaded</span>
            <span>(-9)</span>
          </div>
        </>
      )}
    </div>
  </div>
</div>
      </div>
    </DashboardLayout>
  );
}