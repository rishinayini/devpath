import { PROBLEMS, PROBLEM_BY_ID, type Problem, type Skill } from "./problems";

// ── Roadmaps ────────────────────────────────────────────────────────────

export type RoadmapType = "problems" | "concepts" | "videos";

export type RoadmapNode = {
  id: string;
  title: string;
  /** Problem nodes point at a skill and a pool of problems, never one fixed problem. */
  skill?: Skill;
  problemIds?: string[];
  target?: number;
  /** Video nodes */
  url?: string;
  minutes?: number;
  /** Concept nodes */
  summary?: string;
};

export type Unit = { id: string; title: string; nodes: RoadmapNode[] };

export type Roadmap = {
  slug: string;
  type: RoadmapType;
  title: string;
  description: string;
  longDescription?: string;
  author: string;
  createdAt: number;
  updatedAt?: number;
  up: number;
  down: number;
  tags: string[];
  learners: number;
  forks: number;
  units: Unit[];
  forkedFrom?: string;
};

export const TYPE_META: Record<
  RoadmapType,
  { label: string; cardLabel: string; tone: Tone; cta: string; dot: string; crumb: string }
> = {
  problems: { label: "Coding Problems", cardLabel: "Coding Problems", tone: "green", cta: "Start", dot: "dot-green", crumb: "Coding Problems" },
  concepts: { label: "Concepts", cardLabel: "Concepts", tone: "blue", cta: "Start", dot: "dot-blue", crumb: "Concepts" },
  videos: { label: "Video Courses", cardLabel: "Video Course", tone: "red", cta: "Watch", dot: "dot-red", crumb: "Video Courses" },
};

