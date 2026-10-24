# DevPath

Community-ranked roadmaps, an adaptive (Duolingo-style) coding practice engine, and developer communities.
Built from the DevPath Figma prototype.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use the avatar menu → **Reset demo data** to start over.

## What's in it (and what it costs: $0)

| Piece | How it works | Cost |
| --- | --- | --- |
| UI | Next.js 15 + Tailwind v4, tokens from the Figma file in `src/app/globals.css` | free |
| Code execution | Python runs **in the learner's browser** via Pyodide (WebAssembly) in a Web Worker with a 6 s time limit (`public/pyodide-worker.js`). No Judge0 server needed. | free |
| Editor | Monaco (the VS Code editor), loaded from a CDN | free |
| Adaptive engine | Elo rating per skill (`src/lib/elo.ts`). Nodes point at a pool of problems; the next problem is the closest to your rating + 40. A fast first-try solve skips easier warm-ups. | free |
| Ranking | Reddit "hot", Wilson lower bound for Top/Best, rising = votes/hour (`src/lib/ranking.ts`) | free |
| Data | `localStorage` (`src/lib/store.tsx`), seeded from `src/lib/data.ts` and `src/lib/problems.ts` | free |

## Deploy for free

Push to GitHub, then import the repo on Vercel (Hobby plan). No environment variables are needed.

## Next steps (still free)

- **Accounts + shared data:** replace the actions in `src/lib/store.tsx` with Supabase (free tier: Postgres + GitHub OAuth).
- **More problems:** add entries to `src/lib/problems.ts`. Each one is graded by calling one Python function against `tests`.
- **More languages:** JavaScript can run in a Web Worker the same way Python does.
