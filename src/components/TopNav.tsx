"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMMUNITIES, ME } from "@/lib/data";
import { allPosts, allRoadmaps, streak, useStore } from "@/lib/store";
import { Avatar, cx, Icon } from "./ui";

export type NavKey = "roadmaps" | "practice" | "communities";

const LINKS: { key: NavKey; label: string; href: string }[] = [
  { key: "roadmaps", label: "Roadmaps", href: "/" },
  { key: "practice", label: "Practice", href: "/practice" },
  { key: "communities", label: "Communities", href: "/c/internships" },
];

export function TopNav({ active }: { active?: NavKey }) {
  const { state, actions } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const hit = (...xs: string[]) => xs.some((x) => x.toLowerCase().includes(term));
    return [
      ...allRoadmaps(state)
        .filter((r) => hit(r.title, r.description, ...r.tags))
        .map((r) => ({ kind: "Roadmap", label: r.title, href: `/roadmaps/${r.slug}` })),
      ...COMMUNITIES.filter((c) => hit(c.slug, c.tagline)).map((c) => ({ kind: "Community", label: `c/${c.slug}`, href: `/c/${c.slug}` })),
      ...allPosts(state)
        .filter((p) => hit(p.title, p.body))
        .map((p) => ({ kind: `c/${p.community}`, label: p.title, href: `/c/${p.community}/p/${p.id}` })),
    ].slice(0, 7);
  }, [q, state]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:gap-6 sm:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-[10px]">
        <span className="flex size-8 items-center justify-center rounded-[8px] bg-brand text-[12px] font-bold text-ink">{"</>"}</span>
        <span className="hidden text-[18px] font-bold text-fg sm:inline">DevPath</span>
      </Link>

      <nav className="hidden gap-1 md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            className={cx(
              "rounded-[8px] px-3 py-2 text-[14px] font-semibold text-fg-2 transition hover:text-fg",
              active === l.key && "bg-raised",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div ref={boxRef} className="relative min-w-0 flex-1">
        <label className="flex items-center gap-[10px] rounded-[10px] bg-raised px-[14px] py-[10px]">
          <Icon name="search" size={16} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) {
                router.push(results[0].href);
                setOpen(false);
              }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search roadmaps, problems, communities…"
            className="w-full min-w-0 bg-transparent text-[14px] text-fg outline-none placeholder:text-muted"
            aria-label="Search"
          />
        </label>
        {open && q.trim() && (
          <div className="absolute inset-x-0 top-[calc(100%+6px)] overflow-hidden rounded-[12px] border border-line bg-surface shadow-2xl shadow-black/40">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-muted">No matches for “{q}”</p>
            ) : (
              results.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-3 px-4 py-[10px] text-[14px] hover:bg-raised"
                >
                  <span className="w-[110px] shrink-0 truncate text-[12px] font-semibold text-brand">{r.kind}</span>
                  <span className="truncate text-fg">{r.label}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-[18px]">
        <span className="flex items-center gap-[6px]" title="Day streak">
          <Icon name="flame" size={18} />
          <span className="text-[14px] font-bold text-orange">{streak(state)}</span>
        </span>
        <span className="hidden items-center gap-[6px] sm:flex" title="Total XP">
          <Icon name="bolt" size={18} />
          <span className="text-[14px] font-bold text-yellow">{state.xp.toLocaleString("en-US")} XP</span>
        </span>
        <div className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Account menu" aria-expanded={menu}>
            <Avatar letter={ME.initial} bg="bg-purple" size={32} text={13} />
          </button>
          {menu && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-[12px] border border-line bg-surface py-1 text-[14px] shadow-2xl shadow-black/40"
              onMouseLeave={() => setMenu(false)}
            >
              <p className="px-4 py-2 text-[12px] text-muted">Signed in as @{ME.handle}</p>
              {LINKS.map((l) => (
                <Link key={l.key} href={l.href} className="block px-4 py-2 hover:bg-raised md:hidden" onClick={() => setMenu(false)}>
                  {l.label}
                </Link>
              ))}
              <Link href="/?feed=mine" className="block px-4 py-2 hover:bg-raised" onClick={() => setMenu(false)}>
                My roadmaps
              </Link>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-red hover:bg-raised"
                onClick={() => {
                  if (confirm("Reset all demo data (progress, votes, posts) back to the starting state?")) actions.reset();
                  setMenu(false);
                }}
              >
                Reset demo data
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
