"use client";

// Client-side app state, persisted to localStorage. This is the free, zero-backend stand-in for
// the Postgres tables in the plan (User, SkillRating, Vote, Submission, Post, Comment…).
// Swapping it for Supabase later only means replacing the actions below with API calls.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  allNodes,
  ME,
  seedComments,
  seedPosts,
  seedRoadmaps,
  type Comment,
  type Post,
  type Roadmap,
} from "./data";
import type { Skill } from "./problems";

export type LessonState = {
  solved: string[];
  skipped: string[];
  attempts: Record<string, number>;
  hinted: string[];
  currentPid?: string;
  history: { pid: string; firstTry: boolean; before: number; after: number; at: number }[];
};

export type RoadmapProgress = { startedAt: number; completed: string[]; lessons: Record<string, LessonState> };

export type State = {
  version: number;
  xp: number;
  xpLog: { at: number; amount: number }[];
  activeDays: string[];
  hearts: number;
  heartsDay: string;
  ratings: Record<Skill, number>;
  ratingLog: { skill: Skill; delta: number; at: number }[];
  votes: Record<string, 1 | -1>;
  progress: Record<string, RoadmapProgress>;
  saved: string[];
  joined: string[];
  myRoadmaps: Roadmap[];
  myPosts: Post[];
  myComments: Comment[];
  drafts: Record<string, string>;
};

const VERSION = 1;
const KEY = "devpath:v1";
export const MAX_HEARTS = 5;
export const DAILY_GOAL = 50;

export const dayKey = (t: number | Date = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const emptyLesson = (): LessonState => ({ solved: [], skipped: [], attempts: {}, hinted: [], history: [] });

function makeSeed(now = Date.now()): State {
  const DAY = 86_400_000;
  return {
    version: VERSION,
    xp: 1240,
    xpLog: [
      { at: now - 2 * 60_000, amount: 15 },
      { at: now - 60_000, amount: 15 },
    ],
    activeDays: Array.from({ length: 12 }, (_, i) => dayKey(now - i * DAY)),
    hearts: 4,
    heartsDay: dayKey(now),
    ratings: { arrays: 1510, graphs: 1340, dp: 1120, strings: 1460 },
    ratingLog: [{ skill: "graphs", delta: 42, at: now - 2 * DAY }],
    votes: { "roadmap:graphs-zero-to-interview-ready": 1, "post:swe-offer-140-apps": 1 },
    progress: {
      "graphs-zero-to-interview-ready": {
        startedAt: now - 9 * DAY,
        completed: ["representations", "bfs", "dfs", "components"],
        lessons: {
          grid: {
            solved: ["grid-paint", "grid-perimeter"],
            skipped: [],
            attempts: {},
            hinted: [],
            currentPid: "grid-islands",
            history: [
              { pid: "grid-paint", firstTry: true, before: 1304, after: 1316, at: now - 2 * 60_000 },
              { pid: "grid-perimeter", firstTry: true, before: 1316, after: 1340, at: now - 60_000 },
            ],
          },
        },
      },
    },
    saved: [],
    joined: ["internships", "hackathons"],
    myRoadmaps: [],
    myPosts: [],
    myComments: [],
    drafts: {},
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.version === VERSION) return s;
    }
  } catch {
    /* storage unavailable or corrupt: fall back to seed */
  }
  return makeSeed();
}

/** Seed content is generated once per page load so relative times ("5h ago") stay realistic. */
const SEED = (() => {
  const now = Date.now();
  return { roadmaps: seedRoadmaps(now), posts: seedPosts(now), comments: seedComments(now) };
})();

const uid = () => Math.random().toString(36).slice(2, 10);

