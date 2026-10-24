/* eslint-disable @next/next/no-img-element -- icons are small static SVGs exported from Figma */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Tone } from "@/lib/data";
import { fmtCount } from "@/lib/ranking";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Icon({ name, size, className }: { name: string; size: number; className?: string }) {
  return <img src={`/icons/${name}.svg`} width={size} height={size} alt="" aria-hidden className={cx("shrink-0", className)} />;
}

const TONES: Record<Tone, string> = {
  green: "bg-brand/15 text-brand",
  red: "bg-red/15 text-red",
  blue: "bg-blue/15 text-blue",
  purple: "bg-purple/15 text-purple",
  orange: "bg-orange/18 text-orange",
  yellow: "bg-yellow/15 text-yellow",
  neutral: "bg-raised text-fg-2",
};

export function Pill({
  tone = "neutral",
  children,
  onClick,
  active,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  const cls = cx(
    "inline-flex items-center rounded-full px-[10px] py-[3px] text-[12px] font-semibold whitespace-nowrap",
    TONES[tone],
    onClick && "cursor-pointer transition hover:brightness-125",
    active === false && "opacity-60",
    className,
  );
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  ) : (
    <span className={cls}>{children}</span>
  );
}

type ButtonProps = {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className">;

export function Button({ variant = "primary", size = "md", href, className, children, ...rest }: ButtonProps) {
  const cls = cx(
    "inline-flex items-center justify-center rounded-[10px] text-[14px] whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-50",
    size === "md" ? "px-[18px] py-[10px]" : "px-[32px] py-[14px]",
    variant === "primary"
      ? "btn-3d bg-brand font-bold text-ink [--btn-shadow:var(--color-brand-deep)]"
      : "border border-line bg-raised font-semibold text-fg transition hover:border-muted/60",
    className,
  );
  if (href?.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Card({ className, children, as: As = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "aside" }) {
  return <As className={cx("rounded-[14px] border border-line bg-surface", className)}>{children}</As>;
}

export function Progress({ value, height = 8, color = "bg-brand", className }: { value: number; height?: number; color?: string; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cx("w-full overflow-hidden bg-raised", className)}
      style={{ height, borderRadius: height / 2 }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cx("h-full transition-[width] duration-500", color)} style={{ width: `${pct}%`, borderRadius: height / 2 }} />
    </div>
  );
}

export function Vote({
  score,
  mine,
  onVote,
  layout = "vertical",
  compact,
}: {
  score: number;
  mine?: 1 | -1;
  onVote: (dir: 1 | -1) => void;
  layout?: "vertical" | "horizontal";
  compact?: boolean;
}) {
  const btn = "rounded-[6px] p-0 transition hover:bg-line/70";
  return (
    <div className={cx("flex items-center", layout === "vertical" ? "flex-col gap-[2px]" : "gap-[6px]")}>
      <button type="button" aria-label="Upvote" aria-pressed={mine === 1} className={btn} onClick={() => onVote(1)}>
        <Icon name={mine === 1 ? "upvote-active" : "upvote"} size={20} />
      </button>
      <span
        className={cx(
          "font-bold tabular-nums",
          compact ? "text-[12px]" : "text-[14px]",
          mine === 1 ? "text-orange" : mine === -1 ? "text-blue" : "text-fg",
        )}
      >
        {fmtCount(score)}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={mine === -1}
        className={cx(btn, mine === -1 && "bg-blue/25")}
        onClick={() => onVote(-1)}
      >
        <Icon name="downvote" size={20} />
      </button>
    </div>
  );
}

export function Avatar({ letter, bg, size = 28, text = 12 }: { letter: string; bg: string; size?: number; text?: number }) {
  return (
    <div
      className={cx("flex shrink-0 items-center justify-center rounded-full font-bold text-ink-2", bg)}
      style={{ width: size, height: size, fontSize: text }}
    >
      {letter}
    </div>
  );
}

/** Small uppercase sidebar heading. */
export const SectionLabel = ({ children, first }: { children: ReactNode; first?: boolean }) => (
  <div className={cx("pb-[6px] pl-[12px] text-[11px] font-bold tracking-[0.88px] text-muted", !first && "pt-[18px]")}>{children}</div>
);
