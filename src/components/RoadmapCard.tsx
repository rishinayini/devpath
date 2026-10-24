"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { roadmapStats, TYPE_META, type Roadmap } from "@/lib/data";
import { ago, fmtCount } from "@/lib/ranking";
import { currentNode, scoreOf, useStore } from "@/lib/store";
import { Button, Card, Pill, Vote } from "./ui";

export function roadmapMeta(rm: Roadmap) {
  const s = roadmapStats(rm);
  const learners = `${fmtCount(rm.learners)} learner${rm.learners === 1 ? "" : "s"}`;
  if (rm.type === "problems") return `${s.problems} problems · ${learners}`;
  if (rm.type === "videos") return `${s.nodes} videos · ${s.hours}h · ${learners}`;
  return `${s.nodes} concepts · ${learners}`;
}

/** Where "Start/Continue" should take you: straight into the next lesson for problem roadmaps. */
export function continueHref(rm: Roadmap, node?: { id: string }) {
  if (rm.type === "problems" && node) return `/practice/${rm.slug}/${node.id}`;
  return `/roadmaps/${rm.slug}${node ? `#node-${node.id}` : ""}`;
}

export function RoadmapCard({ rm }: { rm: Roadmap }) {
  const { state, actions } = useStore();
  const router = useRouter();
  const key = `roadmap:${rm.slug}`;
  const meta = TYPE_META[rm.type];
  const prog = state.progress[rm.slug];
  const { node } = currentNode(rm, prog);

  return (
    <Card as="article" className="flex w-full gap-4 p-4">
      <div className="flex shrink-0 flex-col items-center self-start rounded-[10px] bg-raised p-[10px]">
        <Vote score={scoreOf(state, key, rm.up, rm.down)} mine={state.votes[key]} onVote={(d) => actions.vote(key, d)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-[10px]">
          <Pill tone={meta.tone}>{meta.cardLabel}</Pill>
          <span className="text-[13px] text-muted">
            by @{rm.author} · {ago(rm.createdAt)}
            {rm.forkedFrom && " · fork"}
          </span>
        </div>
        <Link href={`/roadmaps/${rm.slug}`} className="text-[18px] font-semibold text-fg hover:underline">
          {rm.title}
        </Link>
        <p className="text-[14px] text-fg-2">{rm.description}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {rm.tags.slice(0, 3).map((t) => (
            <Pill key={t}>{t}</Pill>
          ))}
          <span className="text-[13px] text-muted">{roadmapMeta(rm)}</span>
          <span className="flex-1" />
          <Button
            onClick={() => {
              actions.startRoadmap(rm.slug);
              router.push(continueHref(rm, node));
            }}
          >
            {prog ? (node ? "Continue" : "Review") : meta.cta}
          </Button>
        </div>
      </div>
    </Card>
  );
}