export type Tone = "green" | "red" | "blue" | "purple" | "orange" | "yellow" | "neutral";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export function seedRoadmaps(now = Date.now()): Roadmap[] {
  return [
    {
      slug: "graphs-zero-to-interview-ready",
      type: "problems",
      title: "Graphs: Zero to Interview-Ready",
      description: "BFS, DFS, topological sort, shortest paths and union-find. Problems adapt to your level as you go.",
      longDescription:
        "A community-built path from graph representations to shortest paths. Each node pulls from a pool of problems, and the difficulty adjusts to how you’re doing, so no two learners get the exact same sequence.",
      author: "maya_codes",
      createdAt: now - 3 * DAY,
      updatedAt: now - 2 * DAY,
      up: 2559,
      down: 160,
      tags: ["graphs", "bfs", "dfs"],
      learners: 3100,
      forks: 412,
      units: [
        {
          id: "u1",
          title: "Graph basics",
          nodes: [
            { id: "representations", title: "Representations", skill: "graphs", problemIds: ["g-busiest", "g-adjacency"] },
            { id: "bfs", title: "Breadth-first search", skill: "graphs", problemIds: ["g-fewest-hops", "g-levels"] },
            { id: "dfs", title: "Depth-first search", skill: "graphs", problemIds: ["g-rooms", "g-has-path"] },
          ],
        },
        {
          id: "u2",
          title: "Traversal patterns",
          nodes: [
            { id: "components", title: "Connected components", skill: "graphs", problemIds: ["g-groups", "g-largest-group"] },
            {
              id: "grid",
              title: "Grid problems",
              skill: "graphs",
              problemIds: ["grid-paint", "grid-perimeter", "grid-islands", "grid-area", "grid-rust"],
            },
            { id: "cycles", title: "Cycle detection", skill: "graphs", problemIds: ["g-loop", "g-circular-deps"] },
          ],
        },
        {
          id: "u3",
          title: "Ordering & shortest paths",
          nodes: [
            { id: "topo", title: "Topological sort", skill: "graphs", problemIds: ["topo-planner", "topo-build-order"] },
            { id: "dijkstra", title: "Dijkstra & 0-1 BFS", skill: "graphs", problemIds: ["dj-delay", "dj-free-roads"] },
          ],
        },
      ],
    },
    {
      slug: "operating-systems-from-scratch",
      type: "videos",
      title: "Operating Systems from Scratch",
      description:
        "A curated path through the best free OS lectures on YouTube: processes, scheduling, memory, file systems.",
      author: "kernel_kate",
      createdAt: now - 7 * DAY,
      up: 1900,
      down: 100,
      tags: ["os", "systems", "youtube"],
      learners: 1900,
      forks: 88,
      units: [
        {
          id: "u1",
          title: "Foundations",
          nodes: [
            { id: "what-is-os", title: "What an OS does", url: yt("operating systems introduction lecture"), minutes: 75 },
            { id: "processes", title: "Processes & threads", url: yt("processes and threads operating systems lecture"), minutes: 80 },
          ],
        },
        {
          id: "u2",
          title: "Scheduling & synchronisation",
          nodes: [
            { id: "scheduling", title: "CPU scheduling", url: yt("cpu scheduling operating systems lecture"), minutes: 70 },
            { id: "locks", title: "Locks, semaphores & deadlock", url: yt("locks semaphores deadlock lecture"), minutes: 90 },
          ],
        },
        {
          id: "u3",
          title: "Memory & storage",
          nodes: [
            { id: "paging", title: "Virtual memory & paging", url: yt("virtual memory paging lecture"), minutes: 85 },
            { id: "filesystems", title: "File systems", url: yt("file systems operating systems lecture"), minutes: 80 },
          ],
        },
      ],
    },
    {
      slug: "frontend-developer-path",
      type: "concepts",
      title: "Frontend Developer Path",
      description:
        "HTML → CSS → JavaScript → React → testing → performance, with a checkpoint project after each stage.",
      author: "devon",
      createdAt: now - 14 * DAY,
      up: 1180,
      down: 80,
      tags: ["web", "react", "javascript"],
      learners: 5400,
      forks: 230,
      units: [
        {
          id: "u1",
          title: "The platform",
          nodes: [
            {
              id: "html",
              title: "Semantic HTML",
              url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
              summary: "Document structure, forms and accessibility basics. Checkpoint: a multi-page personal site with no CSS.",
            },
            {
              id: "css",
              title: "Modern CSS",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
              summary: "The cascade, flexbox, grid and responsive design. Checkpoint: restyle your site so it works from phone to desktop.",
            },
            {
              id: "js",
              title: "JavaScript fundamentals",
              url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
              summary: "Values, functions, the DOM, events and fetch. Checkpoint: a to-do app that saves to localStorage.",
            },
          ],
        },
        {
          id: "u2",
          title: "Building apps",
          nodes: [
            {
              id: "react",
              title: "React",
              url: "https://react.dev/learn",
              summary: "Components, props, state and effects. Checkpoint: rebuild the to-do app in React.",
            },
            {
              id: "testing",
              title: "Testing",
              url: "https://testing-library.com/docs/",
              summary: "Unit and component tests that check behaviour, not implementation. Checkpoint: 80% coverage on your app.",
            },
            {
              id: "performance",
              title: "Performance",
              url: "https://web.dev/learn/performance",
              summary: "Core Web Vitals, bundle size and rendering cost. Checkpoint: get your app to a green Lighthouse score.",
            },
          ],
        },
      ],
    },
    {
      slug: "dynamic-programming-patterns",
      type: "problems",
      title: "Dynamic Programming Patterns",
      description: "1D, 2D, knapsack, intervals and bitmask DP, grouped by pattern so the ideas actually stick.",
      author: "lin_codes",
      createdAt: now - 5 * DAY,
      up: 1010,
      down: 46,
      tags: ["dp", "recursion", "memoization"],
      learners: 2200,
      forks: 140,
      units: [
        {
          id: "u1",
          title: "1D DP",
          nodes: [
            { id: "counting", title: "Counting ways", skill: "dp", problemIds: ["dp-stairs"] },
            { id: "take-skip", title: "Take or skip", skill: "dp", problemIds: ["dp-heist"] },
          ],
        },
        {
          id: "u2",
          title: "2D DP",
          nodes: [
            { id: "grid-dp", title: "Grid DP", skill: "dp", problemIds: ["dp-grid-walks"] },
            { id: "two-strings", title: "Two strings", skill: "dp", problemIds: ["dp-common-thread"] },
          ],
        },
        {
          id: "u3",
          title: "Knapsack",
          nodes: [
            { id: "unbounded", title: "Unbounded knapsack", skill: "dp", problemIds: ["dp-exact-change"] },
            { id: "zero-one", title: "0/1 knapsack", skill: "dp", problemIds: ["dp-even-split"] },
          ],
        },
      ],
    },
  ];
}