function useStoreValue() {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const s = load();
    // Hearts refill once per day.
    if (s.heartsDay !== dayKey()) {
      s.hearts = MAX_HEARTS;
      s.heartsDay = dayKey();
    }
    setState(s);
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode: state still works for this session */
    }
  }, [state]);

  const update = useCallback((fn: (s: State) => State) => setState((s) => (s ? fn(s) : s)), []);

  const actions = useMemo(
    () => ({
      vote(key: string, dir: 1 | -1) {
        update((s) => {
          const votes = { ...s.votes };
          if (votes[key] === dir) delete votes[key];
          else votes[key] = dir;
          return { ...s, votes };
        });
      },
      earnXp(amount: number) {
        update((s) => ({
          ...s,
          xp: s.xp + amount,
          xpLog: [...s.xpLog.slice(-500), { at: Date.now(), amount }],
          activeDays: s.activeDays.includes(dayKey()) ? s.activeDays : [...s.activeDays, dayKey()],
        }));
      },
      startRoadmap(slug: string) {
        update((s) =>
          s.progress[slug] ? s : { ...s, progress: { ...s.progress, [slug]: { startedAt: Date.now(), completed: [], lessons: {} } } },
        );
      },
      toggleNode(slug: string, nodeId: string) {
        update((s) => {
          const p = s.progress[slug] ?? { startedAt: Date.now(), completed: [], lessons: {} };
          const completed = p.completed.includes(nodeId) ? p.completed.filter((n) => n !== nodeId) : [...p.completed, nodeId];
          return { ...s, progress: { ...s.progress, [slug]: { ...p, completed } } };
        });
      },
      updateLesson(slug: string, nodeId: string, fn: (l: LessonState) => LessonState, completeNode = false) {
        update((s) => {
          const p = s.progress[slug] ?? { startedAt: Date.now(), completed: [], lessons: {} };
          const lesson = fn(p.lessons[nodeId] ?? emptyLesson());
          const completed = completeNode && !p.completed.includes(nodeId) ? [...p.completed, nodeId] : p.completed;
          return { ...s, progress: { ...s.progress, [slug]: { ...p, completed, lessons: { ...p.lessons, [nodeId]: lesson } } } };
        });
      },
      setRating(skill: Skill, value: number) {
        update((s) => ({
          ...s,
          ratings: { ...s.ratings, [skill]: value },
          ratingLog: [...s.ratingLog.slice(-500), { skill, delta: value - s.ratings[skill], at: Date.now() }],
        }));
      },
      loseHeart() {
        update((s) => ({ ...s, hearts: Math.max(0, s.hearts - 1) }));
      },
      toggleSaved(key: string) {
        update((s) => ({ ...s, saved: s.saved.includes(key) ? s.saved.filter((k) => k !== key) : [...s.saved, key] }));
      },
      toggleJoined(slug: string) {
        update((s) => ({ ...s, joined: s.joined.includes(slug) ? s.joined.filter((k) => k !== slug) : [...s.joined, slug] }));
      },
      saveDraft(pid: string, code: string) {
        update((s) => ({ ...s, drafts: { ...s.drafts, [pid]: code } }));
      },
      addRoadmap(rm: Roadmap) {
        update((s) => ({ ...s, myRoadmaps: [rm, ...s.myRoadmaps], votes: { ...s.votes, [`roadmap:${rm.slug}`]: 1 } }));
      },
      addPost(p: Omit<Post, "id" | "author" | "createdAt" | "up" | "down">) {
        const post: Post = { ...p, id: uid(), author: ME.handle, createdAt: Date.now(), up: 0, down: 0 };
        update((s) => ({ ...s, myPosts: [post, ...s.myPosts], votes: { ...s.votes, [`post:${post.id}`]: 1 } }));
        return post;
      },
      addComment(thread: string, parentId: string | null, body: string) {
        const c: Comment = { id: uid(), thread, parentId, author: ME.handle, createdAt: Date.now(), up: 0, down: 0, body };
        update((s) => ({ ...s, myComments: [...s.myComments, c], votes: { ...s.votes, [`comment:${c.id}`]: 1 } }));
      },
      reset() {
        setState(makeSeed());
      },
    }),
    [update],
  );

  return { state, actions };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<(Store & { state: State }) | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreValue();
  // State lives in the browser, so render nothing until it has loaded (avoids hydration mismatches).
  if (!store.state) return <div className="min-h-dvh bg-bg" />;
  return <Ctx.Provider value={store as Store & { state: State }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}

// ── Selectors ───────────────────────────────────────────────────────────

export const allRoadmaps = (s: State) => [...s.myRoadmaps, ...SEED.roadmaps];
export const findRoadmap = (s: State, slug: string) => allRoadmaps(s).find((r) => r.slug === slug);
export const allPosts = (s: State) => [...s.myPosts, ...SEED.posts];
export const allComments = (s: State) => [...SEED.comments, ...s.myComments];

/** Net score including the viewer's own vote. */
export const scoreOf = (s: State, key: string, up: number, down: number) => up - down + (s.votes[key] ?? 0);
export const votesOf = (s: State, key: string, up: number, down: number) => {
  const v = s.votes[key];
  return { up: up + (v === 1 ? 1 : 0), down: down + (v === -1 ? 1 : 0) };
};

export function streak(s: State) {
  const days = new Set(s.activeDays);
  const DAY = 86_400_000;
  let t = Date.now();
  if (!days.has(dayKey(t))) t -= DAY; // today not done yet: streak still counts through yesterday
  let n = 0;
  while (days.has(dayKey(t))) {
    n++;
    t -= DAY;
  }
  return n;
}

export const dailyXp = (s: State) => {
  const today = dayKey();
  return s.xpLog.filter((e) => dayKey(e.at) === today).reduce((a, e) => a + e.amount, 0);
};

/** Monday-first days of the current week, each flagged active/inactive. */
export function weekDays(s: State) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return ["M", "T", "W", "T", "F", "S", "S"].map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, active: s.activeDays.includes(dayKey(d)) };
  });
}

export const ratingDelta7d = (s: State, skill: Skill) =>
  s.ratingLog.filter((e) => e.skill === skill && Date.now() - e.at < 7 * 86_400_000).reduce((a, e) => a + e.delta, 0);

export type NodeStatus = "done" | "current" | "locked";

export function nodeStatuses(rm: Roadmap, prog?: RoadmapProgress) {
  const done = new Set(prog?.completed ?? []);
  const map = new Map<string, NodeStatus>();
  let currentSet = false;
  for (const n of allNodes(rm)) {
    if (done.has(n.id)) map.set(n.id, "done");
    else if (!currentSet) {
      map.set(n.id, "current");
      currentSet = true;
    } else map.set(n.id, "locked");
  }
  return map;
}

export function currentNode(rm: Roadmap, prog?: RoadmapProgress) {
  const st = nodeStatuses(rm, prog);
  const nodes = allNodes(rm);
  const node = nodes.find((n) => st.get(n.id) === "current");
  const unitIndex = node ? rm.units.findIndex((u) => u.nodes.includes(node)) : rm.units.length - 1;
  return { node, unitIndex, doneCount: nodes.filter((n) => st.get(n.id) === "done").length, total: nodes.length };
}
