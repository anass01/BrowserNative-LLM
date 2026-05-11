/**
 * lib/webllm.ts
 * Thin wrapper around @mlc-ai/web-llm.
 */

export type EngineStatus = "idle" | "loading" | "ready" | "generating" | "error";

export interface ProgressUpdate {
  progress: number; // 0–1
  text: string;
  timeElapsed?: number;
}

export async function getModelList() {
  const { prebuiltAppConfig } = await import("@mlc-ai/web-llm");
  return prebuiltAppConfig.model_list;
}

export type WebLLMModel = Awaited<ReturnType<typeof getModelList>>[number];

/**
 * Singleton engine instance — lives outside React so it survives re-renders.
 */
let engine: import("@mlc-ai/web-llm").MLCEngineInterface | null = null;
let loadedModel: string | null = null;

export async function loadModel(
  modelId: string,
  onProgress: (update: ProgressUpdate) => void,
  signal?: AbortSignal
) {
  const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

  // Already loaded — skip
  if (engine && loadedModel === modelId) {
    onProgress({ progress: 1, text: "Model ready!" });
    return engine;
  }

  // Clean up previous engine
  if (engine) {
    try {
      await engine.unload();
    } catch {
      /* ignore */
    }
    engine = null;
    loadedModel = null;
  }

  const startTime = Date.now();

  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (report) => {
      const p = report.progress ?? 0;
      const elapsed = (Date.now() - startTime) / 1000;

      let text = report.text ?? "Loading…";
      
      // Pass the WebLLM native progress strings directly to UI, as they contain 
      // granular metrics (e.g., "Loading model from cache[25/58]: 830MB loaded")
      if (p === 1) text = "🎉 Your AI is ready!";
      
      onProgress({ progress: p, text, timeElapsed: elapsed });
    },
  });

  if (signal?.aborted) {
    try {
      await engine.unload();
    } catch {
      /* ignore */
    }
    engine = null;
    throw new DOMException("Model load cancelled", "AbortError");
  }

  loadedModel = modelId;
  return engine;
}

/**
 * streamChat — callback-based streaming to avoid async-generator teardown issues.
 *
 * THE KEY FIX:
 * The previous AsyncGenerator version broke out of the inner `for await` loop
 * early (on `done`), which abandoned the WebLLM stream without fully consuming
 * it. WebLLM's engine holds a lock until the stream is drained, causing all
 * subsequent calls to hang indefinitely.
 *
 * Solution:
 *  1. Never break early — let the for-await run to natural completion so
 *     WebLLM can clean up its internal state.
 *  2. On abort, call engine.interruptGenerate() which tells WebLLM to flush
 *     its queue and release the lock immediately.
 */
export async function streamChat(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  onChunk: (content: string, done: boolean) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!engine) throw new Error("Engine not loaded");

  // Interrupt any pending generation from a previous (possibly aborted) call
  try {
    await engine.interruptGenerate();
  } catch {
    /* ignore */
  }

  const completion = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  let hasAborted = false;

  try {
    for await (const chunk of completion) {
      if (signal?.aborted && !hasAborted) {
        hasAborted = true;
        // Tell WebLLM to stop generating immediately
        try {
          await engine?.interruptGenerate();
        } catch {
          /* ignore */
        }
        // We DON'T return here. We let the loop finish to drain the generator.
      }

      if (!hasAborted) {
        const content = chunk.choices[0]?.delta?.content ?? "";
        const done = chunk.choices[0]?.finish_reason != null;
        onChunk(content, done);
      }
    }
  } catch (err) {
    if (signal?.aborted || hasAborted) return;
    throw err;
  }
}

/**
 * Returns the system memory in GB, or null if unavailable.
 */
export function getDeviceMemory(): number | null {
  if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
    return (navigator as any).deviceMemory;
  }
  return null;
}

export function isEngineLoaded() {
  return engine !== null && loadedModel !== null;
}

export function getLoadedModel() {
  return loadedModel;
}

export async function unloadEngine() {
  if (engine) {
    try {
      await engine.unload();
    } catch {
      /* ignore */
    }
    engine = null;
    loadedModel = null;
  }
}
