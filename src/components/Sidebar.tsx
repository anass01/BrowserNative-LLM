/**
 * components/Sidebar.tsx
 * Left sidebar: new chat, model selection, chat history, privacy note.
 */
"use client";

import { useState } from "react";
import { Shield, Plus, MessageSquare, ChevronLeft, ChevronRight, Trash2, Cpu, X } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { InstallButton } from "./InstallButton";
import type { WebLLMModel } from "@/lib/webllm";
import type { EngineStatus } from "@/lib/webllm";

interface SidebarProps {
  models: WebLLMModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onLoadModel: () => void;
  onNewChat: () => void;
  onClearChat: () => void;
  engineStatus: EngineStatus;
  hasMessages: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  models,
  selectedModelId,
  onSelectModel,
  onLoadModel,
  onNewChat,
  onClearChat,
  engineStatus,
  hasMessages,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const isLoading = engineStatus === "loading";
  const isReady = engineStatus === "ready";

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:relative z-30 shrink-0 h-[100dvh] flex flex-col
          bg-[#111113] border-r border-[#1e1e22]
          transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "md:w-14 w-64" : "w-64"}
        `}
        aria-label="Sidebar"
      >
        {/* Mobile Close Toggle */}
        <button
          onClick={onCloseMobile}
          className="md:hidden absolute right-3 top-4 z-40 w-8 h-8 rounded-lg
            bg-[#1a1a1e] border border-[#27272a] text-[#71717a]
            flex items-center justify-center
            hover:bg-[#27272a] hover:text-[#f0f0f2]"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          id="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex absolute -right-3 top-8 z-40 w-6 h-6 rounded-full
            bg-[#27272a] border border-[#3f3f46] text-[#71717a]
            items-center justify-center
            hover:bg-[#3f3f46] hover:text-[#f0f0f2]
            transition-all duration-150 shadow-md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Logo / Brand */}
        <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-[#1e1e22] ${collapsed ? "justify-center px-2" : ""}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4f46e5]
            flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Shield size={14} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-[#f0f0f2] leading-tight">Vynox AI</p>
              <p className="text-[10px] text-[#52525b]">Runs in your browser</p>
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-2 p-3 ${collapsed ? "items-center" : ""}`}>
          {/* New Chat button */}
          <button
            id="new-chat-btn"
            onClick={onNewChat}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium
              bg-[#6366f1] hover:bg-[#4f46e5] text-white
              transition-colors duration-150 shadow-sm shadow-indigo-500/20
              ${collapsed ? "w-10 h-10 justify-center px-0" : "w-full"}`}
            title="New chat"
          >
            <Plus size={15} className="shrink-0" />
            {!collapsed && <span>New chat</span>}
          </button>

          {/* Clear chat */}
          {hasMessages && !collapsed && (
            <button
              id="clear-chat-btn"
              onClick={onClearChat}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm
                text-[#71717a] hover:text-[#f0f0f2] hover:bg-[#1a1a1e]
                transition-colors duration-150 w-full"
            >
              <Trash2 size={14} className="shrink-0" />
              <span>Clear conversation</span>
            </button>
          )}
        </div>

        {/* Model section */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Cpu size={11} className="text-[#52525b]" />
              <span className="text-[11px] font-medium text-[#52525b] uppercase tracking-wider">Model</span>
            </div>

            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onSelect={(id) => {
                onSelectModel(id);
              }}
              disabled={isLoading}
            />

            <button
              id="load-model-btn"
              onClick={onLoadModel}
              disabled={isLoading || isReady}
              className={`
                mt-2 w-full flex items-center justify-center gap-2
                px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150
                ${isReady
                  ? "bg-green-950/30 border border-green-800/40 text-green-400 cursor-default"
                  : isLoading
                  ? "bg-[#1a1a1e] border border-[#27272a] text-[#52525b] cursor-not-allowed"
                  : "bg-[#1a1a1e] border border-[#6366f1]/40 text-[#6366f1] hover:bg-[#6366f1]/10 hover:border-[#6366f1]"
                }
              `}
            >
              {isReady ? (
                <>✓ Model ready</>
              ) : isLoading ? (
                <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#52525b] border-t-[#6366f1] rounded-full" /> Loading…</>
              ) : (
                <>Load model</>
              )}
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        <InstallButton collapsed={collapsed} />

        {/* Privacy note */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-[#0d0d0f] border border-[#1e1e22]">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={13} className="text-[#6366f1] shrink-0" />
              <span className="text-xs font-semibold text-[#a1a1aa]">Private by design</span>
            </div>
            <ul className="space-y-1 text-[11px] text-[#52525b]">
              <li>✓ Runs entirely in your browser</li>
              <li>✓ No data leaves your device</li>
              <li>✓ No login required</li>
              <li>✓ No accounts, no tracking</li>
            </ul>
          </div>
        )}

        {/* Collapsed privacy icon */}
        {collapsed && (
          <div className="flex justify-center pb-4">
            <div title="Private by design — no data leaves your device"
              className="w-8 h-8 rounded-full bg-[#1a1a1e] border border-[#27272a]
                flex items-center justify-center cursor-default">
              <Shield size={14} className="text-[#6366f1]" />
            </div>
          </div>
        )}
      </div>
      </aside>
    </>
  );
}
