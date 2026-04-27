/**
 * components/ChatInput.tsx
 * Sticky bottom input bar with send/stop and newline support.
 */
"use client";

import { useRef, useState, useEffect } from "react";
import { Send, Square, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled: boolean;
  isGenerating: boolean;
  isModelReady: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  disabled,
  isGenerating,
  isModelReady,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || !isModelReady) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating) {
        onStop();
      } else {
        handleSend();
      }
    }
  };

  const placeholder = !isModelReady
    ? "Load a model to start chatting…"
    : isGenerating
    ? "AI is thinking… (Enter to stop)"
    : "Message your AI… (Enter to send, Shift+Enter for newline)";

  return (
    <div className="sticky bottom-0 z-10 px-4 pb-4 pt-2
      bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f] to-transparent">
      <div className={`
        flex items-end gap-2 rounded-2xl border px-4 py-3
        bg-[#18181c] transition-all duration-150
        ${!isModelReady ? "border-[#27272a] opacity-60" : "border-[#27272a] focus-within:border-[#6366f1] focus-within:ring-1 focus-within:ring-[#6366f133]"}
      `}>
        <textarea
          ref={textareaRef}
          id="chat-input"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || !isModelReady}
          placeholder={placeholder}
          aria-label="Chat message input"
          className="flex-1 resize-none bg-transparent text-sm text-[#f0f0f2]
            placeholder:text-[#52525b] outline-none leading-relaxed
            disabled:cursor-not-allowed max-h-[200px] overflow-y-auto"
          style={{ minHeight: "1.5rem" }}
        />

        <button
          id={isGenerating ? "stop-btn" : "send-btn"}
          onClick={isGenerating ? onStop : handleSend}
          disabled={isGenerating ? false : (!value.trim() || !isModelReady)}
          aria-label={isGenerating ? "Stop generation" : "Send message"}
          className={`
            shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
            transition-all duration-150 mb-0.5
            ${isGenerating
              ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
              : !value.trim() || !isModelReady
              ? "bg-[#27272a] text-[#3f3f46] cursor-not-allowed"
              : "bg-[#6366f1] hover:bg-[#4f46e5] text-white cursor-pointer shadow-lg shadow-indigo-500/20"
            }
          `}
        >
          {isGenerating ? (
            <Square size={14} />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-[#3f3f46] mt-2">
        AI can make mistakes · Your conversations never leave this device
      </p>
    </div>
  );
}
