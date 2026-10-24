import type { Problem } from "./problems";

// Elo-style adaptive difficulty. Each learner has a rating per skill and each problem a fixed rating.
// K=28 gives the design's example: 1340 beating a 1450 problem -> 1358.
export const K = 28;

/** How far above the learner's rating the next problem should sit: a small stretch, not a wall. */
export const STRETCH = 40;

export function expected(user: number, problem: number) {
  return 1 / (1 + Math.pow(10, (problem - user) / 400));
}

export function updateRating(user: number, problem: number, score: 0 | 0.5 | 1) {
  return Math.round(user + K * (score - expected(user, problem)));
}

export function difficultyLabel(r: number) {
  if (r < 1400) return "Easy";
  if (r < 1475) return "Medium";
  if (r < 1550) return "Medium-Hard";
  return "Hard";
}

/** Pick the remaining problem whose rating is closest to the learner's rating plus a small stretch. */
export function pickNext(pool: Problem[], rating: number, done: Set<string>) {
  const target = rating + STRETCH;
  return (
    pool
      .filter((p) => !done.has(p.id))
      .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target) || a.rating - b.rating)[0] ??
    null
  );
}

/**
 * After a fast first-try solve, skip remaining problems well below the one just solved:
 * the learner has shown they don't need the warm-ups.
 */
export function skippable(pool: Problem[], solved: Problem, done: Set<string>) {
  return pool.filter((p) => !done.has(p.id) && p.id !== solved.id && p.rating < solved.rating - 100).map((p) => p.id);
}
