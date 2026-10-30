# DevPath — Phase 1

Build coding roadmaps as a graph of topics (like neetcode.io/roadmap), fill each topic with
Codeforces problems by pasting their links, and sync a Codeforces handle to see what you've solved.

No build step and no dependencies: plain HTML, CSS and JavaScript modules.

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```bash
cd devpath
python3 -m http.server 5173     # or: npx serve .
```

Open http://localhost:5173.

## Deploy for free

- **GitHub Pages:** push the folder to a repo → Settings → Pages → deploy from the `main` branch root.
- **Vercel:** import the repo, framework preset "Other", no build command. On Vercel, `api/cf.js`
  also gives you a backup Codeforces proxy in case the browser can't call the API directly.

## How it works

| Feature | Where |
| --- | --- |
| Roadmap list, editor, topic panel, routing (`#/` and `#/r/<id>`) | `js/app.js` |
| Pan/zoom board, topic nodes, prerequisite curves, drag-to-link | `js/graph.js` |
| "Tidy layout" (ranks topics by prerequisite depth) | `js/layout.js` |
| Codeforces API: link parsing, problem names/ratings, a user's solves | `js/codeforces.js` |
| Saving roadmaps and progress (localStorage for now) | `js/store.js` |
| Example DSA roadmap shown on first visit | `js/seed.js` |

### Using it

- **View mode:** click a topic to see its problems and which ones you've solved.
- **Edit mode:** drag topics to move them; drag the dot under a topic onto another topic to make it a
  prerequisite; click a link and press Delete to remove it; "+ Topic" adds a topic under the selected one.
- **Adding problems:** paste links one per line. Accepted formats:
  `https://codeforces.com/contest/1520/problem/D`, `https://codeforces.com/problemset/problem/1520/D`,
  `https://codeforces.com/gym/102951/problem/A`, or just `1520D`.
- **Sync:** enter a handle and press Sync. It reads `user.status` and marks accepted problems green
  (and attempted ones amber). Div. 1 / Div. 2 copies of the same problem count as solved.
- **Sharing:** Export downloads a `.json` file; Import on the list page loads one.

### Codeforces API calls used

- `problemset.problems`: names and ratings, cached in the browser for 24 hours.
- `user.status?handle=…`: every submission for the handle.

## Limits of phase 1 (on purpose)

- Roadmaps live in one browser's localStorage. Clearing site data deletes them; export to back up.
- No accounts, voting or public sharing yet.

## Next phase

Move `js/store.js` to Supabase (Postgres + GitHub login): `roadmaps`, `topics`, `topic_links`,
`topic_problems`, `votes`. The rest of the app only talks to `store.js`, so the swap stays contained.
