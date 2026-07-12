"use client";

import { BookOpen, Video, FileText, BookMarked, Wrench, ExternalLink } from "lucide-react";

const RESOURCE_ICONS = {
  course:  BookOpen,
  video:   Video,
  article: FileText,
  doc:     BookMarked,
  project: Wrench,
};

const DIFFICULTY_STYLES = {
  beginner:     "bg-green-50 text-green-700 border-green-200",
  intermediate: "bg-blue-50 text-blue-700 border-blue-200",
  advanced:     "bg-red-50 text-red-700 border-red-200",
};

const formatDuration = (hours) => {
  if (!hours || hours <= 0) return null;
  if (hours < 1) return `~ ${Math.round(hours * 60)}min`;
  return hours % 1 === 0 ? `~ ${hours}h` : `~ ${hours.toFixed(1)}h`;
};

const getSecureUrl = (url) => {
  if (!url) return "#";
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : "#";
};

export default function LearningResourceCard({ resource }) {
  const {
    title, url, provider, resource_type,
    is_free, duration_hours, difficulty_level, description,
  } = resource;

  const resourceKey      = resource_type ? resource_type.trim().toLowerCase() : "";
  const Icon             = RESOURCE_ICONS[resourceKey] || ExternalLink;
  const duration         = formatDuration(duration_hours);
  const secureUrl        = getSecureUrl(url);
  
  // تأمين قراءة الصعوبة بحروف صغيرة متطابقة مع الـ Object
  const diffKey          = difficulty_level ? difficulty_level.trim().toLowerCase() : "beginner";
  const difficultyStyle  = DIFFICULTY_STYLES[diffKey] || DIFFICULTY_STYLES.beginner;

  return (
    <a
      href={secureUrl}
      target="_blank"
      rel="external noopener noreferrer"
      aria-label={`Open ${title} on ${provider}`}
      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm bg-white"
    >
      {/* Icon */}
      <div className="p-2 rounded-md bg-gray-50 group-hover:bg-blue-100/50 transition-colors flex-shrink-0 mt-0.5">
        <Icon size={16} className="text-gray-500 group-hover:text-blue-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600 truncate">
          {title}
        </p>

        {description && (
          // تم التحديث إلى line-clamp-2 لإعطاء مساحة عرض ممتازة ومريحة للعين
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{description}</p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs font-medium text-gray-600">{provider}</span>

          <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">
            {resourceKey || 'link'}
          </span>

          {is_free ? (
            <span className="text-[10px] uppercase tracking-wider bg-green-50 text-green-700 px-2 py-0.5 rounded font-semibold border border-green-200">
              Free
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
              Paid
            </span>
          )}

          {difficulty_level && (
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold border ${difficultyStyle}`}>
              {diffKey}
            </span>
          )}

          {duration && (
            <span className="text-xs text-gray-400 font-medium">{duration}</span>
          )}
        </div>
      </div>

      <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-400 mt-1 flex-shrink-0 transition-colors" />
    </a>
  );
}