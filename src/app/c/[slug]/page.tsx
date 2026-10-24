"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CommunityHeader, CommunityShell, NewPostDialog, PostCard } from "@/components/Community";
import { CommunityTabs, TABS, type Tab } from "@/components/CommunityTabs";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/ui";
import { COMMUNITY_BY_SLUG } from "@/lib/data";
import { hot, POST_DECAY, wilson } from "@/lib/ranking";
import { allComments, allPosts, useStore, votesOf } from "@/lib/store";

function CommunityFeed() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { state } = useStore();
  const [flairs, setFlairs] = useState<string[]>([]);
  const [composing, setComposing] = useState(false);
  const c = COMMUNITY_BY_SLUG[slug];
  if (!c) {
    return (
      <>
        <TopNav active="communities" />
        <p className="p-10 text-center text-muted">
          No community called c/{slug}.{" "}
          <Link href="/c/internships" className="text-brand">
            Browse c/internships
          </Link>
        </p>
      </>
    );
  }

  const tab = (TABS.includes(params.get("tab") as Tab) ? params.get("tab") : "hot") as Tab;
  const comments = allComments(state);
  const posts = allPosts(state)
    .filter((p) => p.community === c.slug && (flairs.length === 0 || flairs.includes(p.flair)))
    .map((p) => ({ p, v: votesOf(state, `post:${p.id}`, p.up, p.down) }))
    .sort((a, b) => {
      if (tab === "new") return b.p.createdAt - a.p.createdAt;
      if (tab === "top") return wilson(b.v.up, b.v.down) - wilson(a.v.up, a.v.down);
      return hot(b.v.up, b.v.down, b.p.createdAt, POST_DECAY) - hot(a.v.up, a.v.down, a.p.createdAt, POST_DECAY);
    });

  return (
    <CommunityShell c={c}>
      <CommunityHeader c={c} onNewPost={() => setComposing(true)} />
      <CommunityTabs
        c={c}
        tab={tab}
        flairs={flairs}
        onTab={(t) => router.replace(`/c/${c.slug}${t === "hot" ? "" : `?tab=${t}`}`, { scroll: false })}
        onFlair={(f) => setFlairs((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]))}
      />
      {tab === "wiki" ? (
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="text-[20px] font-bold">c/{c.slug} wiki</h2>
          <p className="text-[15px] text-fg-2">{c.about}</p>
          <h3 className="pt-2 text-[15px] font-bold">Rules</h3>
          <ol className="list-decimal pl-5 text-[14px] text-fg-2">
            {c.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <h3 className="pt-2 text-[15px] font-bold">Flairs</h3>
          <p className="text-[14px] text-fg-2">{c.flairs.map((f) => f.name).join(" · ")}</p>
        </Card>
      ) : posts.length ? (
        posts.map(({ p }) => <PostCard key={p.id} post={p} comments={comments.filter((x) => x.thread === `post:${p.id}`).length} />)
      ) : (
        <div className="rounded-[14px] border border-dashed border-line p-10 text-center text-[14px] text-muted">
          No posts here yet. Be the first!
        </div>
      )}
      {composing && (
        <NewPostDialog c={c} onClose={() => setComposing(false)} onCreated={(p) => router.push(`/c/${c.slug}/p/${p.id}`)} />
      )}
    </CommunityShell>
  );
}

export default function Page() {
  return (
    <Suspense>
      <CommunityFeed />
    </Suspense>
  );
}
