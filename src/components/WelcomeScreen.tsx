/**
 * components/WelcomeScreen.tsx
 * Shown before any messages. Communicates privacy + app purpose.
 */
"use client";

import { Shield, Cpu, Lock, Zap } from "lucide-react";

interface WelcomeScreenProps {
  onLoadModel: () => void;
  isModelReady: boolean;
  isLoading: boolean;
  modelName?: string;
}

export function WelcomeScreen({
  onLoadModel,
  isModelReady,
  isLoading,
  modelName,
}: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 px-4 py-12 fade-slide-up">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-md">
        <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20
          rounded-full px-4 py-1.5 text-xs text-[#818cf8] font-medium mb-2">
          <Shield size={11} />
          Private by design · No data leaves your device
        </div>

        <h1 className="text-3xl font-bold text-[#f0f0f2] leading-tight tracking-tight">
          Your private AI,{" "}
          <span className="bg-gradient-to-r from-[#6366f1] to-[#818cf8] bg-clip-text text-transparent">
            runs locally
          </span>
        </h1>

        <p className="text-[#71717a] text-sm leading-relaxed">
          Chat with powerful LLMs entirely in your browser.
          No accounts, no tracking, no data collection.
        </p>
      </div>

      {/* Feature pills */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {[
          { icon: Lock, label: "No login required" },
          { icon: Cpu, label: "Runs in your browser" },
          { icon: Shield, label: "Zero data collection" },
          { icon: Zap, label: "Works offline" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl
              bg-[#111113] border border-[#1e1e22] text-sm text-[#71717a]"
          >
            <Icon size={14} className="text-[#6366f1] shrink-0" />
            {label}
          </div>
        ))}
      </div>

      {/* CTA */}
      {!isModelReady && (
        <div className="text-center space-y-3">
          {isLoading ? (
            <p className="text-sm text-[#52525b]">Loading model…</p>
          ) : (
            <>
              <button
                id="welcome-load-btn"
                onClick={onLoadModel}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5]
                  hover:from-[#4f46e5] hover:to-[#3730a3]
                  text-white font-semibold text-sm
                  shadow-lg shadow-indigo-500/25
                  transition-all duration-150 hover:shadow-indigo-500/40 hover:scale-[1.02]"
              >
                Load AI model →
              </button>
              {modelName && (
                <p className="text-xs text-[#3f3f46]">
                  Will load: {modelName.replace(/-q[0-9]f[0-9]+-MLC$/, "").replace(/-MLC$/, "")}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {isModelReady && (
        <p className="text-sm text-green-400 font-medium animate-pulse">
          ✓ Your AI is ready — type a message below
        </p>
      )}
    </div>
  );
}
