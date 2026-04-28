/**
 * hooks/useChatHistory.ts
 * Manages the list of persisted chat sessions — create, switch, delete.
 * The active session's messages are loaded into/out of useChat.
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  listSessions,
  getSession,
  deleteSession,
  createSession,
  type ChatSession,
} from "@/lib/chatHistory";

export interface UseChatHistoryReturn {
  sessions: ChatSession[];
  activeSessionId: string | null;
  switchSession: (id: string) => ChatSession | null;
  startNewSession: () => ChatSession;
  removeSession: (id: string) => void;
  refreshSessions: () => void;
}

export function useChatHistory(): UseChatHistoryReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const refreshSessions = useCallback(() => {
    setSessions(listSessions());
  }, []);

  // Load session list on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const switchSession = useCallback((id: string): ChatSession | null => {
    const session = getSession(id);
    if (!session) return null;
    setActiveSessionId(id);
    return session;
  }, []);

  const startNewSession = useCallback((): ChatSession => {
    const session = createSession();
    setActiveSessionId(session.id);
    // Don't persist yet — we write on first message
    return session;
  }, []);

  const removeSession = useCallback((id: string) => {
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    // If the active session is deleted, reset
    setActiveSessionId((prev) => (prev === id ? null : prev));
  }, []);

  return {
    sessions,
    activeSessionId,
    switchSession,
    startNewSession,
    removeSession,
    refreshSessions,
  };
}
