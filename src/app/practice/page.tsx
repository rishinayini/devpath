"use client";

import { RoadmapCard } from "@/components/RoadmapCard";
import { TopNav } from "@/components/TopNav";
import { Button, Card, Pill } from "@/components/ui";
import { DailyGoalCard, SkillRatingsCard, StreakCard } from "@/components/Widgets";
import { poolFor } from "@/lib/data";
import { difficultyLabel } from "@/lib/elo";
import { allRoadmaps, currentNode, useStore } from "@/lib/store";

export default function PracticeHome() {
  const { state } = useStore();
  const problemRoadmaps = allRoadmaps(state).filter((r) => r.type === "problems");
  const inProgress = problemRoadmaps
    .filter((r) => state.progress[r.slug])
    .map((r) => ({ r, ...currentNode(r, state.progress[r.slug]) }))
    .filter((x) => x.node);

  return (
    <>
      <TopNav active="practice" />
      <div className="flex flex-col gap-8 px-4 pb-12 pt-7 sm:px-8 lg:flex-row">
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <div>
            <h1 className="text-[28px] font-bold">Practice</h1>
            <p className="text-[14px] text-muted">Adaptive lessons pick each problem to match your rating for that skill.</p>
          </div>

          {inProgress.length > 0 && (
            <>
              <h2 className="pt-2 text-[16px] font-bold">Continue where you left off</h2>
              {inProgress.map(({ r, node, unitIndex }) => {
                const pool = poolFor(node!);
                const avg = Math.round(pool.reduce((s, p) => s + p.rating, 0) / pool.length);
                return (
                  <Card key={r.slug} className="flex flex-wrap items-center gap-4 p-5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap gap-2">
                        <Pill tone="blue">
                          Unit {unitIndex + 1} · {node!.title}
                        </Pill>
                        <Pill tone="orange">
                          {difficultyLabel(avg)} · ~{avg}
                        </Pill>
                      </div>
                      <p className="text-[18px] font-semibold">{r.title}</p>
                      <p className="text-[13px] text-muted">{pool.length} problems in this node’s pool</p>
                    </div>
                    <Button href={`/practice/${r.slug}/${node!.id}`}>Continue</Button>
                  </Card>
                );
              })}
            </>
          )}

          <h2 className="pt-2 text-[16px] font-bold">Problem roadmaps</h2>
          {problemRoadmaps.map((r) => (
            <RoadmapCard key={r.slug} rm={r} />
          ))}
        </main>
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px]">
          <StreakCard />
          <DailyGoalCard />
          <SkillRatingsCard />
        </aside>
      </div>
    </>
  );
}
