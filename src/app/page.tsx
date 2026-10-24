"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RoadmapCard } from "@/components/RoadmapCard";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Button, cx, Pill } from "@/components/ui";
import { DailyGoalCard, HotInCommunitiesCard, SkillRatingsCard, StreakCard } from "@/components/Widgets";
import { ME, type RoadmapType } from "@/lib/data";
import { hot, rising, ROADMAP_DECAY, wilson } from "@/lib/ranking";
import { allRoadmaps, useStore, votesOf } from "@/lib/store";

const SORTS = ["hot", "top", "new", "rising"] as const;
type Sort = (typeof SORTS)[number];
const TYPES: { key: RoadmapType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "problems", label: "Coding Problems" },
  { key: "concepts", label: "Concepts" },
  { key: "videos", label: "Videos" },
];

function Home() {
  const { state } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const sort = (SORTS.includes(params.get("sort") as Sort) ? params.get("sort") : "hot") as Sort;
  const type = (params.get("type") ?? "all") as RoadmapType | "all";
  const mine = params.get("feed") === "mine";

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v === null) p.delete(k);
    else p.set(k, v);
    router.replace(`/?${p.toString()}`, { scroll: false });
  };

  const now = Date.now();
  const list = allRoadmaps(state)
    .filter((r) => type === "all" || r.type === type)
    .filter((r) => !mine || r.author === ME.handle || state.progress[r.slug] || state.saved.includes(`roadmap:${r.slug}`))
    .map((r) => ({ r, v: votesOf(state, `roadmap:${r.slug}`, r.up, r.down) }))
    .sort((a, b) => {
      if (sort === "new") return b.r.createdAt - a.r.createdAt;
      if (sort === "top") return wilson(b.v.up, b.v.down) - wilson(a.v.up, a.v.down);
      if (sort === "rising") return rising(b.v.up, b.v.down, b.r.createdAt, now) - rising(a.v.up, a.v.down, a.r.createdAt, now);
      return hot(b.v.up, b.v.down, b.r.createdAt, ROADMAP_DECAY) - hot(a.v.up, a.v.down, a.r.createdAt, ROADMAP_DECAY);
    })
    .map((x) => x.r);

  const sidebarKey = mine ? "mine" : type !== "all" ? type : sort === "top" ? "popular" : "home";

  return (
    <>
      <TopNav active="roadmaps" />
      <div className="flex flex-col gap-8 px-4 pb-12 pt-7 sm:px-8 lg:flex-row">
        <Sidebar active={sidebarKey} />
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-[28px] font-bold">{mine ? "My Roadmaps" : "Roadmaps"}</h1>
              <p className="text-[14px] text-muted">
                {mine ? "Roadmaps you’ve started, saved or created" : "Community-ranked learning paths for every corner of CS"}
              </p>
            </div>
            <span className="flex-1" />
            <Button href="/roadmaps/new">+ Create roadmap</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1" role="tablist" aria-label="Sort roadmaps">
              {SORTS.map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={sort === s}
                  onClick={() => setParam("sort", s === "hot" ? null : s)}
                  className={cx(
                    "rounded-[8px] px-3 py-[6px] text-[14px] capitalize transition",
                    sort === s ? "bg-raised font-semibold text-fg" : "font-medium text-muted hover:text-fg",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="flex-1" />
            {TYPES.map((t) => (
              <Pill
                key={t.key}
                tone={type === t.key ? "green" : "neutral"}
                onClick={() => setParam("type", t.key === "all" ? null : t.key)}
              >
                {t.label}
              </Pill>
            ))}
          </div>

          {list.map((r) => (
            <RoadmapCard key={r.slug} rm={r} />
          ))}
          {list.length === 0 && (
            <div className="rounded-[14px] border border-dashed border-line p-10 text-center text-[14px] text-muted">
              Nothing here yet.{" "}
              <Link href="/" className="text-brand hover:underline">
                Browse all roadmaps
              </Link>{" "}
              or create your own.
            </div>
          )}
        </main>
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px]">
          <StreakCard />
          <DailyGoalCard />
          <SkillRatingsCard />
          <HotInCommunitiesCard />
        </aside>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
