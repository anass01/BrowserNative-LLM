/**
 * components/ModelSelector.tsx
 * Dropdown to pick from available WebLLM models.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu, Check } from "lucide-react";
import type { WebLLMModel } from "@/lib/webllm";

interface ModelSelectorProps {
  models: WebLLMModel[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
}

function formatSize(model: WebLLMModel): string {
  const vram = (model as { vram_required_MB?: number }).vram_required_MB;
  if (!vram) return "";
  if (vram >= 1024) return `~${(vram / 1024).toFixed(1)} GB`;
  return `~${Math.round(vram)} MB`;
}

function formatName(modelId: string): string {
  return modelId
    .replace(/-q[0-9]f[0-9]+-MLC$/, "")
    .replace(/-MLC$/, "")
    .replace(/-/g, " ");
}

export function ModelSelector({ models, selectedModelId, onSelect, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = models.find((m) => m.model_id === selectedModelId);

  return (
    <div ref={ref} className="relative w-full">
      <button
        id="model-selector-btn"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`
          w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm
          border border-[#27272a] bg-[#18181c] text-[#f0f0f2]
          transition-all duration-150
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#6366f1] hover:bg-[#1d1d22] cursor-pointer"}
          ${open ? "border-[#6366f1] ring-1 ring-[#6366f133]" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Cpu size={14} className="text-[#6366f1] shrink-0" />
        <span className="flex-1 text-left truncate font-medium">
          {selected ? formatName(selected.model_id) : "Select model"}
        </span>
        {selected && formatSize(selected) && (
          <span className="text-xs text-[#52525b] shrink-0">{formatSize(selected)}</span>
        )}
        <ChevronDown size={14} className={`text-[#52525b] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 z-50 max-h-72 overflow-y-auto
            rounded-xl border border-[#27272a] bg-[#111113] shadow-2xl shadow-black/50
            backdrop-blur-sm"
        >
          {models.map((model) => (
            <button
              key={model.model_id}
              role="option"
              aria-selected={model.model_id === selectedModelId}
              onClick={() => { onSelect(model.model_id); setOpen(false); }}
              className={`
                w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left
                transition-colors duration-100
                ${model.model_id === selectedModelId
                  ? "bg-[#1d1d22] text-[#f0f0f2]"
                  : "text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-[#f0f0f2]"
                }
              `}
            >
              <Check
                size={13}
                className={`shrink-0 transition-opacity ${model.model_id === selectedModelId ? "opacity-100 text-[#6366f1]" : "opacity-0"}`}
              />
              <span className="flex-1 truncate">{formatName(model.model_id)}</span>
              <span className="text-xs text-[#3f3f46] shrink-0">{formatSize(model)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
