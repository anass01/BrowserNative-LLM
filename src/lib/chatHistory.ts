/**
 * lib/chatHistory.ts
 * Persists chat sessions to localStorage. Each session has an id, title,
 * and array of messages. Context compression is a pure function that trims
 * old messages when the token budget is tight.
 */

export interface PersistedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;        // auto-derived from the first user message
  createdAt: number;
  updatedAt: number;
  messages: PersistedMessage[];
}

const STORAGE_KEY = "vynox_chat_sessions";
const MAX_SESSIONS = 50;

// ─── Persistence ────────────────────────────────────────────────────────────

function readAll(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatSession[]) : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: ChatSession[]): void {
  // Keep only the most recent N sessions to avoid quota issues
  const trimmed = sessions.slice(-MAX_SESSIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function listSessions(): ChatSession[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSession(id: string): ChatSession | null {
  return readAll().find((s) => s.id === id) ?? null;
}

export function saveSession(session: ChatSession): void {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    all[idx] = session;
  } else {
    all.push(session);
  }
  writeAll(all);
}

export function deleteSession(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function createSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

// ─── Title derivation ────────────────────────────────────────────────────────

/** Derives a short title from the first user message. */
export function deriveTitle(messages: PersistedMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New conversation";
  const text = first.content.trim().replace(/\s+/g, " ");
  return text.length > 48 ? text.slice(0, 45) + "…" : text;
}

// ─── Context compression ─────────────────────────────────────────────────────

/**
 * Compresses the conversation history to stay within a token budget.
 * Strategy:
 *   1. Always keep the last `keepTail` message pairs verbatim (most recent context).
 *   2. Summarise older messages into a single assistant "[Summary]" message that
 *      is prepended, so the LLM still has semantic context without the full token cost.
 *
 * This runs synchronously so it can be called from an idle callback without
 * needing an async LLM call. The summary is just the first 80 chars of each
 * message concatenated — good enough for small context windows.
 */
export const ROUGH_CHARS_PER_TOKEN = 4;
export const DEFAULT_TOKEN_BUDGET = 2048;

export function compressHistory(
  messages: PersistedMessage[],
  tokenBudget: number = DEFAULT_TOKEN_BUDGET
): PersistedMessage[] {
  if (messages.length === 0) return messages;

  const charBudget = tokenBudget * ROUGH_CHARS_PER_TOKEN;
  const totalChars = messages.reduce((n, m) => n + m.content.length, 0);

  // No compression needed
  if (totalChars <= charBudget) return messages;

  // Always keep the last 6 messages verbatim (3 exchange pairs)
  const KEEP_TAIL = 6;
  const tail = messages.slice(-KEEP_TAIL);
  const head = messages.slice(0, -KEEP_TAIL);

  if (head.length === 0) return tail;

  // Lightweight summary: snippet from each message
  const summaryLines = head.map((m) => {
    const snippet = m.content.slice(0, 80).replace(/\n/g, " ");
    return `[${m.role}]: ${snippet}${m.content.length > 80 ? "…" : ""}`;
  });

  const summaryMessage: PersistedMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `[Earlier context summary]\n${summaryLines.join("\n")}`,
    timestamp: head[0].timestamp,
  };

  return [summaryMessage, ...tail];
}
