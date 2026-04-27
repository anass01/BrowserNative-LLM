/**
 * components/DownloadProgress.tsx
 * Shown while a model is being downloaded and initialized.
 */
"use client";

import { XCircle, RefreshCw, Shield } from "lucide-react";
import type { ProgressUpdate } from "@/lib/webllm";

interface DownloadProgressProps {
  progress: ProgressUpdate | null;
  modelName: string;
  onCancel: () => void;
  onRetry: () => void;
  error?: string | null;
}

export function DownloadProgress({
  progress,
  modelName,
  onCancel,
  onRetry,
  error,
}: DownloadProgressProps) {
  const pct = Math.round((progress?.progress ?? 0) * 100);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-6 text-center fade-slide-up">
        <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center">
          <XCircle size={24} className="text-red-400" />
        </div>
        <div>
          <p className="text-[#f0f0f2] font-semibold mb-1">Something went wrong</p>
          <p className="text-sm text-[#71717a] max-w-xs">{error}</p>
        </div>
        <button
          id="retry-load-btn"
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5]
            text-white text-sm font-medium transition-colors duration-150"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 px-6 text-center fade-slide-up">
      {/* Animated orb */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-[#6366f1]/30 animate-spin"
          style={{ animationDuration: "3s", borderTopColor: "#6366f1" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield size={20} className="text-[#6366f1]" />
        </div>
      </div>

      {/* Status text */}
      <div className="space-y-1">
        <p className="text-[#f0f0f2] font-semibold text-lg">
          {progress?.text ?? "Preparing your AI…"}
        </p>
        <p className="text-sm text-[#71717a]">{modelName}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm space-y-2">
        <div className="h-1.5 rounded-full bg-[#27272a] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#818cf8] progress-glow
              transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#52525b]">
          <span>{pct}%</span>
          {progress?.timeElapsed && (
            <span>{progress.timeElapsed.toFixed(0)}s elapsed</span>
          )}
        </div>
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-xs text-[#3f3f46] bg-[#18181c] border border-[#27272a]
        rounded-lg px-4 py-2.5 max-w-sm">
        <Shield size={12} className="text-[#6366f1] shrink-0" />
        <span>Downloaded once, cached locally. Never sent to any server.</span>
      </div>

      <button
        id="cancel-load-btn"
        onClick={onCancel}
        className="text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors underline underline-offset-2"
      >
        Cancel
      </button>
    </div>
  );
}