export const allNodes = (rm: Roadmap) => rm.units.flatMap((u) => u.nodes);

/** The problems a node draws from: its explicit pool, or the closest-rated problems for its skill. */
export function poolFor(node: RoadmapNode): Problem[] {
  if (node.problemIds?.length) return node.problemIds.map((id) => PROBLEM_BY_ID[id]).filter(Boolean);
  if (!node.skill) return [];
  const target = node.target ?? 1300;
  return PROBLEMS.filter((p) => p.skill === node.skill)
    .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target))
    .slice(0, 5)
    .sort((a, b) => a.rating - b.rating);
}

export function nodeRating(node: RoadmapNode) {
  const pool = poolFor(node);
  if (!pool.length) return node.target ?? 0;
  return Math.round(pool.reduce((s, p) => s + p.rating, 0) / pool.length / 10) * 10;
}

export function roadmapStats(rm: Roadmap) {
  const nodes = allNodes(rm);
  const problems = new Set(nodes.flatMap((n) => poolFor(n).map((p) => p.id))).size;
  const minutes = nodes.reduce((s, n) => s + (n.minutes ?? 0), 0);
  return { nodes: nodes.length, units: rm.units.length, problems, hours: Math.round(minutes / 60) };
}

// ── Communities ─────────────────────────────────────────────────────────

export type Flair = { name: string; tone: Tone };

export type Community = {
  slug: string;
  tagline: string;
  about: string;
  members: number;
  online: number;
  dot: string;
  dot10: string;
  avatarBg: string;
  avatarText: string;
  flairs: Flair[];
  rules: string[];
  related: string[];
};

const GENERIC_FLAIRS: Flair[] = [
  { name: "Discussion", tone: "blue" },
  { name: "Question", tone: "yellow" },
  { name: "Resources", tone: "green" },
  { name: "Team up", tone: "purple" },
];
const GENERIC_RULES = ["Be kind — everyone starts somewhere", "Use flairs so people can filter", "No spam or self-promotion", "Search before posting"];

export const COMMUNITIES: Community[] = [
  {
    slug: "hackathons",
    tagline: "Find teams, share projects and swap hackathon war stories",
    about: "Team up for upcoming hackathons, show off what you built in 36 hours, and get advice on judging and demos.",
    members: 21700,
    online: 140,
    dot: "dot-yellow",
    dot10: "dot10-yellow",
    avatarBg: "bg-yellow",
    avatarText: "hk",
    flairs: GENERIC_FLAIRS,
    rules: GENERIC_RULES,
    related: ["internships", "careers", "research"],
  },
  {
    slug: "internships",
    tagline: "Applications, interviews, offers and everything in between",
    about:
      "Share applications, interview experiences and offers. Ask questions, get resume reviews and help each other land that first role.",
    members: 48200,
    online: 312,
    dot: "dot-green",
    dot10: "dot10-yellow",
    avatarBg: "bg-brand",
    avatarText: "in",
    flairs: [
      { name: "Offer", tone: "green" },
      { name: "Interview", tone: "blue" },
      { name: "Resume review", tone: "purple" },
      { name: "Question", tone: "yellow" },
    ],
    rules: ["Be kind — everyone starts somewhere", "Use flairs (Offer, Interview, Question)", "No selling referrals", "Search before posting"],
    related: ["hackathons", "careers", "company-culture"],
  },
  {
    slug: "research",
    tagline: "Undergrad research, papers and grad school",
    about: "How to find a lab, read papers efficiently, and decide whether grad school is for you.",
    members: 12400,
    online: 58,
    dot: "dot-purple",
    dot10: "dot10-yellow",
    avatarBg: "bg-purple",
    avatarText: "rs",
    flairs: GENERIC_FLAIRS,
    rules: GENERIC_RULES,
    related: ["internships", "careers", "certifications"],
  },
  {
    slug: "certifications",
    tagline: "Cloud, security and vendor certifications: are they worth it?",
    about: "Study plans, exam experiences and honest takes on which certs actually help.",
    members: 9800,
    online: 41,
    dot: "dot-blue",
    dot10: "dot10-yellow",
    avatarBg: "bg-blue",
    avatarText: "ce",
    flairs: GENERIC_FLAIRS,
    rules: GENERIC_RULES,
    related: ["careers", "internships", "company-culture"],
  },
  {
    slug: "company-culture",
    tagline: "What it's really like to work there",
    about: "On-call, team rituals, management styles and growth. Honest experiences from people inside tech companies.",
    members: 15300,
    online: 96,
    dot: "dot-orange",
    dot10: "dot10-orange",
    avatarBg: "bg-orange",
    avatarText: "cc",
    flairs: GENERIC_FLAIRS,
    rules: GENERIC_RULES,
    related: ["careers", "internships", "hackathons"],
  },
  {
    slug: "careers",
    tagline: "Job hunting, career switches and levelling up",
    about: "Resumes, negotiation, promotions and career changes into and within software.",
    members: 64000,
    online: 405,
    dot: "dot-red",
    dot10: "dot10-red",
    avatarBg: "bg-red",
    avatarText: "ca",
    flairs: GENERIC_FLAIRS,
    rules: GENERIC_RULES,
    related: ["internships", "company-culture", "certifications"],
  },
];

