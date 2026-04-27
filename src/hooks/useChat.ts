/**
 * hooks/useChat.ts
 * Manages conversation state and streaming from the llm engine.
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { EngineStatus } from "@/lib/webllm";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface UseChatReturn {
  messages: Message[];
  isGenerating: boolean;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  clearChat: () => void;
  engineStatus: EngineStatus;
  setEngineStatus: (s: EngineStatus) => void;
}

export function useChat(engineStatus: EngineStatus): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Use refs to avoid capturing stale state in closures during long generations
  const messagesRef = useRef(messages);
  const isGeneratingRef = useRef(isGenerating);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const sendMessage = useCallback(async (text: string) => {
    if (isGeneratingRef.current || engineStatus !== "ready") return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsGenerating(true);

    const abort = new AbortController();
    abortRef.current = abort;

    // Yield the main thread to React first so the UI instantly shows the chat bubble.
    // Otherwise, WebLLM's heavy WebGPU prefill mathematics will synchronously lock the thread
    // before the DOM has a chance to visually re-render on weaker mobile devices.
    setTimeout(async () => {
      try {
        const { streamChat } = await import("@/lib/webllm");

        const systemPrompt = "You are Vynox AI, an advanced AI running entirely locally in the user's browser. You operate completely offline, meaning the user's privacy is 100% guaranteed. You are exceptionally concise, helpful, and knowledgeable. When asked who you are, remind the user that you are running directly on their device hardware.";

        // Build conversation context using latest messages ref and prepend system prompt
        const history = [
          { role: "system" as const, content: systemPrompt },
          ...messagesRef.current.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })), 
          { role: "user" as const, content: userMessage.content }
        ];

        await streamChat(
          history,
          (content, _done) => {
            if (abort.signal.aborted) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: m.content + content }
                  : m
              )
            );
          },
          abort.signal
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: "_Error: Could not generate response. Please try again._" }
                : m
            )
          );
        }
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    }, 50);
  }, [engineStatus]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    if (!isGeneratingRef.current) setMessages([]);
  }, []);

  // These are passed in from parent — we expose setters as no-ops here
  // since the real engineStatus lives in useWebLLM
  const [_status, _setStatus] = useState<EngineStatus>(engineStatus);

  return {
    messages,
    isGenerating,
    sendMessage,
    stopGeneration,
    clearChat,
    engineStatus,
    setEngineStatus: _setStatus,
  };
}

