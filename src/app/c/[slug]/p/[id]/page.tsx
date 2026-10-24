"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CommentThread, CommunityHeader, CommunityShell, NewPostDialog, PostCard } from "@/components/Community";
import { CommunityTabs } from "@/components/CommunityTabs";
import { TopNav } from "@/components/TopNav";
import { Button, Card } from "@/components/ui";
import { COMMUNITY_BY_SLUG } from "@/lib/data";
import { allComments, allPosts, useStore } from "@/lib/store";

export default function PostPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const { state, actions } = useStore();
  const router = useRouter();
  const [text, setText] = useState("");
  const [composing, setComposing] = useState(false);
  const c = COMMUNITY_BY_SLUG[slug];
  const post = allPosts(state).find((p) => p.id === id && p.community === slug);

  if (!c || !post) {
    return (
      <>
        <TopNav active="communities" />
        <p className="p-10 text-center text-muted">
          Post not found.{" "}
          <Link href={c ? `/c/${slug}` : "/c/internships"} className="text-brand">
            Back to the community
          </Link>
        </p>
      </>
    );
  }

  const thread = `post:${post.id}`;
  const count = allComments(state).filter((x) => x.thread === thread).length;

  return (
    <CommunityShell c={c}>
      <CommunityHeader c={c} onNewPost={() => setComposing(true)} />
      <CommunityTabs c={c} tab="hot" flairs={[]} />
      <PostCard post={post} comments={count} expanded />
      <Card className="py-[10px] pl-4 pr-[10px]">
        <form
          className="flex items-center gap-3"
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
            aria-label="Add a comment"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
          />
          <Button type="submit" disabled={!text.trim()}>
            Comment
          </Button>
        </form>
      </Card>
      <CommentThread thread={thread} op={post.author} />
      {composing && (
        <NewPostDialog c={c} onClose={() => setComposing(false)} onCreated={(p) => router.push(`/c/${c.slug}/p/${p.id}`)} />
      )}
    </CommunityShell>
  );
}