export const COMMUNITY_BY_SLUG = Object.fromEntries(COMMUNITIES.map((c) => [c.slug, c])) as Record<string, Community>;

/** 10px dot used in "Related communities": matches the design's colours per community. */
export const RELATED_DOT: Record<string, string> = {
  hackathons: "dot10-yellow",
  careers: "dot10-red",
  "company-culture": "dot10-orange",
};

export type Post = {
  id: string;
  community: string;
  flair: string;
  author: string;
  createdAt: number;
  up: number;
  down: number;
  title: string;
  body: string;
};

export type Comment = {
  id: string;
  /** `post:<id>` or `roadmap:<slug>` */
  thread: string;
  parentId: string | null;
  author: string;
  createdAt: number;
  up: number;
  down: number;
  body: string;
};

export function seedPosts(now = Date.now()): Post[] {
  return [
    {
      id: "swe-offer-140-apps",
      community: "internships",
      flair: "Offer",
      author: "alex_dev",
      createdAt: now - 5 * HOUR,
      up: 1360,
      down: 61,
      title: "Got a SWE intern offer after 140 applications — here’s what actually worked",
      body: "Sophomore, no prior internship. What moved the needle: (1) two hackathon projects I could talk about for 20 minutes, (2) referrals from people I met at those hackathons, and (3) doing ~150 problems grouped by pattern instead of randomly. Happy to answer questions below.",
    },
    {
      id: "resume-review-backend",
      community: "internships",
      flair: "Resume review",
      author: "mei_l",
      createdAt: now - 9 * HOUR,
      up: 230,
      down: 16,
      title: "Resume review: 2nd-year CS, targeting summer backend roles",
      body: "Two projects (a URL shortener in Go and a Discord bot), one TA position. Getting zero callbacks. Is it the formatting or the content?",
    },
    {
      id: "hear-back-time",
      community: "internships",
      flair: "Question",
      author: "jordan_t",
      createdAt: now - 26 * HOUR,
      up: 170,
      down: 14,
      title: "How long after the final round did you hear back?",
      body: "Finished my final round 8 days ago, recruiter said 'end of next week'. Is no news bad news?",
    },
    {
      id: "fintech-onsite",
      community: "internships",
      flair: "Interview",
      author: "nate_codes",
      createdAt: now - 2 * DAY,
      up: 430,
      down: 28,
      title: "Interview: onsite loop at a fintech — two DSA rounds and a 'system design lite'",
      body: "Round 1 was a graph problem (grid BFS), round 2 was intervals. The design round was 'design a rate limiter' but scoped way down for interns.",
    },
    {
      id: "ml-teammates",
      community: "hackathons",
      flair: "Team up",
      author: "kai_builds",
      createdAt: now - 3 * HOUR,
      up: 96,
      down: 4,
      title: "Looking for 2 teammates for a 36-hour hackathon (ML track)",
      body: "I do backend and a bit of PyTorch. Looking for a frontend person and someone who likes data cleaning. Remote-friendly.",
    },
    {
      id: "first-hackathon",
      community: "hackathons",
      flair: "Question",
      author: "sam_new",
      createdAt: now - 20 * HOUR,
      up: 58,
      down: 3,
      title: "First hackathon this weekend — what should I actually prepare?",
      body: "Should I come with an idea already? How much should I build before vs during?",
    },
    {
      id: "on-call-startup",
      community: "company-culture",
      flair: "Discussion",
      author: "ops_olivia",
      createdAt: now - 6 * HOUR,
      up: 360,
      down: 19,
      title: "What on-call actually looks like at a mid-size startup",
      body: "One week in six, about two pages a week, mostly flaky alerts. The real cost is the low-level background stress, not the pages themselves.",
    },
    {
      id: "cold-email-profs",
      community: "research",
      flair: "Resources",
      author: "ana_r",
      createdAt: now - 7 * HOUR,
      up: 140,
      down: 5,
      title: "Cold-emailing professors for undergrad research: the template that got replies",
      body: "Short, specific, and mention one of their recent papers in a sentence that shows you read past the abstract.",
    },
    {
      id: "cloud-certs-new-grads",
      community: "certifications",
      flair: "Question",
      author: "dev_dani",
      createdAt: now - 30 * HOUR,
      up: 88,
      down: 12,
      title: "Are cloud certs worth it for new grads?",
      body: "Debating between spending winter break on a cloud practitioner cert or building a project. Which do recruiters care about more?",
    },
    {
      id: "qa-to-swe",
      community: "careers",
      flair: "Discussion",
      author: "rafael_m",
      createdAt: now - 2 * DAY,
      up: 520,
      down: 22,
      title: "Switched from QA to SWE in 18 months — timeline and what helped",
      body: "Automated our test suite first, then volunteered for small backend tickets, then asked my manager for a transfer plan with concrete milestones.",
    },
  ];
}

