"use client";

import { useState, useEffect } from "react";
import LearningResourceCard from "@/components/LearningResourceCard";
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, Briefcase, Info } from "lucide-react";

// ── Skill row (collapsible) ───────────────────────────────────────────────────
function RoadmapSkillRow({ item, index }) {
  const [expanded, setExpanded] = useState(index === 0);

  const hasResources = item.learning_resources && item.learning_resources.length > 0;
  const hasProjects  = item.suggested_projects && item.suggested_projects.length > 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-200">

      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left focus:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 border border-blue-100">
            #{item.priority || index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{item.skill?.name || "Unknown Skill"}</p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {item.skill?.category || "General"}
              {item.required_level && ` · Required: ${item.required_level}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {hasResources && (
            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100">
              {item.learning_resources.length} resource{item.learning_resources.length !== 1 ? "s" : ""}
            </span>
          )}
          {hasProjects && (
            <span className="text-xs font-medium bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full border border-purple-100">
              {item.suggested_projects.length} project{item.suggested_projects.length !== 1 ? "s" : ""}
            </span>
          )}
          <div className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-5">

          {/* Why this skill — explainability */}
          {item.reason && (
            <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <span>{item.reason}</span>
            </div>
          )}

          {/* Learning Resources */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen size={14} className="text-blue-500" /> Learn it
            </h4>
            {hasResources ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.learning_resources.map((resource) => (
                  // resource is passed through untouched — LearningResourceCard
                  // expects duration_hours / difficulty_level as-is
                  <LearningResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic pl-5">No learning resources available for this skill yet.</p>
            )}
          </div>

          {/* Suggested CollabSpace Projects */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Briefcase size={14} className="text-purple-500" /> Build it — join a real project
            </h4>
            {hasProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.suggested_projects.map((project) => (
                  <div
                    key={project.project_id}
                    className="p-4 rounded-xl border border-purple-100 bg-white shadow-sm flex flex-col justify-between hover:border-purple-200 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-purple-900 truncate">
                        {project.project_title}
                      </p>
                      {project.project_description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {project.project_description}
                        </p>
                      )}
                      <div className="mt-3">
                        <span className="inline-block text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-md font-medium border border-purple-100">
                          Role needed: {project.role_needed}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-end">
                      {project.application_meta?.can_apply ? (
                        <a
                          href={`/collabspace/${project.project_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition"
                        >
                          View & request to join
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          This is your own project
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic pl-5">No projects found seeking this skill at the moment.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GapRoadmap({ opportunityId }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!opportunityId) return;

    const controller = new AbortController();

    async function fetchRoadmap() {
      setLoading(true);
      setError(null);
      try {
        const res  = await fetch(`/api/v1/opportunities/${opportunityId}/gap-roadmap`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to load roadmap.");
        setResult(json);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRoadmap();
    return () => controller.abort();
  }, [opportunityId]);

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        {["sk-1", "sk-2", "sk-3"].map((k) => (
          <div key={k} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const data    = result?.data;
  const roadmap = data?.roadmap || [];
  const isPerfectMatch = result?.match_status === "PERFECT_MATCH";

  if (isPerfectMatch || roadmap.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-green-200 bg-green-50/50 text-center max-w-xl mx-auto">
        <p className="text-3xl mb-2">🎉</p>
        <p className="font-bold text-green-800 text-lg">You are a strong match!</p>
        <p className="text-sm text-green-600 mt-1 leading-relaxed">
          {result?.message || "Your profile fulfills all required skills for this opportunity."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-lg">Your Gap Roadmap</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">
            {roadmap.length} skill{roadmap.length !== 1 ? "s" : ""} to close
          </span>
          {data.estimated_time_to_close && (
            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-blue-100">
              Est: {data.estimated_time_to_close}
            </span>
          )}
          {data.match_score != null && (
            <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              {Math.round(data.match_score * 100)}% match
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3" role="list">
        {roadmap.map((item, index) => (
          <div role="listitem" key={item.skill?.id || index}>
            <RoadmapSkillRow item={item} index={index} />
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2 italic">
        💡 Skills are ordered by priority — start from the top to maximize your match potential.
      </p>
    </div>
  );
}
