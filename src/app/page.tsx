/**
 * app/page.tsx
 * Root page — client component that wires WebLLM + chat state together.
 *
 * We use "use client" since the whole app is browser-side.
 * The layout.tsx stays as a Server Component (for metadata/fonts).
 */
"use client";

import { useWebLLM } from "@/hooks/useWebLLM";
import { useChat } from "@/hooks/useChat";
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
  } = useChat(engineStatus);

  const handleNewChat = () => {
    clearChat();
  };

  const handleSelectModel = (id: string) => {
    selectModel(id);
    // Clear chat when switching models
    clearChat();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0f]">
      {/* Left Sidebar */}
      <Sidebar
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={handleSelectModel}
        onLoadModel={() => loadModel()}
        onNewChat={handleNewChat}
        onClearChat={clearChat}
        engineStatus={engineStatus}
        hasMessages={messages.length > 0}
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
      />

      {/* Right Ad Sidebar */}
      <AdSidebar />
    </div>
  );
}
