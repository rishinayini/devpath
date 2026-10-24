"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { avatarColor, COMMUNITY_BY_SLUG, RELATED_DOT, type Comment, type Community, type Post } from "@/lib/data";
import { fmtCount, timeAgo, wilson } from "@/lib/ranking";
import { allComments, scoreOf, useStore, votesOf } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Avatar, Button, Card, cx, Icon, Pill, Vote } from "./ui";

export function CommunityShell({ c, children }: { c: Community; children: ReactNode }) {
  return (
    <>
      <TopNav active="communities" />
      <div className="flex flex-col gap-8 px-4 pb-12 pt-7 sm:px-8 lg:flex-row">
        <Sidebar active={`c/${c.slug}`} />
        <main className="flex min-w-0 flex-1 flex-col gap-4">{children}</main>
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px]">
          <AboutCard c={c} />
          <Card className="flex flex-col gap-3 p-5">
            <p className="text-[16px] font-bold">Rules</p>
            {c.rules.map((r, i) => (
              <p key={r} className="text-[13px] text-fg-2">
                {i + 1}. {r}
              </p>
            ))}
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <p className="text-[16px] font-bold">Related communities</p>
            {c.related.map((slug) => {
              const r = COMMUNITY_BY_SLUG[slug];
              return (
                <Link key={slug} href={`/c/${slug}`} className="flex items-center gap-[10px] hover:underline">
                  <Icon name={RELATED_DOT[slug] ?? r.dot} size={RELATED_DOT[slug] ? 10 : 8} />
                  <span className="text-[14px] font-medium">c/{slug}</span>
                  <span className="flex-1" />
                  <span className="text-[12px] text-muted">{fmtCount(r.members)}</span>
                </Link>
              );
            })}
          </Card>
        </aside>
      </div>
    </>
  );
}

function AboutCard({ c }: { c: Community }) {
  const { state } = useStore();
  const joined = state.joined.includes(c.slug);
  return (
    <Card className="flex flex-col gap-3 p-5">
      <p className="text-[16px] font-bold">About c/{c.slug}</p>
      <p className="text-[13px] text-fg-2">{c.about}</p>
      <div className="flex gap-6">
        <div className="flex flex-col">
          <span className="text-[16px] font-bold">{fmtCount(c.members + (joined ? 1 : 0))}</span>
          <span className="text-[12px] text-muted">members</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-bold">{c.online}</span>
          <span className="text-[12px] text-muted">online</span>
        </div>
      </div>
    </Card>
  );
}

export function CommunityHeader({ c, onNewPost }: { c: Community; onNewPost: () => void }) {
  const { state, actions } = useStore();
  const joined = state.joined.includes(c.slug);
  return (
    <Card className="overflow-hidden">
      <div className="h-[72px] w-full bg-gradient-to-r from-[#2f9e6a] to-[#3b5bdb]" />
      <div className="flex flex-wrap items-center gap-[14px] px-5 py-4">
        <Avatar letter={c.avatarText} bg={c.avatarBg} size={56} text={24} />
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <Link href={`/c/${c.slug}`} className="text-[24px] font-bold hover:underline">
            c/{c.slug}
          </Link>
          <p className="text-[13px] text-muted">
            {c.tagline} · {fmtCount(c.members + (joined ? 1 : 0))} members · {c.online} online
          </p>
        </div>
        <Button variant="secondary" onClick={() => actions.toggleJoined(c.slug)} aria-pressed={joined}>
          {joined ? "Joined" : "Join"}
        </Button>
        <Button onClick={onNewPost}>+ New post</Button>
      </div>
    </Card>
  );
}

