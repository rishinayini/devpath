"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { continueHref } from "@/components/RoadmapCard";
import { TopNav } from "@/components/TopNav";
import { Button, Card, cx, Icon, Pill, Progress, Vote } from "@/components/ui";
import { DiscussionCard } from "@/components/Widgets";
import { allNodes, ME, nodeRating, poolFor, roadmapStats, TYPE_META, type Roadmap, type RoadmapNode } from "@/lib/data";
import { SKILLS } from "@/lib/problems";
import { ago, fmtCount } from "@/lib/ranking";
import { currentNode, findRoadmap, nodeStatuses, ratingDelta7d, scoreOf, useStore, votesOf, type NodeStatus } from "@/lib/store";

// Horizontal offsets (px) that give the path its zig-zag, repeating every 8 nodes, as in the design.
const ZIGZAG = [0, 60, 100, 60, 0, -60, -100, -60];

export default function RoadmapPage() {
  const { slug } = useParams<{ slug: string }>();
  const { state, actions } = useStore();
  const router = useRouter();
  const rm = findRoadmap(state, slug);
  if (!rm) {
    return (
      <>
        <TopNav active="roadmaps" />
        <p className="p-10 text-center text-muted">
          Roadmap not found.{" "}
          <Link href="/" className="text-brand">
            Back to roadmaps
          </Link>
        </p>
      </>
    );
  }

  const key = `roadmap:${rm.slug}`;
  const meta = TYPE_META[rm.type];
  const prog = state.progress[rm.slug];
  const statuses = nodeStatuses(rm, prog);
  const cur = currentNode(rm, prog);
  const stats = roadmapStats(rm);
  const v = votesOf(state, key, rm.up, rm.down);
  const pct = Math.round((v.up / Math.max(1, v.up + v.down)) * 100);
  const skill = allNodes(rm).find((n) => n.skill)?.skill;
  const saved = state.saved.includes(key);

  const statsLine =
    rm.type === "problems"
      ? `${stats.problems} problems · ${stats.units} units · ${stats.nodes} nodes`
      : rm.type === "videos"
        ? `${stats.nodes} videos · ${stats.hours}h · ${stats.units} units`
        : `${stats.nodes} concepts · ${stats.units} units`;

  const fork = () => {
    const copy: Roadmap = {
      ...rm,
      slug: `${rm.slug}-fork-${Math.random().toString(36).slice(2, 6)}`,
      title: `${rm.title} (fork)`,
      author: ME.handle,
      createdAt: Date.now(),
      updatedAt: undefined,
      up: 0,
      down: 0,
      learners: 1,
      forks: 0,
      forkedFrom: rm.slug,
    };
    actions.addRoadmap(copy);
    router.push(`/roadmaps/${copy.slug}`);
  };

  let nodeIndex = 0;

  return (
    <>
      <TopNav active="roadmaps" />
      <div className="flex flex-col gap-8 px-4 pb-16 pt-6 sm:px-8 lg:flex-row">
        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <nav className="text-[13px] font-medium whitespace-pre text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-fg">
              Roadmaps
            </Link>
            {"  /  "}
            <Link href={`/?type=${rm.type}`} className="hover:text-fg">
              {meta.crumb}
            </Link>
            {"  /  "}
            <span>{rm.title.split(":")[0]}</span>
          </nav>

          <Card className="flex gap-5 p-6">
            <Vote score={scoreOf(state, key, rm.up, rm.down)} mine={state.votes[key]} onVote={(d) => actions.vote(key, d)} />
            <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
              <div className="flex gap-2">
                <Pill tone={meta.tone}>{meta.label}</Pill>
                {rm.type === "problems" && <Pill tone="purple">Adaptive</Pill>}
              </div>
              <h1 className="text-[30px] font-bold">{rm.title}</h1>
              <p className="text-[13px] text-muted">
                by @{rm.author} · {rm.updatedAt ? `updated ${ago(rm.updatedAt)}` : `created ${ago(rm.createdAt)}`}
                {rm.forks > 0 && ` · forked ${rm.forks} times`}
                {rm.forkedFrom && (
                  <>
                    {" · forked from "}
                    <Link className="text-brand hover:underline" href={`/roadmaps/${rm.forkedFrom}`}>
                      original
                    </Link>
                  </>
                )}
              </p>
              <p className="text-[15px] text-fg-2">{rm.longDescription ?? rm.description}</p>
              <p className="text-[13px] font-medium text-muted">
                {statsLine} · {fmtCount(rm.learners)} learners · {pct}% upvoted
              </p>
              <div className="flex flex-wrap gap-[10px] pt-[6px]">
                <Button
                  onClick={() => {
                    actions.startRoadmap(rm.slug);
                    if (cur.node) router.push(continueHref(rm, cur.node));
                  }}
                  disabled={!cur.node && !!prog}
                >
                  {!prog ? meta.cta : cur.node ? `Continue · Unit ${cur.unitIndex + 1}` : "Completed"}
                </Button>
                <Button variant="secondary" onClick={fork}>
                  Fork
                </Button>
                <Button variant="secondary" onClick={() => actions.toggleSaved(key)} aria-pressed={saved}>
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex w-full flex-col items-center gap-5">
            {rm.units.map((unit, ui) => {
              const unitStatuses = unit.nodes.map((n) => statuses.get(n.id)!);
              const doneN = unitStatuses.filter((s) => s === "done").length;
              const tone = doneN === unit.nodes.length ? "done" : unitStatuses.includes("current") ? "active" : "locked";
              return (
                <div key={unit.id} className="contents">
                  <div
                    className={cx(
                      "flex w-full items-center rounded-[14px] px-5 py-[14px]",
                      tone === "done" && "bg-brand text-ink-2",
                      tone === "active" && "bg-blue text-ink-2",
                      tone === "locked" && "bg-raised",
                    )}
                  >
                    <div className="flex flex-col font-bold">
                      <span className={cx("text-[12px]", tone === "locked" && "text-muted")}>UNIT {ui + 1}</span>
                      <span className={cx("text-[18px]", tone === "locked" && "text-fg")}>{unit.title}</span>
                    </div>
                    <span className="flex-1" />
                    <span className={cx("text-[13px] font-semibold", tone === "locked" && "text-muted")}>
                      {doneN} / {unit.nodes.length} complete
                    </span>
                  </div>
                  {unit.nodes.map((n) => (
                    <NodeRow key={n.id} rm={rm} node={n} status={statuses.get(n.id)!} dx={ZIGZAG[nodeIndex++ % ZIGZAG.length]} />
                  ))}
                </div>
              );
            })}
          </div>
        </main>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[320px]">
          <Card className="flex flex-col gap-3 p-5">
            <p className="text-[16px] font-bold">Your progress</p>
            <p className="text-[13px] text-muted">
              {prog
                ? `Unit ${Math.min(cur.unitIndex + 1, rm.units.length)} of ${rm.units.length} · ${cur.doneCount} of ${cur.total} nodes done`
                : "Not started yet"}
            </p>
            <Progress value={cur.doneCount / cur.total} height={12} />
            {skill && (
              <>
                <div className="flex items-center">
                  <span className="text-[14px] font-medium text-fg-2">{SKILLS[skill]} rating</span>
                  <span className="flex-1" />
                  <span className="text-[18px] font-bold text-brand">{state.ratings[skill]}</span>
                </div>
                {(() => {
                  const d = ratingDelta7d(state, skill);
                  return (
                    <p className={cx("text-[12px] font-semibold", d >= 0 ? "text-brand" : "text-red")}>
                      {d >= 0 ? "+" : ""}
                      {d} this week
                    </p>
                  );
                })()}
              </>
            )}
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <p className="text-[16px] font-bold">
              {rm.type === "problems" ? "How this roadmap adapts" : rm.type === "videos" ? "How video roadmaps work" : "How concept roadmaps work"}
            </p>
            <p className="text-[13px] text-fg-2">
              {rm.type === "problems"
                ? "Each node pulls from a pool of problems at different difficulties. Solve quickly and you’ll skip ahead to harder ones; struggle and you’ll get warm-ups and hints before moving on."
                : rm.type === "videos"
                  ? "Each node links to free lectures on YouTube. Watch, then mark it done to unlock the next one."
                  : "Each node has a short summary, a free reference and a checkpoint project. Mark it done when you’ve built the checkpoint."}
            </p>
          </Card>
          <DiscussionCard thread={key} />
        </aside>
      </div>
    </>
  );
}

