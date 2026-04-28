/**
 * app/page.tsx
 * Root page — wires WebLLM + chat state + persisted chat history together.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebLLM } from "@/hooks/useWebLLM";
import { useChat } from "@/hooks/useChat";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Sidebar } from "@/components/Sidebar";
import { Chat } from "@/components/Chat";
import { AdSidebar } from "@/components/AdSidebar";

export default function HomePage() {
  const {
    status: engineStatus,
    models,
    selectedModelId,
    progress,
    error,
    loadModel,
    cancelLoad,
    selectModel,
  } = useWebLLM();

  const {
    messages,
    isGenerating,
    sendMessage,
    stopGeneration,
    clearChat,
    loadSession,
    activeSessionId,
  } = useChat(engineStatus);

  const {
    sessions,
    switchSession,
    startNewSession,
    removeSession,
    refreshSessions,
  } = useChatHistory();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refresh the sessions panel whenever we finish a generation or clear
  useEffect(() => {
    if (!isGenerating) refreshSessions();
  }, [isGenerating, refreshSessions]);

  // ─── Handler: switch to a historical session ──────────────────────────
  const handleSelectSession = useCallback((id: string) => {
    const session = switchSession(id);
    if (session) loadSession(session);
    setMobileMenuOpen(false);
  }, [switchSession, loadSession]);

  // ─── Handler: clear current conversation ────────────────────────────
  // Single source of truth: clears messages, removes from storage, refreshes
  // sidebar, and closes the mobile drawer.
  const handleClearChat = useCallback(() => {
    clearChat();
    refreshSessions();
    setMobileMenuOpen(false);
  }, [clearChat, refreshSessions]);

  // ─── Handler: new chat ────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    handleClearChat();
    startNewSession();
  }, [handleClearChat, startNewSession]);

  // ─── Handler: delete session ──────────────────────────────────────────
  const handleDeleteSession = useCallback((id: string) => {
    removeSession(id);
    if (id === activeSessionId) {
      // Viewing the deleted session — clear the pane too
      clearChat();
      refreshSessions();
    }
  }, [removeSession, activeSessionId, clearChat, refreshSessions]);

  // ─── Handler: change model ────────────────────────────────────────────
  const handleSelectModel = useCallback((id: string) => {
    selectModel(id);
    handleClearChat();
  }, [selectModel, handleClearChat]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#0d0d0f]">
      {/* Left Sidebar */}
      <Sidebar
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={handleSelectModel}
        onLoadModel={() => loadModel()}
        onNewChat={handleNewChat}
        onClearChat={handleClearChat}
        engineStatus={engineStatus}
        hasMessages={messages.length > 0}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat Area */}
      <Chat
        messages={messages}
        isGenerating={isGenerating}
        engineStatus={engineStatus}
        progress={progress}
        error={error}
        selectedModelId={selectedModelId}
        onSend={sendMessage}
        onStop={stopGeneration}
        onLoadModel={() => loadModel()}
        onCancelLoad={cancelLoad}
        onRetryLoad={() => loadModel()}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Right Ad Sidebar */}
      <AdSidebar />
    </div>
  );
}