export function PostActions({ post, comments, linkComments }: { post: Post; comments: number; linkComments: boolean }) {
  const { state, actions } = useStore();
  const [copied, setCopied] = useState(false);
  const saved = state.saved.includes(`post:${post.id}`);
  const item = "flex items-center gap-[6px] text-[13px] font-semibold text-muted hover:text-fg";
  const label = `${comments} comment${comments === 1 ? "" : "s"}`;
  return (
    <div className="flex items-center gap-5 pt-1">
      {linkComments ? (
        <Link href={`/c/${post.community}/p/${post.id}`} className={item}>
          <Icon name="comment" size={16} />
          {label}
        </Link>
      ) : (
        <span className={item}>
          <Icon name="comment" size={16} />
          {label}
        </span>
      )}
      <button
        type="button"
        className={item}
        onClick={() => {
          navigator.clipboard?.writeText(`${location.origin}/c/${post.community}/p/${post.id}`).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        <Icon name="share" size={16} />
        {copied ? "Link copied" : "Share"}
      </button>
      <button type="button" className={cx(item, saved && "text-fg")} onClick={() => actions.toggleSaved(`post:${post.id}`)} aria-pressed={saved}>
        <Icon name="save" size={16} />
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

export function PostCard({ post, comments, expanded }: { post: Post; comments: number; expanded?: boolean }) {
  const { state, actions } = useStore();
  const c = COMMUNITY_BY_SLUG[post.community];
  const flair = c.flairs.find((f) => f.name === post.flair);
  const key = `post:${post.id}`;
  return (
    <Card as="article" className="flex gap-4 p-5">
      <Vote score={scoreOf(state, key, post.up, post.down)} mine={state.votes[key]} onVote={(d) => actions.vote(key, d)} />
      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        <div className="flex flex-wrap items-center gap-[10px]">
          {flair && <Pill tone={flair.tone}>{flair.name}</Pill>}
          <span className="text-[13px] text-muted">
            Posted by @{post.author} · {timeAgo(post.createdAt)}
            {timeAgo(post.createdAt) !== "just now" && " ago"}
          </span>
        </div>
        {expanded ? (
          <h1 className="text-[22px] font-bold">{post.title}</h1>
        ) : (
          <Link href={`/c/${post.community}/p/${post.id}`} className="text-[18px] font-semibold hover:underline">
            {post.title}
          </Link>
        )}
        <p className={cx("text-[15px] whitespace-pre-wrap text-fg-2", !expanded && "line-clamp-3 text-[14px]")}>{post.body}</p>
        <PostActions post={post} comments={comments} linkComments={!expanded} />
      </div>
    </Card>
  );
}

export function NewPostDialog({ c, onClose, onCreated }: { c: Community; onClose: () => void; onCreated: (p: Post) => void }) {
  const { actions } = useStore();
  const [flair, setFlair] = useState(c.flairs[0].name);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const field = "w-full rounded-[10px] border border-line bg-bg px-[14px] py-[10px] text-[14px] outline-none placeholder:text-muted focus:border-brand/60";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose} role="dialog" aria-modal aria-label="New post">
      <div onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-[560px]">
      <Card className="flex flex-col gap-4 p-6">
          <p className="text-[18px] font-bold">New post in c/{c.slug}</p>
          <div className="flex flex-wrap gap-2">
            {c.flairs.map((f) => (
              <Pill key={f.name} tone={flair === f.name ? f.tone : "neutral"} onClick={() => setFlair(f.name)}>
                {f.name}
              </Pill>
            ))}
          </div>
          <input className={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} autoFocus />
          <textarea className={cx(field, "min-h-[140px]")} placeholder="What’s on your mind?" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!title.trim()}
              onClick={() => onCreated(actions.addPost({ community: c.slug, flair, title: title.trim(), body: body.trim() }))}
            >
              Post
            </Button>
          </div>
      </Card>
      </div>
    </div>
  );
}

// ── Comment thread ──────────────────────────────────────────────────────

type SortKey = "best" | "new" | "top";

export function CommentThread({ thread, op }: { thread: string; op: string }) {
  const { state } = useStore();
  const [sort, setSort] = useState<SortKey>("best");
  const comments = allComments(state).filter((c) => c.thread === thread);
  const children = (parent: string | null) =>
    comments
      .filter((c) => c.parentId === parent)
      .sort((a, b) => {
        if (sort === "new") return b.createdAt - a.createdAt;
        const va = votesOf(state, `comment:${a.id}`, a.up, a.down);
        const vb = votesOf(state, `comment:${b.id}`, b.up, b.down);
        if (sort === "top") return vb.up - vb.down - (va.up - va.down);
        return wilson(vb.up, vb.down) - wilson(va.up, va.down);
      });

  const render = (c: Comment): ReactNode => (
    <CommentItem key={c.id} c={c} op={op} thread={thread}>
      {children(c.id).map(render)}
    </CommentItem>
  );

  return (
    <Card className="flex flex-col gap-5 p-5">
      <label className="flex items-center gap-1 text-[13px] font-semibold text-muted">
        Sort by:
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="cursor-pointer bg-transparent font-semibold text-muted outline-none"
        >
          <option value="best">Best</option>
          <option value="top">Top</option>
          <option value="new">New</option>
        </select>
      </label>
      {comments.length === 0 && <p className="text-[14px] text-muted">No comments yet. Start the conversation.</p>}
      {children(null).map(render)}
    </Card>
  );
}

function CommentItem({ c, op, thread, children }: { c: Comment; op: string; thread: string; children: ReactNode }) {
  const { state, actions } = useStore();
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const key = `comment:${c.id}`;
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="flex w-full gap-3">
      <Avatar letter={c.author[0].toUpperCase()} bg={avatarColor(c.author)} />
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold">@{c.author}</span>
          {c.author === op && <Pill tone="blue" className="bg-blue/18">OP</Pill>}
          <span className="text-[12px] text-muted">{timeAgo(c.createdAt)}</span>
        </div>
        <p className="text-[14px] whitespace-pre-wrap text-fg-3">{c.body}</p>
        <div className="flex items-center gap-4">
          <Vote layout="horizontal" compact score={scoreOf(state, key, c.up, c.down)} mine={state.votes[key]} onVote={(d) => actions.vote(key, d)} />
          <button type="button" className="text-[12px] font-semibold text-muted hover:text-fg" onClick={() => setReplying((r) => !r)}>
            Reply
          </button>
          <button
            type="button"
            className="text-[12px] font-semibold text-muted hover:text-fg"
            onClick={() => {
              navigator.clipboard?.writeText(`${location.href.split("#")[0]}#${c.id}`).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Share"}
          </button>
        </div>
        {replying && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              actions.addComment(thread, c.id, text.trim());
              setText("");
              setReplying(false);
            }}
          >
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Reply to @${c.author}…`}
              className="min-w-0 flex-1 rounded-[10px] border border-line bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-muted focus:border-brand/60"
            />
            <Button type="submit" disabled={!text.trim()}>
              Reply
            </Button>
          </form>
        )}
        {hasChildren && (
          <div className="flex w-full gap-4 pl-3">
            <div className="w-[2px] shrink-0 self-stretch bg-line" />
            <div className="flex min-w-0 flex-1 flex-col gap-5">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
