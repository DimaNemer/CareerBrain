"use client";

import { useState, useEffect, useRef } from "react";
import LearningResourceCard from "@/components/LearningResourceCard";

function classifyError(status) {
  if (status === 404) return "No skill found with that name.";
  if (status === 401) return "Please log in to view resources.";
  if (status >= 500) return "Something went wrong. Please try again.";
  return "Could not load resources.";
}

export default function LearningResourceList({ skillId, skillName }) {
  const [resources, setResources]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const abortRef                    = useRef(null);

  // 🌟 لتتبع المهارة الحالية وإعادة تعيين الصفحة إلى 1 فور تغيرها
  const prevSkillRef = useRef({ skillId, skillName });

  useEffect(() => {
    if (!skillId && !skillName) return;

    // ⚡ حل الفخ: إذا تغيرت المهارة الحالية عن المهارة السابقة، صفر الصفحة فوراً إلى 1
    if (prevSkillRef.current.skillId !== skillId || prevSkillRef.current.skillName !== skillName) {
      setPage(1);
      prevSkillRef.current = { skillId, skillName };
      return; // اخرج ليعاد تشغيل الـ useEffect بالصفحة الأولى المحدثة
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    async function fetchResources() {
      setLoading(true);
      setError(null);
      try {
        const rawParam = skillId
          ? `skill_id=${skillId.trim()}`
          : `skill_name=${encodeURIComponent(skillName.trim())}`;

        const res  = await fetch(`/api/v1/learning-resources?${rawParam}&page=${page}`, { signal });
        const json = await res.json();

        if (!res.ok) throw { status: res.status, message: json.error?.message };

        setResources(json.data || []);
        setTotalPages(json.meta?.total_pages || 1);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(classifyError(err.status));
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
    return () => abortRef.current?.abort();
  }, [skillId, skillName, page]);

  if (loading) {
    return (
      <div className="space-y-3 mt-2">
        {/* تم رفع العدد إلى 3 مستطيلات ليعطي محاكاة بصرية واقعية للبطاقات الثلاث */}
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
          <div key={key} className="h-[76px] w-full bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-sm font-medium text-red-500 mt-2">{error}</p>;

  if (resources.length === 0) {
    return (
      // تحسين الـ Empty State ليعطي مظهراً احترافياً داخل لوحة التحكم
      <div className="border border-dashed border-gray-200 bg-gray-50/50 rounded-xl p-6 text-center mt-2">
        <p className="text-sm text-gray-500">
          No learning resources available for{" "}
          <span className="font-semibold text-gray-700">“{skillName || "this skill"}”</span> yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      {resources.map((resource) => (
        <LearningResourceCard key={resource.id} resource={resource} />
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-4">
          <button 
            onClick={() => setPage((p) => Math.max(1, p - 1))} 
            disabled={page === 1}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors select-none"
          >
            ← Prev
          </button>
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">
            {page} / {totalPages}
          </span>
          <button 
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors select-none"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}