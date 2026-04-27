/**
 * hooks/useWebLLM.ts
 * Manages engine lifecycle: model selection, loading, and status.
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { EngineStatus, ProgressUpdate, WebLLMModel } from "@/lib/webllm";

export interface UseWebLLMReturn {
  status: EngineStatus;
  models: WebLLMModel[];
  selectedModelId: string;
  progress: ProgressUpdate | null;
  error: string | null;
  loadModel: (modelId?: string) => Promise<void>;
  cancelLoad: () => void;
  selectModel: (modelId: string) => void;
}

// Small curated subset of good models to feature prominently
const FEATURED_MODELS = [
  "Llama-3.2-3B-Instruct-q4f32_1-MLC",
  "Llama-3.1-8B-Instruct-q4f32_1-MLC",
  "Phi-3.5-mini-instruct-q4f16_1-MLC",
  "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
  "gemma-2-2b-it-q4f16_1-MLC",
  "Qwen2.5-7B-Instruct-q4f16_1-MLC",
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
  "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC",
];

export function useWebLLM(): UseWebLLMReturn {
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [models, setModels] = useState<WebLLMModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(FEATURED_MODELS[0]);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load model list on mount
  useEffect(() => {
    import("@/lib/webllm").then(({ getModelList }) => {
      getModelList().then((list) => {
        // Sort: featured first, then alphabetical
        const featured = list.filter((m) => FEATURED_MODELS.includes(m.model_id));
        const others = list.filter((m) => !FEATURED_MODELS.includes(m.model_id));
        setModels([...featured, ...others]);
      });
    });
  }, []);

  const loadModel = useCallback(async (modelId?: string) => {
    const targetModel = modelId ?? selectedModelId;
    setStatus("loading");
    setError(null);
    setProgress({ progress: 0, text: "Preparing your AI…" });

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const { loadModel: doLoad } = await import("@/lib/webllm");
      await doLoad(
        targetModel,
        (update) => setProgress(update),
        abort.signal
      );
      setStatus("ready");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setStatus("idle");
        setProgress(null);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(handleLLMError(msg));
        setStatus("error");
      }
    } finally {
      abortRef.current = null;
    }
  }, [selectedModelId]);

  const cancelLoad = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const selectModel = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    setStatus("idle");
    setProgress(null);
    setError(null);
  }, []);

  return { status, models, selectedModelId, progress, error, loadModel, cancelLoad, selectModel };
}

function handleLLMError(raw: string): string {
  if (raw.includes("out of memory") || raw.includes("OOM")) {
    return "Not enough GPU/WASM memory. Try a smaller model.";
  }
  if (raw.includes("WebGPU") || raw.includes("webgpu")) {
    return "WebGPU is not supported in this browser. Try Chrome 113+ or Edge.";
  }
  if (raw.includes("SharedArrayBuffer")) {
    return "SharedArrayBuffer is required. Please use a browser with cross-origin isolation (Chrome/Edge).";
  }
  return `Failed to load model: ${raw.slice(0, 120)}`;
}
