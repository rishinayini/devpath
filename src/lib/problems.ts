// Problem bank. Every problem is graded by calling one Python function against test cases,
// run in the learner's browser (Pyodide), so code execution costs nothing to host.

export type Skill = "arrays" | "graphs" | "dp" | "strings";

export const SKILLS: Record<Skill, string> = {
  arrays: "Arrays & hashing",
  graphs: "Graphs",
  dp: "Dynamic programming",
  strings: "Strings",
};

export type TestCase = { args: unknown[]; expected: unknown; hidden?: boolean };

export type Problem = {
  id: string;
  title: string;
  skill: Skill;
  rating: number;
  fn: string;
  params: string;
  statement: string;
  example: { input: string; output: string };
  constraints: string[];
  hint: string;
  tests: TestCase[];
};

const starter = (p: Pick<Problem, "fn" | "params">) => `def ${p.fn}(${p.params}):\n    # Write your solution here\n    pass\n`;
export const starterCode = starter;

export const PROBLEMS: Problem[] = [
  // ── Graphs · Representations ──────────────────────────────────────────
  {
    id: "g-busiest",
    title: "Busiest Station",
    skill: "graphs",
    rating: 1230,
    fn: "busiest",
    params: "n, edges",
    statement:
      "A transit map has n stations (0 to n − 1) joined by two-way tracks given as edges [a, b]. Return the station with the most tracks. If several tie, return the smallest index.",
    example: { input: "n = 4, edges = [[0,1],[0,2],[1,2],[2,3]]", output: "2" },
    constraints: ["1 ≤ n ≤ 10⁴", "No duplicate edges"],
    hint: "Count how many times each station appears in the edge list.",
    tests: [
      { args: [4, [[0, 1], [0, 2], [1, 2], [2, 3]]], expected: 2 },
      { args: [3, [[0, 1]]], expected: 0 },
      { args: [5, [[1, 2], [3, 2], [4, 1], [4, 3]]], expected: 1, hidden: true },
      { args: [1, []], expected: 0, hidden: true },
    ],
  },
  {
    id: "g-adjacency",
    title: "Build an Adjacency List",
    skill: "graphs",
    rating: 1270,
    fn: "build_adj",
    params: "n, edges",
    statement:
      "Given n nodes and a list of undirected edges, return the adjacency list: adj[i] holds every neighbour of node i, sorted ascending.",
    example: { input: "n = 3, edges = [[0,1],[1,2]]", output: "[[1],[0,2],[1]]" },
    constraints: ["1 ≤ n ≤ 10⁴", "No self-loops"],
    hint: "Start with n empty lists and append both directions for every edge.",
    tests: [
      { args: [3, [[0, 1], [1, 2]]], expected: [[1], [0, 2], [1]] },
      { args: [4, [[3, 0], [0, 2]]], expected: [[2, 3], [], [0], [0]] },
      { args: [2, []], expected: [[], []], hidden: true },
      { args: [3, [[2, 1], [0, 2], [1, 0]]], expected: [[1, 2], [0, 2], [0, 1]], hidden: true },
    ],
  },
  // ── Graphs · BFS ──────────────────────────────────────────────────────
  {
    id: "g-fewest-hops",
    title: "Fewest Hops",
    skill: "graphs",
    rating: 1290,
    fn: "fewest_hops",
    params: "n, edges, src, dst",
    statement:
      "Return the fewest edges needed to travel from src to dst in an undirected graph with n nodes, or −1 if dst can't be reached.",
    example: { input: "n = 5, edges = [[0,1],[1,2],[2,3],[0,4],[4,3]], src = 0, dst = 3", output: "2" },
    constraints: ["1 ≤ n ≤ 10⁴", "0 ≤ src, dst < n"],
    hint: "Breadth-first search visits nodes in order of distance, so the first time you reach dst is the answer.",
    tests: [
      { args: [5, [[0, 1], [1, 2], [2, 3], [0, 4], [4, 3]], 0, 3], expected: 2 },
      { args: [3, [[0, 1]], 0, 2], expected: -1 },
      { args: [1, [], 0, 0], expected: 0, hidden: true },
      { args: [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], 5, 0], expected: 5, hidden: true },
    ],
  },
  {
    id: "g-levels",
    title: "Ripple Levels",
    skill: "graphs",
    rating: 1330,
    fn: "levels",
    params: "n, edges, src",
    statement:
      "Group the nodes reachable from src by their distance from it. Return a list of levels, where level k holds every node exactly k edges away, sorted ascending.",
    example: { input: "n = 4, edges = [[0,1],[0,2],[1,3],[2,3]], src = 0", output: "[[0],[1,2],[3]]" },
    constraints: ["1 ≤ n ≤ 10⁴"],
    hint: "Process the BFS queue one whole level at a time: record its length before you start popping.",
    tests: [
      { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]], 0], expected: [[0], [1, 2], [3]] },
      { args: [3, [[1, 2]], 0], expected: [[0]] },
      { args: [5, [[0, 4], [4, 3], [3, 2], [0, 1]], 0], expected: [[0], [1, 4], [3], [2]], hidden: true },
    ],
  },
  // ── Graphs · DFS ──────────────────────────────────────────────────────
  {
    id: "g-rooms",
    title: "Keys and Rooms",
    skill: "graphs",
    rating: 1300,
    fn: "can_visit_all",
    params: "rooms",
    statement:
      "Room 0 is unlocked. rooms[i] lists the keys found inside room i; key k opens room k. Return True if you can eventually enter every room.",
    example: { input: "rooms = [[1],[2],[3],[]]", output: "True" },
    constraints: ["1 ≤ len(rooms) ≤ 1000"],
    hint: "Depth-first search from room 0, following keys as edges. Compare the visited count with the number of rooms.",
    tests: [
      { args: [[[1], [2], [3], []]], expected: true },
      { args: [[[1, 3], [3, 0, 1], [2], [0]]], expected: false },
      { args: [[[]]], expected: true, hidden: true },
      { args: [[[2], [], [1]]], expected: true, hidden: true },
      { args: [[[1], [], [0]]], expected: false, hidden: true },
    ],
  },
  {
    id: "g-has-path",
    title: "Does a Path Exist?",
    skill: "graphs",
    rating: 1320,
    fn: "has_path",
    params: "n, edges, a, b",
    statement: "Given an undirected graph with n nodes, return True if there is any path between nodes a and b.",
    example: { input: "n = 3, edges = [[0,1],[1,2]], a = 0, b = 2", output: "True" },
    constraints: ["1 ≤ n ≤ 10⁴"],
    hint: "Use an explicit stack instead of recursion to avoid hitting Python's recursion limit on long chains.",
    tests: [
      { args: [3, [[0, 1], [1, 2]], 0, 2], expected: true },
      { args: [4, [[0, 1], [2, 3]], 0, 3], expected: false },
      { args: [1, [], 0, 0], expected: true, hidden: true },
      { args: [5, [[0, 1], [1, 2], [3, 4]], 4, 3], expected: true, hidden: true },
    ],
  },
  // ── Graphs · Connected components ─────────────────────────────────────
  {
    id: "g-groups",
    title: "Count Friend Groups",
    skill: "graphs",
    rating: 1360,
    fn: "count_groups",
    params: "n, edges",
    statement:
      "n students are numbered 0 to n − 1, and each edge [a, b] means a and b are friends. Friendship groups are connected components. Return how many groups there are.",
    example: { input: "n = 5, edges = [[0,1],[1,2],[3,4]]", output: "2" },
    constraints: ["1 ≤ n ≤ 10⁴"],
    hint: "Start a new traversal from every unvisited node. Each fresh start is a new group.",
    tests: [
      { args: [5, [[0, 1], [1, 2], [3, 4]]], expected: 2 },
      { args: [3, []], expected: 3 },
      { args: [4, [[0, 1], [1, 2], [2, 3], [3, 0]]], expected: 1, hidden: true },
      { args: [6, [[0, 5], [2, 3]]], expected: 4, hidden: true },
    ],
  },
  {
    id: "g-largest-group",
    title: "Largest Group",
    skill: "graphs",
    rating: 1400,
    fn: "largest_group",
    params: "n, edges",
    statement: "Return the number of nodes in the largest connected component of an undirected graph with n nodes.",
    example: { input: "n = 5, edges = [[0,1],[1,2],[3,4]]", output: "3" },
    constraints: ["1 ≤ n ≤ 10⁴"],
    hint: "Same traversal as counting groups, but count the nodes you visit in each one.",
    tests: [
      { args: [5, [[0, 1], [1, 2], [3, 4]]], expected: 3 },
      { args: [2, []], expected: 1 },
      { args: [6, [[0, 1], [2, 3], [3, 4], [4, 5]]], expected: 4, hidden: true },
    ],
  },
  // ── Graphs · Grid problems ────────────────────────────────────────────
  {
    id: "grid-paint",
    title: "Paint Bucket",
    skill: "graphs",
    rating: 1310,
    fn: "paint",
    params: "image, r, c, color",
    statement:
      "Simulate a paint-bucket tool. Starting at cell (r, c), recolour that cell and every cell connected to it horizontally or vertically that shares its original colour. Return the image.",
    example: { input: "image = [[1,1,0],[1,0,0],[0,0,1]], r = 0, c = 0, color = 2", output: "[[2,2,0],[2,0,0],[0,0,1]]" },
    constraints: ["1 ≤ rows, cols ≤ 50"],
    hint: "If the new colour equals the old one, return immediately, or your search will loop forever.",
    tests: [
      { args: [[[1, 1, 0], [1, 0, 0], [0, 0, 1]], 0, 0, 2], expected: [[2, 2, 0], [2, 0, 0], [0, 0, 1]] },
      { args: [[[0, 0], [0, 0]], 1, 1, 0], expected: [[0, 0], [0, 0]] },
      { args: [[[5]], 0, 0, 7], expected: [[7]], hidden: true },
      { args: [[[1, 2, 1], [1, 1, 1], [2, 2, 1]], 1, 1, 3], expected: [[3, 2, 3], [3, 3, 3], [2, 2, 3]], hidden: true },
    ],
  },
  {
    id: "grid-perimeter",
    title: "Island Coastline",
    skill: "graphs",
    rating: 1380,
    fn: "coastline",
    params: "grid",
    statement:
      "grid contains exactly one island of 1s in a sea of 0s. Return the length of its coastline: the number of land-cell edges that touch water or the grid border.",
    example: { input: "grid = [[0,1,0],[1,1,1],[0,1,0]]", output: "12" },
    constraints: ["1 ≤ rows, cols ≤ 100"],
    hint: "Each land cell adds 4, minus 2 for every pair of land cells that share an edge.",
    tests: [
      { args: [[[0, 1, 0], [1, 1, 1], [0, 1, 0]]], expected: 12 },
      { args: [[[1]]], expected: 4 },
      { args: [[[1, 1], [1, 1]]], expected: 8, hidden: true },
      { args: [[[0, 1, 1, 0], [0, 1, 0, 0]]], expected: 8, hidden: true },
    ],
  },
  {
    id: "grid-islands",
    title: "Number of Islands",
    skill: "graphs",
    rating: 1450,
    fn: "numIslands",
    params: "grid",
    statement:
      'Given an m × n grid of "1"s (land) and "0"s (water), return the number of islands. An island is surrounded by water and formed by connecting adjacent land cells horizontally or vertically.',
    example: {
      input: 'grid = [["1","1","0"],\n        ["0","1","0"],\n        ["0","0","1"]]',
      output: "2",
    },
    constraints: ["1 ≤ m, n ≤ 300", 'grid[i][j] is "0" or "1"'],
    hint: "Scan every cell. When you find unvisited land, count an island and flood-fill all of it so it isn't counted again.",
    tests: [
      { args: [[["1", "1", "0"], ["0", "1", "0"], ["0", "0", "1"]]], expected: 2 },
      { args: [[["1", "1", "0", "0"], ["0", "0", "1", "0"], ["0", "0", "0", "1"]]], expected: 3 },
      { args: [[["0"]]], expected: 0, hidden: true },
      { args: [[["1", "1", "1"], ["0", "1", "0"], ["1", "1", "1"]]], expected: 1, hidden: true },
    ],
  },
  {
    id: "grid-area",
    title: "Biggest Island",
    skill: "graphs",
    rating: 1480,
    fn: "biggest_island",
    params: "grid",
    statement:
      "grid is made of 0s (water) and 1s (land). Return the area of the largest island, where land connects horizontally or vertically. Return 0 if there is no land.",
    example: { input: "grid = [[0,1,1],[0,1,0],[1,0,0]]", output: "3" },
    constraints: ["1 ≤ rows, cols ≤ 50"],
    hint: "Make your flood fill return the number of cells it visited.",
    tests: [
      { args: [[[0, 1, 1], [0, 1, 0], [1, 0, 0]]], expected: 3 },
      { args: [[[0, 0]]], expected: 0 },
      { args: [[[1, 0, 1], [1, 0, 1], [1, 1, 1]]], expected: 7, hidden: true },
      { args: [[[1, 0], [0, 1]]], expected: 1, hidden: true },
    ],
  },
  {
    id: "grid-rust",
    title: "Spreading Rust",
    skill: "graphs",
    rating: 1530,
    fn: "minutes_to_rust",
    params: "grid",
    statement:
      "Each cell is 0 (empty), 1 (clean metal) or 2 (rust). Every minute, rust spreads to clean metal directly above, below, left or right of it. Return the minutes until no clean metal remains, or −1 if some can never rust.",
    example: { input: "grid = [[2,1,1],[1,1,0],[0,1,1]]", output: "4" },
    constraints: ["1 ≤ rows, cols ≤ 10"],
    hint: "Multi-source BFS: put every rusty cell in the queue at minute 0 and spread level by level.",
    tests: [
      { args: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], expected: 4 },
      { args: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], expected: -1 },
      { args: [[[0, 2]]], expected: 0, hidden: true },
      { args: [[[2, 1, 1, 1]]], expected: 3, hidden: true },
    ],
  },
  // ── Graphs · Cycle detection ──────────────────────────────────────────
  {
    id: "g-loop",
    title: "Spot the Loop",
    skill: "graphs",
    rating: 1480,
    fn: "has_cycle",
    params: "n, edges",
    statement: "Return True if the undirected graph with n nodes and the given edges contains a cycle.",
    example: { input: "n = 3, edges = [[0,1],[1,2],[2,0]]", output: "True" },
    constraints: ["1 ≤ n ≤ 10⁴", "No duplicate edges or self-loops"],
    hint: "Union-find: if an edge joins two nodes that already share a root, you've found a cycle.",
    tests: [
      { args: [3, [[0, 1], [1, 2], [2, 0]]], expected: true },
      { args: [4, [[0, 1], [1, 2], [2, 3]]], expected: false },
      { args: [5, [[0, 1], [2, 3], [3, 4], [4, 2]]], expected: true, hidden: true },
      { args: [1, []], expected: false, hidden: true },
    ],
  },
  {
    id: "g-circular-deps",
    title: "Circular Dependencies",
    skill: "graphs",
    rating: 1540,
    fn: "has_circular_dep",
    params: "n, deps",
    statement:
      "There are n packages. Each pair [a, b] in deps means package a depends on package b. Return True if any chain of dependencies loops back on itself.",
    example: { input: "n = 3, deps = [[0,1],[1,2],[2,0]]", output: "True" },
    constraints: ["1 ≤ n ≤ 10⁴"],
    hint: "DFS with three colours: unvisited, in progress, done. Reaching an in-progress node means a cycle.",
    tests: [
      { args: [3, [[0, 1], [1, 2], [2, 0]]], expected: true },
      { args: [3, [[0, 1], [0, 2], [1, 2]]], expected: false },
      { args: [4, [[0, 1], [1, 2], [2, 3], [3, 1]]], expected: true, hidden: true },
      { args: [2, []], expected: false, hidden: true },
    ],
  },
  // ── Graphs · Topological sort ─────────────────────────────────────────
  {
    id: "topo-planner",
    title: "Course Planner",
    skill: "graphs",
    rating: 1550,
    fn: "can_finish",
    params: "n, prereqs",
    statement:
      "There are n courses. Each pair [a, b] in prereqs means you must take course b before course a. Return True if it's possible to finish every course.",
    example: { input: "n = 2, prereqs = [[1,0]]", output: "True" },
    constraints: ["1 ≤ n ≤ 2000"],
    hint: "Kahn's algorithm: repeatedly take courses with no remaining prerequisites. Check whether you took all n.",
    tests: [
      { args: [2, [[1, 0]]], expected: true },
      { args: [2, [[1, 0], [0, 1]]], expected: false },
      { args: [4, [[1, 0], [2, 1], [3, 2]]], expected: true, hidden: true },
      { args: [3, [[0, 1], [1, 2], [2, 0]]], expected: false, hidden: true },
    ],
  },
  {
    id: "topo-build-order",
    title: "Build Order",
    skill: "graphs",
    rating: 1600,
    fn: "build_order",
    params: "n, deps",
    statement:
      "Each pair [a, b] in deps means b must be built before a. Return a valid build order of all n targets. When several targets are ready at once, build the smallest index first. Return [] if no order exists.",
    example: { input: "n = 4, deps = [[1,0],[2,0],[3,1],[3,2]]", output: "[0,1,2,3]" },
    constraints: ["1 ≤ n ≤ 2000"],
    hint: "Kahn's algorithm with a min-heap instead of a queue gives the smallest-index-first order.",
    tests: [
      { args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], expected: [0, 1, 2, 3] },
      { args: [2, [[0, 1], [1, 0]]], expected: [] },
      { args: [3, []], expected: [0, 1, 2], hidden: true },
      { args: [4, [[0, 3], [1, 3]]], expected: [2, 3, 0, 1], hidden: true },
    ],
  },
  // ── Graphs · Shortest paths ───────────────────────────────────────────
  {
    id: "dj-delay",
    title: "Signal Delay",
    skill: "graphs",
    rating: 1620,
    fn: "signal_delay",
    params: "n, times, k",
    statement:
      "times[i] = [u, v, w] means a signal takes w ms to travel from node u to node v (one-way). A signal starts at node k. Return how long until all n nodes receive it, or −1 if some never do.",
    example: { input: "n = 4, times = [[1,0,1],[1,2,1],[2,3,1]], k = 1", output: "2" },
    constraints: ["1 ≤ n ≤ 100", "0 ≤ w ≤ 100"],
    hint: "Dijkstra from k with a heap, then take the largest shortest distance.",
    tests: [
      { args: [4, [[1, 0, 1], [1, 2, 1], [2, 3, 1]], 1], expected: 2 },
      { args: [2, [[0, 1, 1]], 1], expected: -1 },
      { args: [3, [[0, 1, 4], [0, 2, 1], [2, 1, 2]], 0], expected: 3, hidden: true },
      { args: [1, [], 0], expected: 0, hidden: true },
    ],
  },
  {
    id: "dj-free-roads",
    title: "Free Roads",
    skill: "graphs",
    rating: 1660,
    fn: "cheapest_trip",
    params: "n, roads",
    statement:
      "Two-way roads [a, b, cost] connect n towns, and every cost is 0 (free) or 1 (toll). Return the cheapest total cost from town 0 to town n − 1, or −1 if it can't be reached.",
    example: { input: "n = 3, roads = [[0,1,0],[1,2,0],[0,2,1]]", output: "0" },
    constraints: ["2 ≤ n ≤ 10⁵"],
    hint: "0-1 BFS: use a deque. Push free neighbours to the front and toll neighbours to the back.",
    tests: [
      { args: [3, [[0, 1, 0], [1, 2, 0], [0, 2, 1]]], expected: 0 },
      { args: [3, [[0, 1, 1]]], expected: -1 },
      { args: [4, [[0, 1, 1], [1, 3, 1], [0, 2, 0], [2, 3, 1]]], expected: 1, hidden: true },
      { args: [2, [[0, 1, 1]]], expected: 1, hidden: true },
    ],
  },
  // ── Dynamic programming ───────────────────────────────────────────────
  {
    id: "dp-stairs",
    title: "Staircase Hops",
    skill: "dp",
    rating: 1100,
    fn: "ways",
    params: "n",
    statement: "You climb a staircase of n steps, taking 1 or 2 steps at a time. Return how many distinct ways reach the top.",
    example: { input: "n = 3", output: "3" },
    constraints: ["1 ≤ n ≤ 45"],
    hint: "ways(n) = ways(n − 1) + ways(n − 2). You only need the last two values.",
    tests: [
      { args: [2], expected: 2 },
      { args: [3], expected: 3 },
      { args: [10], expected: 89, hidden: true },
      { args: [1], expected: 1, hidden: true },
    ],
  },
  {
    id: "dp-heist",
    title: "Quiet Heist",
    skill: "dp",
    rating: 1200,
    fn: "max_loot",
    params: "houses",
    statement: "houses[i] is the cash in house i along a street. You can't take from two adjacent houses. Return the most cash you can collect.",
    example: { input: "houses = [2,7,9,3,1]", output: "12" },
    constraints: ["1 ≤ len(houses) ≤ 100"],
    hint: "For each house, choose the better of skipping it or taking it plus the best total from two houses back.",
    tests: [
      { args: [[1, 2, 3, 1]], expected: 4 },
      { args: [[2, 7, 9, 3, 1]], expected: 12 },
      { args: [[5]], expected: 5, hidden: true },
      { args: [[2, 1, 1, 2]], expected: 4, hidden: true },
    ],
  },
  {
    id: "dp-grid-walks",
    title: "Grid Walks",
    skill: "dp",
    rating: 1250,
    fn: "grid_walks",
    params: "m, n",
    statement: "A robot starts at the top-left of an m × n grid and moves only right or down. Return how many paths reach the bottom-right corner.",
    example: { input: "m = 3, n = 7", output: "28" },
    constraints: ["1 ≤ m, n ≤ 100"],
    hint: "Each cell's count is the sum of the cell above and the cell to the left.",
    tests: [
      { args: [3, 7], expected: 28 },
      { args: [3, 2], expected: 3 },
      { args: [1, 1], expected: 1, hidden: true },
      { args: [10, 10], expected: 48620, hidden: true },
    ],
  },
  {
    id: "dp-common-thread",
    title: "Common Thread",
    skill: "dp",
    rating: 1400,
    fn: "common_thread",
    params: "a, b",
    statement: "Return the length of the longest subsequence that appears in both strings a and b, keeping relative order.",
    example: { input: 'a = "abcde", b = "ace"', output: "3" },
    constraints: ["1 ≤ len(a), len(b) ≤ 1000"],
    hint: "dp[i][j] = longest common subsequence of a[:i] and b[:j]. Matching characters extend the diagonal.",
    tests: [
      { args: ["abcde", "ace"], expected: 3 },
      { args: ["abc", "def"], expected: 0 },
      { args: ["abc", "abc"], expected: 3, hidden: true },
      { args: ["bsbininm", "jmjkbkjkv"], expected: 1, hidden: true },
    ],
  },
  {
    id: "dp-exact-change",
    title: "Exact Change",
    skill: "dp",
    rating: 1350,
    fn: "fewest_coins",
    params: "coins, amount",
    statement: "Return the fewest coins (unlimited supply of each denomination) that add up to amount, or −1 if it can't be made.",
    example: { input: "coins = [1,2,5], amount = 11", output: "3" },
    constraints: ["1 ≤ len(coins) ≤ 12", "0 ≤ amount ≤ 10⁴"],
    hint: "best[x] = 1 + min(best[x − c]) over every coin c ≤ x.",
    tests: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1 },
      { args: [[1], 0], expected: 0, hidden: true },
      { args: [[186, 419, 83, 408], 6249], expected: 20, hidden: true },
    ],
  },
  {
    id: "dp-even-split",
    title: "Even Split",
    skill: "dp",
    rating: 1450,
    fn: "can_split",
    params: "nums",
    statement: "Return True if nums can be divided into two groups with equal sums.",
    example: { input: "nums = [1,5,11,5]", output: "True" },
    constraints: ["1 ≤ len(nums) ≤ 200", "1 ≤ nums[i] ≤ 100"],
    hint: "It's 0/1 knapsack: can some subset reach exactly half the total? Track reachable sums in a set.",
    tests: [
      { args: [[1, 5, 11, 5]], expected: true },
      { args: [[1, 2, 3, 5]], expected: false },
      { args: [[2, 2]], expected: true, hidden: true },
      { args: [[1]], expected: false, hidden: true },
    ],
  },
];

export const PROBLEM_BY_ID = Object.fromEntries(PROBLEMS.map((p) => [p.id, p])) as Record<string, Problem>;
