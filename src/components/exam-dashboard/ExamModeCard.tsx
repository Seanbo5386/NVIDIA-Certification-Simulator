import { Clock, HelpCircle } from "lucide-react";
import type { ExamModeEntry } from "@/data/examModeRegistry";

const ACCENT_CLASSES: Record<
  string,
  { border: string; badge: string; button: string }
> = {
  green: {
    border: "border-l-green-500",
    badge: "bg-green-900/50 text-green-400",
    button: "bg-green-600 hover:bg-green-700",
  },
  cyan: {
    border: "border-l-cyan-500",
    badge: "bg-cyan-900/50 text-cyan-400",
    button: "bg-cyan-600 hover:bg-cyan-700",
  },
  orange: {
    border: "border-l-orange-500",
    badge: "bg-orange-900/50 text-orange-400",
    button: "bg-orange-600 hover:bg-orange-700",
  },
  purple: {
    border: "border-l-purple-500",
    badge: "bg-purple-900/50 text-purple-400",
    button: "bg-purple-600 hover:bg-purple-700",
  },
  blue: {
    border: "border-l-blue-500",
    badge: "bg-blue-900/50 text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700",
  },
};

interface ExamModeCardProps {
  mode: ExamModeEntry;
  onLaunch: () => void;
  lastScore?: number;
  lastDate?: string;
}

export function ExamModeCard({
  mode,
  onLaunch,
  lastScore,
  lastDate,
}: ExamModeCardProps) {
  const accent = ACCENT_CLASSES[mode.accentColor] || ACCENT_CLASSES.green;
  const Icon = mode.icon;

  return (
    <div
      data-testid={`exam-mode-card-${mode.id}`}
      className={`bg-gray-800 rounded-lg border border-gray-700 border-l-4 ${accent.border} p-5 flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-300" />
          <div>
            <h3 className="text-base font-bold text-white m-0">{mode.title}</h3>
            <p className="text-xs text-gray-400 m-0">{mode.subtitle}</p>
          </div>
        </div>
        {mode.badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accent.badge}`}
          >
            {mode.badge}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 mb-4 flex-1">{mode.description}</p>

      {/* Meta pills */}
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1 bg-gray-700/50 rounded px-2 py-1">
          <Clock className="w-3 h-3" />
          {mode.duration}
        </span>
        <span className="flex items-center gap-1 bg-gray-700/50 rounded px-2 py-1">
          <HelpCircle className="w-3 h-3" />
          {mode.questionCount}
        </span>
      </div>

      {/* Last score */}
      {lastScore !== undefined && (
        <div className="text-xs text-gray-400 mb-3">
          Last: {lastScore}%{lastDate && ` on ${lastDate}`}
        </div>
      )}

      {/* Launch button */}
      <button
        onClick={onLaunch}
        className={`w-full py-2 rounded-lg font-semibold text-white text-sm transition-colors ${accent.button}`}
      >
        Start {mode.title}
      </button>
    </div>
  );
}
