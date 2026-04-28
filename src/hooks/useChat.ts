/**
 * hooks/useChat.ts
 * Manages conversation state, streaming, localStorage persistence,
 * and idle-time context compression.
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { EngineStatus } from "@/lib/webllm";
import {
  saveSession,
  deleteSession,
  deriveTitle,
  compressHistory,
  createSession,
  type ChatSession,
  type PersistedMessage,
} from "@/lib/chatHistory";

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
  loadSession: (session: ChatSession) => void;
  activeSessionId: string | null;
}

// Concise system prompt — saves tokens on small context windows
const SYSTEM_PROMPT =
  "You are a helpful assistant running entirely in the user's browser. Be concise and accurate. No data leaves their device.";

export function useChat(engineStatus: EngineStatus): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  const isGeneratingRef = useRef(isGenerating);
  const sessionIdRef = useRef<string | null>(activeSessionId);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);
  useEffect(() => { sessionIdRef.current = activeSessionId; }, [activeSessionId]);

  // ─── Persistence helpers ────────────────────────────────────────────────

  /** Persists current messages under the current (or a fresh) session. */
  const persistMessages = useCallback((msgs: Message[], sessionId: string) => {
    const persisted: PersistedMessage[] = msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    const existing = {
      id: sessionId,
      title: deriveTitle(persisted),
      createdAt: msgs[0]?.timestamp ?? Date.now(),
      updatedAt: Date.now(),
      messages: persisted,
    };
    saveSession(existing);
  }, []);

  // ─── Idle-time compression ──────────────────────────────────────────────

  /**
   * Schedule context compression to run 3 seconds after the user stops reading.
   * Fires only when the engine is idle (not generating) and there are messages.
   */
  const scheduleCompression = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      const currentMsgs = messagesRef.current;
      const sid = sessionIdRef.current;
      if (!sid || currentMsgs.length === 0 || isGeneratingRef.current) return;

      const persisted: PersistedMessage[] = currentMsgs.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      const compressed = compressHistory(persisted);

      // Only update if compression actually changed something
      if (compressed.length < persisted.length) {
        const newMsgs: Message[] = compressed.map((p) => ({
          id: p.id,
          role: p.role,
          content: p.content,
          timestamp: p.timestamp,
        }));
        setMessages(newMsgs);
        persistMessages(newMsgs, sid);
      }
    }, 3000);
  }, [persistMessages]);

  // ─── Load an existing session ───────────────────────────────────────────

  const loadSession = useCallback((session: ChatSession) => {
    const msgs: Message[] = session.messages.map((p) => ({
      id: p.id,
      role: p.role,
      content: p.content,
      timestamp: p.timestamp,
    }));
    setMessages(msgs);
    setActiveSessionId(session.id);
    setIsGenerating(false);
    abortRef.current?.abort();
  }, []);

  // ─── Send a message ─────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (isGeneratingRef.current || engineStatus !== "ready") return;

    // Create a session on the first message
    let sid = sessionIdRef.current;
    if (!sid) {
      const fresh = createSession();
      sid = fresh.id;
      setActiveSessionId(sid);
    }

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

    // Yield to React so the UI updates before heavy WebGPU work begins
    setTimeout(async () => {
      try {
        const { streamChat } = await import("@/lib/webllm");

        // Build history from latest ref to avoid stale closure issues
        const history = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          ...messagesRef.current.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content: userMessage.content },
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

        // Persist after the response completes, then schedule compression
        const finalMsgs = messagesRef.current;
        const currentSid = sessionIdRef.current;
        if (currentSid && finalMsgs.length > 0) {
          persistMessages(finalMsgs, currentSid);
          scheduleCompression();
        }
      }
    }, 100);
  }, [engineStatus, persistMessages, scheduleCompression]);

  // ─── Controls ───────────────────────────────────────────────────────────

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    if (isGeneratingRef.current) return;
    // Remove from localStorage so the sidebar list stays consistent
    if (sessionIdRef.current) {
      deleteSession(sessionIdRef.current);
    }
    setMessages([]);
    setActiveSessionId(null);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  // Cleanup idle timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return {
    messages,
    isGenerating,
    sendMessage,
    stopGeneration,
    clearChat,
    loadSession,
    activeSessionId,
  };
}
