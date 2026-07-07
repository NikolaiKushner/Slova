import type { H3Event } from "h3";

// Minimal fixed-window rate limiter, kept in process memory. That matches how
// the app deploys (a single Node process, like the SQLite database) — if it
// ever runs as multiple instances, move this state to a shared store.

interface RateWindow {
  count: number;
  resetAt: number;
}

const windows = new Map<string, RateWindow>();

// Drop expired windows occasionally so the map can't grow without bound.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
let lastSweepAt = 0;

function sweep(now: number) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, win] of windows) {
    if (win.resetAt <= now) windows.delete(key);
  }
}

// Throws 429 once a client exceeds `limit` calls per `windowSeconds`. Keyed
// by client IP; x-forwarded-for is trusted because the Docker deployment sits
// behind a reverse proxy that sets it.
export function enforceRateLimit(
  event: H3Event,
  name: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  const key = `${name}:${ip}`;
  const now = Date.now();
  sweep(now);

  const win = windows.get(key);
  if (!win || win.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return;
  }

  win.count += 1;
  if (win.count > limit) {
    setHeader(event, "Retry-After", Math.ceil((win.resetAt - now) / 1000));
    throw createError({
      statusCode: 429,
      statusMessage: "Too many attempts — please wait a bit and try again",
    });
  }
}
