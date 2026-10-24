// Ranking algorithms for feeds and comment threads.

/** Reddit-style "hot": log-scaled score plus a time bonus, so newer items need fewer votes to rank. */
export function hot(up: number, down: number, createdAt: number, decaySeconds: number) {
  const s = up - down;
  const order = Math.log10(Math.max(Math.abs(s), 1));
  const sign = Math.sign(s);
  return sign * order + createdAt / 1000 / decaySeconds;
}

/** Lower bound of the Wilson score interval: "best" ordering that doesn't over-reward tiny samples. */
export function wilson(up: number, down: number, z = 1.96) {
  const n = up + down;
  if (n === 0) return 0;
  const p = up / n;
  return (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
}

/** Score velocity: net votes per hour of age, damped so brand-new items don't spike. */
export function rising(up: number, down: number, createdAt: number, now = Date.now()) {
  const hours = Math.max((now - createdAt) / 3_600_000, 2);
  return (up - down) / Math.pow(hours, 1.5);
}

export const ROADMAP_DECAY = 10 * 24 * 3600; // roadmaps are long-lived: one order of magnitude per 10 days
export const POST_DECAY = 45_000; // Reddit's constant: one order of magnitude per 12.5 hours

export function fmtCount(n: number) {
  const abs = Math.abs(n);
  if (abs < 1000) return String(n);
  return `${(n / 1000).toFixed(1)}k`;
}

export function timeAgo(ts: number, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (d < 30) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
}

export const ago = (ts: number) => {
  const t = timeAgo(ts);
  return t === "just now" ? t : `${t} ago`;
};