function NodeRow({ rm, node, status, dx }: { rm: Roadmap; node: RoadmapNode; status: NodeStatus; dx: number }) {
  const { state, actions } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pool = poolFor(node);
  const locked = status === "locked";
  const lesson = state.progress[rm.slug]?.lessons[node.id];
  const left = pool.length - (lesson?.solved.length ?? 0) - (lesson?.skipped.length ?? 0);

  const subtitle =
    rm.type === "problems"
      ? `${pool.length} problems · ~${nodeRating(node)}`
      : rm.type === "videos"
        ? `~${node.minutes ?? 0} min`
        : "Concept + checkpoint";

  const onClick = () => {
    if (locked) return;
    actions.startRoadmap(rm.slug);
    if (rm.type === "problems") router.push(`/practice/${rm.slug}/${node.id}`);
    else setOpen((o) => !o);
  };

  const circle = (
    <span
      className={cx(
        "flex size-[72px] items-center justify-center rounded-full",
        status === "locked" ? "bg-raised shadow-[0_4px_0_0_#08090d]" : "bg-brand shadow-[0_4px_0_0_var(--color-brand-deep)]",
        status === "current" && "border-8 border-brand/30 bg-clip-padding",
      )}
    >
      {status === "done" && <Icon name="node-check" size={32} />}
      {status === "current" && <Icon name="node-star" size={30} />}
      {status === "locked" && <Icon name="node-lock" size={26} />}
    </span>
  );

  return (
    <div id={`node-${node.id}`} className="flex w-full flex-col items-center gap-3 scroll-mt-24">
      <div className="flex items-center gap-5 sm:translate-x-[var(--dx)]" style={{ "--dx": `${dx}px` } as CSSProperties}>
        <div className="hidden h-px w-[200px] sm:block" />
        <button
          type="button"
          onClick={onClick}
          disabled={locked}
          title={locked ? "Complete the earlier nodes first" : undefined}
          className="flex flex-col items-center gap-[10px] transition enabled:hover:brightness-110 disabled:cursor-not-allowed"
          aria-label={`${node.title}: ${status}`}
        >
          {status === "current" && (
            <span className="rounded-full bg-fg px-[10px] py-[3px] text-[12px] font-semibold text-ink-2">
              {rm.type === "problems" ? `START · ${left} problem${left === 1 ? "" : "s"}` : "UP NEXT"}
            </span>
          )}
          {circle}
        </button>
        <div className={cx("flex w-[200px] flex-col gap-[2px]", locked && "text-muted")}>
          <span className={cx("text-[16px] font-semibold", !locked && "text-fg")}>{node.title}</span>
          <span className="text-[12px] text-muted">{subtitle}</span>
        </div>
      </div>

      {open && rm.type !== "problems" && (
        <Card className="flex w-full max-w-[520px] flex-col gap-3 p-4">
          {node.summary && <p className="text-[14px] text-fg-2">{node.summary}</p>}
          <div className="flex flex-wrap gap-2">
            {node.url && (
              <Button variant="secondary" href={node.url}>
                {rm.type === "videos" ? "Find lectures on YouTube ↗" : "Open reference ↗"}
              </Button>
            )}
            <Button onClick={() => actions.toggleNode(rm.slug, node.id)}>
              {status === "done" ? "Mark not done" : rm.type === "videos" ? "Mark watched" : "Mark complete"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
