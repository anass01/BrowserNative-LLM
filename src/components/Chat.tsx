/**
 * components/Chat.tsx
 * Main chat viewport — messages list, auto-scroll, and input.
 */
"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { DownloadProgress } from "./DownloadProgress";
import { WelcomeScreen } from "./WelcomeScreen";
import type { Message } from "@/hooks/useChat";
import type { EngineStatus, ProgressUpdate } from "@/lib/webllm";

interface ChatProps {
  messages: Message[];
  isGenerating: boolean;
  engineStatus: EngineStatus;
  progress: ProgressUpdate | null;
  error: string | null;
  selectedModelId: string;
  onSend: (text: string) => void;
  onStop: () => void;
  onLoadModel: () => void;
  onCancelLoad: () => void;
  onRetryLoad: () => void;
}

function formatModelName(id: string) {
  return id.replace(/-q[0-9]f[0-9]+-MLC$/, "").replace(/-MLC$/, "").replace(/-/g, " ");
}

export function Chat({
  messages,
  isGenerating,
  engineStatus,
  progress,
  error,
  selectedModelId,
  onSend,
  onStop,
  onLoadModel,
  onCancelLoad,
  onRetryLoad,
}: ChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const isLoading = engineStatus === "loading";
  const isReady = engineStatus === "ready";
  const hasMessages = messages.length > 0;

  return (
    <main className="flex flex-col flex-1 overflow-hidden">
      {/* Status bar */}
      {isReady && (
        <div className="shrink-0 flex items-center justify-center gap-2 py-2 border-b border-[#1e1e22]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-[#52525b]">
            {formatModelName(selectedModelId)} · Private · Local
          </span>
        </div>
      )}

      {/* Scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4"
      >
        {/* Loading state */}
        {isLoading && (
          <DownloadProgress
            progress={progress}
            modelName={formatModelName(selectedModelId)}
            onCancel={onCancelLoad}
            onRetry={onRetryLoad}
            error={error}
          />
        )}

        {/* Error state (not during load) */}
        {engineStatus === "error" && !isLoading && (
          <DownloadProgress
            progress={null}
            modelName={formatModelName(selectedModelId)}
            onCancel={() => {}}
            onRetry={onRetryLoad}
            error={error}
          />
        )}

        {/* Welcome / empty state */}
        {!isLoading && engineStatus !== "error" && !hasMessages && (
          <WelcomeScreen
            onLoadModel={onLoadModel}
            isModelReady={isReady}
            isLoading={isLoading}
            modelName={selectedModelId}
          />
        )}

        {/* Message list */}
        {hasMessages && !isLoading && (
          <div className="flex flex-col gap-6 py-6 max-w-3xl mx-auto w-full">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isGenerating && i === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput
          onSend={onSend}
          onStop={onStop}
          disabled={isGenerating && false}
          isGenerating={isGenerating}
          isModelReady={isReady}
        />
      </div>
    </main>
  );
}
