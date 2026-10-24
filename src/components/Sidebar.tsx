import Link from "next/link";
import { COMMUNITIES } from "@/lib/data";
import { cx, Icon, SectionLabel } from "./ui";

const FEEDS = [
  { key: "home", label: "Home", href: "/", dot: "dot-white" },
  { key: "popular", label: "Popular", href: "/?sort=top", dot: "dot-orange" },
  { key: "mine", label: "My Roadmaps", href: "/?feed=mine", dot: "dot-green" },
];
const TYPES = [
  { key: "problems", label: "Coding Problems", href: "/?type=problems", dot: "dot-green" },
  { key: "concepts", label: "Concepts", href: "/?type=concepts", dot: "dot-blue" },
  { key: "videos", label: "Video Courses", href: "/?type=videos", dot: "dot-red" },
];

function Item({ href, dot, label, active }: { href: string; dot: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex w-full items-center gap-[10px] rounded-[8px] px-3 py-2 text-[14px] transition",
        active ? "bg-raised font-semibold text-fg" : "text-fg-2 hover:bg-raised/60 hover:text-fg",
      )}
    >
      <Icon name={dot} size={8} />
      {label}
    </Link>
  );
}

/** `active` is a feed key, a roadmap type, or `c/<slug>`. */
export function Sidebar({ active }: { active: string }) {
  return (
    <nav className="hidden w-[220px] shrink-0 flex-col gap-[2px] xl:flex" aria-label="Feeds and communities">
      <SectionLabel first>FEEDS</SectionLabel>
      {FEEDS.map((f) => (
        <Item key={f.key} href={f.href} dot={f.dot} label={f.label} active={active === f.key} />
      ))}
      <SectionLabel>ROADMAP TYPES</SectionLabel>
      {TYPES.map((t) => (
        <Item key={t.key} href={t.href} dot={t.dot} label={t.label} active={active === t.key} />
      ))}
      <SectionLabel>COMMUNITIES</SectionLabel>
      {COMMUNITIES.map((c) => (
        <Item key={c.slug} href={`/c/${c.slug}`} dot={c.dot} label={`c/${c.slug}`} active={active === `c/${c.slug}`} />
      ))}
    </nav>
  );
}
