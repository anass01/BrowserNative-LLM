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
      if (signal?.aborted) return;
      const p = report.progress ?? 0;
      const elapsed = (Date.now() - startTime) / 1000;
      let text = report.text ?? "Loading…";
      if (p < 0.05) text = "Preparing your AI…";
      else if (p < 0.5) text = "Downloading model… (this happens once)";
      else if (p < 0.9) text = "Loading weights into memory…";
      else if (p < 1) text = "Almost ready!";
      else text = "🎉 Your AI is ready!";
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
    /* ignore if nothing to interrupt */
  }

  const completion = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  try {
    for await (const chunk of completion) {
      if (signal?.aborted) {
        // Tell WebLLM to stop generating and release its lock
        try {
          await engine?.interruptGenerate();
        } catch {
          /* ignore */
        }
        return;
      }
      const content = chunk.choices[0]?.delta?.content ?? "";
      const done = chunk.choices[0]?.finish_reason != null;
      // Always call onChunk — including the final done=true chunk
      onChunk(content, done);
      // Do NOT break here. Let the for-await run to natural completion
      // so WebLLM fully closes its internal stream state.
    }
  } catch (err) {
    // If the signal was aborted, ignore the error (interruptGenerate may throw)
    if (signal?.aborted) return;
    throw err;
  }
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