export function seedComments(now = Date.now()): Comment[] {
  return [
    {
      id: "c1",
      thread: "post:swe-offer-140-apps",
      parentId: null,
      author: "priya_k",
      createdAt: now - 4 * HOUR,
      up: 148,
      down: 6,
      body: "The referral point is so underrated. 3 of my 4 interviews came from people I met at hackathons.",
    },
    {
      id: "c2",
      thread: "post:swe-offer-140-apps",
      parentId: "c1",
      author: "alex_dev",
      createdAt: now - 4 * HOUR + 20 * 60_000,
      up: 63,
      down: 2,
      body: "100%. c/hackathons is how I found my team in the first place.",
    },
    {
      id: "c3",
      thread: "post:swe-offer-140-apps",
      parentId: null,
      author: "samuel.r",
      createdAt: now - 3 * HOUR,
      up: 40,
      down: 3,
      body: "Did you prep with LeetCode-style problems or projects? Trying to decide what to focus on this winter.",
    },
    {
      id: "c4",
      thread: "roadmap:graphs-zero-to-interview-ready",
      parentId: null,
      author: "lin_codes",
      createdAt: now - 20 * HOUR,
      up: 31,
      down: 1,
      body: "Would love a union-find node after cycle detection!",
    },
    {
      id: "c5",
      thread: "roadmap:graphs-zero-to-interview-ready",
      parentId: null,
      author: "devon",
      createdAt: now - 6 * HOUR,
      up: 44,
      down: 2,
      body: "Unit 3 felt like a jump, but the warm-up problems helped a lot.",
    },
  ];
}

const AVATAR_COLORS: Record<string, string> = {
  priya_k: "bg-yellow",
  alex_dev: "bg-blue",
  "samuel.r": "bg-orange",
  rishi: "bg-purple",
};
const PALETTE = ["bg-yellow", "bg-blue", "bg-orange", "bg-purple", "bg-brand", "bg-red"];

export function avatarColor(handle: string) {
  if (AVATAR_COLORS[handle]) return AVATAR_COLORS[handle];
  let h = 0;
  for (const ch of handle) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export const ME = { handle: "rishi", initial: "R" };
