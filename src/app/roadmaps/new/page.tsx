"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button, Card, cx, Pill } from "@/components/ui";
import { ME, poolFor, TYPE_META, type Roadmap, type RoadmapNode, type RoadmapType, type Unit } from "@/lib/data";
import { SKILLS, type Skill } from "@/lib/problems";
import { useStore } from "@/lib/store";

const EXAMPLES: Record<RoadmapType, string> = {
  problems: "# Warm-up\n- Graph basics | graphs | 1250\n- Traversals | graphs | 1350\n\n# Harder\n- Shortest paths | graphs | 1600\n- Knapsack | dp | 1400",
  concepts: "# Foundations\n- Git basics | Commits, branches and merges | https://git-scm.com/book\n- The command line | Navigating, piping and scripting\n\n# Building\n- REST APIs | Resources, verbs and status codes",
  videos: "# Start here\n- Intro lecture | https://www.youtube.com/results?search_query=intro | 60\n- Second lecture | https://www.youtube.com/results?search_query=lecture+2 | 45",
};

const HELP: Record<RoadmapType, string> = {
  problems: `Each node line: "- Title | skill | target rating". Skills: ${Object.keys(SKILLS).join(", ")}. The node draws its problems from the bank near that rating.`,
  concepts: `Each node line: "- Title | summary | optional link".`,
  videos: `Each node line: "- Title | video link | minutes".`,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "roadmap";

/** Parse the outline format into units and nodes. Lines starting with # are units, - are nodes. */
function parseOutline(type: RoadmapType, text: string): { units: Unit[]; errors: string[] } {
  const units: Unit[] = [];
  const errors: string[] = [];
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    if (line.startsWith("#")) {
      units.push({ id: `u${units.length + 1}`, title: line.replace(/^#+/, "").trim() || `Unit ${units.length + 1}`, nodes: [] });
      return;
    }
    if (!line.startsWith("-")) return errors.push(`Line ${i + 1}: start units with "#" and nodes with "-"`);
    if (!units.length) units.push({ id: "u1", title: "Unit 1", nodes: [] });
    const [title, a, b] = line.slice(1).split("|").map((x) => x.trim());
    if (!title) return errors.push(`Line ${i + 1}: node needs a title`);
    const node: RoadmapNode = { id: `${slugify(title)}-${i}`, title };
    if (type === "problems") {
      if (!a || !(a in SKILLS)) return errors.push(`Line ${i + 1}: unknown skill "${a ?? ""}"`);
      node.skill = a as Skill;
      node.target = Number(b) || 1300;
      if (!poolFor(node).length) return errors.push(`Line ${i + 1}: no problems for skill "${a}" yet`);
    } else if (type === "videos") {
      node.url = a;
      node.minutes = Number(b) || 0;
    } else {
      node.summary = a;
      node.url = b;
    }
    units.at(-1)!.nodes.push(node);
  });
  return { units: units.filter((u) => u.nodes.length), errors };
}

export default function NewRoadmap() {
  const { actions } = useStore();
  const router = useRouter();
  const [type, setType] = useState<RoadmapType>("problems");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [outline, setOutline] = useState(EXAMPLES.problems);
  const parsed = useMemo(() => parseOutline(type, outline), [type, outline]);
  const nodeCount = parsed.units.reduce((s, u) => s + u.nodes.length, 0);
  const valid = title.trim() && description.trim() && nodeCount > 0 && parsed.errors.length === 0;

  const submit = () => {
    if (!valid) return;
    const rm: Roadmap = {
      slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: title.trim(),
      description: description.trim(),
      author: ME.handle,
      createdAt: Date.now(),
      up: 0,
      down: 0,
      tags: tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5),
      learners: 0,
      forks: 0,
      units: parsed.units,
    };
    actions.addRoadmap(rm);
    router.push(`/roadmaps/${rm.slug}`);
  };

  const field = "w-full rounded-[10px] border border-line bg-bg px-[14px] py-[10px] text-[14px] text-fg outline-none placeholder:text-muted focus:border-brand/60";

  return (
    <>
      <TopNav active="roadmaps" />
      <main className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 pb-16 pt-7 sm:px-8">
        <h1 className="text-[28px] font-bold">Create a roadmap</h1>
        <Card className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-fg-2">Type</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_META) as RoadmapType[]).map((t) => (
                <Pill
                  key={t}
                  tone={type === t ? TYPE_META[t].tone : "neutral"}
                  onClick={() => {
                    setType(t);
                    setOutline(EXAMPLES[t]);
                  }}
                >
                  {TYPE_META[t].label}
                </Pill>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-fg-2">Title</span>
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Trees for Interviews" maxLength={80} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-fg-2">Description</span>
            <textarea
              className={cx(field, "min-h-[80px]")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will learners be able to do at the end?"
              maxLength={240}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-fg-2">Tags (comma separated, up to 5)</span>
            <input className={field} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="trees, recursion" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-fg-2">Outline</span>
            <span className="text-[12px] text-muted">
              Start each unit with “#”. {HELP[type]}
            </span>
            <textarea
              className={cx(field, "min-h-[200px] font-mono text-[13px] leading-[22px]")}
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              spellCheck={false}
            />
          </label>
          <div className="text-[13px]">
            {parsed.errors.length > 0 ? (
              <ul className="text-red">
                {parsed.errors.slice(0, 4).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">
                Preview: {parsed.units.length} unit{parsed.units.length === 1 ? "" : "s"} · {nodeCount} node{nodeCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={submit} disabled={!valid}>
              Publish roadmap
            </Button>
            <Button variant="secondary" href="/">
              Cancel
            </Button>
          </div>
        </Card>
      </main>
    </>
  );
}
