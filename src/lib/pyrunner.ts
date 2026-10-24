import type { TestCase } from "./problems";

export type TestOutcome = { ok: boolean; got?: string; error?: string; ms: number };
export type RunResult = { error: string | null; tests: TestOutcome[]; stdout: string };

const TIME_LIMIT_MS = 6000;

let worker: Worker | null = null;
let readyPromise: Promise<void> | null = null;
let seq = 0;
const pending = new Map<number, (r: RunResult) => void>();

function boot() {
  if (worker && readyPromise) return readyPromise;
  worker = new Worker("/pyodide-worker.js");
  readyPromise = new Promise<void>((resolve, reject) => {
    worker!.onmessage = (e: MessageEvent) => {
      if (e.data?.type === "ready") return resolve();
      const done = pending.get(e.data.id);
      if (done) {
        pending.delete(e.data.id);
        done(e.data.result);
      }
    };
    worker!.onerror = (e) => reject(new Error(e.message || "Python failed to load"));
  });
  return readyPromise;
}

/** Start downloading Python in the background so the first Run is fast. */
export const preloadPython = () => boot().catch(() => {});

export async function runPython(code: string, fn: string, tests: TestCase[]): Promise<RunResult> {
  await boot();
  const id = ++seq;
  return new Promise<RunResult>((resolve) => {
    const timer = setTimeout(() => {
      // Infinite loop or far too slow: kill the worker and start fresh next time.
      pending.delete(id);
      worker?.terminate();
      worker = null;
      readyPromise = null;
      resolve({ error: `Time limit exceeded (${TIME_LIMIT_MS / 1000}s). Check for an infinite loop.`, tests: [], stdout: "" });
    }, TIME_LIMIT_MS);
    pending.set(id, (r) => {
      clearTimeout(timer);
      resolve(r);
    });
    worker!.postMessage({ id, code, fn, tests: tests.map(({ args, expected }) => ({ args, expected })) });
  });
}
