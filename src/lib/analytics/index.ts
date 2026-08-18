/**
 * Lightweight performance analytics (dev only).
 * Captures app-start and navigation timing; no-op in release builds.
 * @see docs/development/papex-app.md §3 (analytics).
 */
import { config } from '../config';

type Metric = { name: string; durationMs: number; at: number };

const buffer: Metric[] = [];

export const analytics = {
  mark(name: string, durationMs: number): void {
    if (!config.API_DEBUG) return;
    buffer.push({ name, durationMs, at: Date.now() });
  },
  startSpan(name: string): () => void {
    const t0 = Date.now();
    return () => analytics.mark(name, Date.now() - t0);
  },
  flush(): Metric[] {
    return buffer.splice(0, buffer.length);
  },
};
