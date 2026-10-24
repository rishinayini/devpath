"use client";

import Link from "next/link";
import { useState } from "react";
import type { Comment } from "@/lib/data";
import { SKILLS, type Skill } from "@/lib/problems";
import { hot, POST_DECAY, timeAgo } from "@/lib/ranking";
import { allComments, allPosts, DAILY_GOAL, dailyXp, dayKey, streak, useStore, votesOf, weekDays } from "@/lib/store";
import { Button, Card, cx, Icon, Progress } from "./ui";

export function StreakCard() {
  const { state } = useStore();
  const n = streak(state);
  const doneToday = state.activeDays.includes(dayKey());
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <Icon name="flame-lg" size={34} />
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <p className="text-[18px] font-bold">{n}-day streak</p>
          <p className="text-[13px] text-muted">
            {doneToday ? "Streak safe for today. Keep it going tomorrow!" : "Solve one problem today to keep your streak."}
          </p>
        </div>
      </div>
      <div className="flex items-start justify-between">
        {weekDays(state).map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            {d.active ? (
              <span className="flex size-7 items-center justify-center rounded-full bg-orange">
                <Icon name="streak-check" size={14} />
              </span>
            ) : (
              <span className="h-px w-px" />
            )}
            <span className="text-[11px] font-semibold text-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DailyGoalCard() {
  const { state } = useStore();
  const xp = dailyXp(state);
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center">
        <p className="text-[16px] font-bold">Daily goal</p>
        <span className="flex-1" />
        <p className="text-[13px] font-semibold text-yellow">
          {Math.min(xp, DAILY_GOAL)} / {DAILY_GOAL} XP
        </p>
      </div>
      <Progress value={xp / DAILY_GOAL} height={10} color="bg-yellow" />
    </Card>
  );
}

/** Ratings shown on a 1000–1800 scale, matching the bar widths in the design. */
export function SkillRatingsCard() {
  const { state } = useStore();
  return (
    <Card className="flex flex-col gap-3 p-5">
      <p className="text-[16px] font-bold">Skill ratings</p>
      {(Object.keys(SKILLS) as Skill[]).map((k) => (
        <div key={k} className="flex flex-col gap-[6px]">
          <div className="flex text-[13px]">
            <span className="text-fg-2">{SKILLS[k]}</span>
            <span className="flex-1" />
            <span className="font-semibold text-brand tabular-nums">{state.ratings[k]}</span>
          </div>
          <Progress value={(state.ratings[k] - 1000) / 800} height={8} />
        </div>
      ))}
    </Card>
  );
}

export function HotInCommunitiesCard() {
  const { state } = useStore();
  const posts = allPosts(state)
    .map((p) => ({ p, v: votesOf(state, `post:${p.id}`, p.up, p.down) }))
    .sort((a, b) => hot(b.v.up, b.v.down, b.p.createdAt, POST_DECAY) - hot(a.v.up, a.v.down, a.p.createdAt, POST_DECAY));
  // One post per community, top three communities.
  const seen = new Set<string>();
  const top = posts.filter(({ p }) => !seen.has(p.community) && seen.add(p.community)).slice(0, 3);
  return (
    <Card className="flex flex-col gap-3 p-5">
      <p className="text-[16px] font-bold">Hot in communities</p>
      {top.map(({ p }) => (
        <Link key={p.id} href={`/c/${p.community}/p/${p.id}`} className="group flex flex-col gap-[2px]">
          <span className="text-[12px] font-semibold text-brand">c/{p.community}</span>
          <span className="text-[13px] font-medium text-fg group-hover:underline">{p.title}</span>
        </Link>
      ))}
    </Card>
  );
}

/** Compact comment list + composer, used on roadmap pages. */
export function DiscussionCard({ thread }: { thread: string }) {
  const { state, actions } = useStore();
  const [text, setText] = useState("");
  const comments = allComments(state).filter((c: Comment) => c.thread === thread);
  const latest = [...comments].sort((a, b) => a.createdAt - b.createdAt).slice(-3);
  return (
    <Card className="flex flex-col gap-3 p-5">
      <p className="text-[16px] font-bold">
        Discussion · {comments.length} comment{comments.length === 1 ? "" : "s"}
      </p>
      {latest.map((c) => (
        <div key={c.id} className="flex flex-col gap-[2px]">
          <p className="text-[12px] font-bold text-blue">
            @{c.author} <span className="font-normal text-muted">· {timeAgo(c.createdAt)}</span>
          </p>
          <p className="text-[13px] text-fg-2">{c.body}</p>
        </div>
      ))}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          actions.addComment(thread, null, text.trim());
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="min-w-0 flex-1 rounded-[10px] border border-line bg-bg px-3 py-2 text-[13px] outline-none placeholder:text-muted focus:border-brand/60"
        />
        <Button variant="secondary" type="submit" className={cx("!px-3 !py-2 !text-[13px]", !text.trim() && "opacity-60")}>
          Post
        </Button>
      </form>
    </Card>
  );
}
