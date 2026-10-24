"use client";

import Link from "next/link";
import type { Community } from "@/lib/data";
import { cx, Pill } from "./ui";

export const TABS = ["hot", "new", "top", "wiki"] as const;
export type Tab = (typeof TABS)[number];

/** Sort tabs + flair filters. On a post page, tabs link back to the feed. */
export function CommunityTabs({
  c,
  tab,
  flairs,
  onTab,
  onFlair,
}: {
  c: Community;
  tab?: Tab;
  flairs: string[];
  onTab?: (t: Tab) => void;
  onFlair?: (f: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1" role="tablist">
        {TABS.map((t) => {
          const cls = cx(
            "rounded-[8px] px-3 py-[6px] text-[14px] capitalize transition",
            tab === t ? "bg-raised font-semibold text-fg" : "font-medium text-muted hover:text-fg",
          );
          return onTab ? (
            <button key={t} role="tab" aria-selected={tab === t} className={cls} onClick={() => onTab(t)}>
              {t}
            </button>
          ) : (
            <Link key={t} href={`/c/${c.slug}?tab=${t}`} className={cls}>
              {t}
            </Link>
          );
        })}
      </div>
      <span className="flex-1" />
      {c.flairs.map((f) => (
        <Pill
          key={f.name}
          tone={f.tone}
          active={flairs.length === 0 || flairs.includes(f.name)}
          onClick={onFlair ? () => onFlair(f.name) : undefined}
        >
          {f.name}
        </Pill>
      ))}
    </div>
  );
}
