import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";

export default function EssayView() {
  const { id } = useParams();
  const [essay, setEssay] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get(API_PATHS.ESSAYS.BY_ID(id));
        setEssay(data?.essay || null);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load essay.");
      }
    })();
  }, [id]);

  return (
    <DashboardLayout activeMenu="My Essays">
      <div className="mx-auto max-w-[900px] p-6">
        {!essay ? (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {err || "Not found"}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#ead7cd] p-6">
            <h1 className="text-2xl font-semibold text-[#5a3a2f]">
              {essay.title || essay.topic || "Essay"}
            </h1>
            <div className="mt-1 text-sm text-[#6f5145]">
              {essay.wordCount?.toLocaleString?.()} words
            </div>
            <div className="mt-4 whitespace-pre-wrap text-[#3b2a24]">
              {essay.bodyText}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
