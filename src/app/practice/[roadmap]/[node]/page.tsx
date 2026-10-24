"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, cx, Icon, Pill, Progress } from "@/components/ui";
import { allNodes, poolFor, type Roadmap, type RoadmapNode } from "@/lib/data";
import { difficultyLabel, pickNext, skippable, updateRating } from "@/lib/elo";
import { jetbrains } from "@/lib/fonts";
import { PROBLEM_BY_ID, SKILLS, starterCode, type Problem } from "@/lib/problems";
import { preloadPython, runPython, type RunResult } from "@/lib/pyrunner";
import { dailyXp, emptyLesson, findRoadmap, nodeStatuses, useStore, type LessonState } from "@/lib/store";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-code text-[13px] text-muted">Loading editor…</div>,
});

const BASE_XP = 15;
const HINT_COST = 5;

type Feedback =
  | { kind: "pass"; problem: Problem; xp: number; before: number; after: number; next: Problem | null; skipped: number }
  | { kind: "fail"; problem: Problem; failed: number; total: number; before: number; after: number; error: boolean };

export default function LessonPage() {
  const { roadmap: slug, node: nodeId } = useParams<{ roadmap: string; node: string }>();
  const { state } = useStore();
  const rm = findRoadmap(state, slug);
  const node = rm && allNodes(rm).find((n) => n.id === nodeId);

  if (!rm || !node || !poolFor(node).length) {
    return (
      <Centered>
        <p className="text-muted">This lesson doesn’t exist.</p>
        <Button href="/">Back to roadmaps</Button>
      </Centered>
    );
  }
  if (nodeStatuses(rm, state.progress[slug]).get(node.id) === "locked") {
    return (
      <Centered>
        <p className="text-[20px] font-bold">{node.title} is locked</p>
        <p className="text-muted">Finish the earlier nodes in this roadmap first.</p>
        <Button href={`/roadmaps/${slug}`}>Back to roadmap</Button>
      </Centered>
    );
  }
  return <Lesson rm={rm} node={node} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">{children}</div>;
}

function Lesson({ rm, node }: { rm: Roadmap; node: RoadmapNode }) {
  const { state, actions } = useStore();
  const router = useRouter();
  const pool = poolFor(node);
  const skill = node.skill ?? pool[0].skill;
  const rating = state.ratings[skill];
  const lesson: LessonState = state.progress[rm.slug]?.lessons[node.id] ?? emptyLesson();
  const done = new Set([...lesson.solved, ...lesson.skipped]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    actions.startRoadmap(rm.slug);
    preloadPython();
  }, [actions, rm.slug]);

  // Keep the assigned problem stable across attempts; otherwise pick the best match for the current rating.
  const assigned = lesson.currentPid && !done.has(lesson.currentPid) ? PROBLEM_BY_ID[lesson.currentPid] : null;
  const next = assigned ?? pickNext(pool, rating, done);
  const problem = feedback?.problem ?? next;

  useEffect(() => {
    if (next && lesson.currentPid !== next.id && !feedback) {
      actions.updateLesson(rm.slug, node.id, (l) => ({ ...l, currentPid: next.id }));
    }
  }, [next, lesson.currentPid, feedback, actions, rm.slug, node.id]);

  const grade = (p: Problem, result: { passed: number; total: number; error: boolean }) => {
    const attempts = lesson.attempts[p.id] ?? 0;
    const before = rating;
    if (result.passed < result.total) {
      // Only the first miss on a problem counts against the rating, so retrying isn't punished twice.
      const after = attempts === 0 ? updateRating(before, p.rating, 0) : before;
      if (after !== before) actions.setRating(skill, after);
      actions.loseHeart();
      actions.updateLesson(rm.slug, node.id, (l) => ({ ...l, attempts: { ...l.attempts, [p.id]: attempts + 1 } }));
      setFeedback({ kind: "fail", problem: p, failed: result.total - result.passed, total: result.total, before, after, error: result.error });
      return;
    }
    const firstTry = attempts === 0;
    const after = firstTry ? updateRating(before, p.rating, 1) : before;
    if (after !== before) actions.setRating(skill, after);
    const xp = BASE_XP - (lesson.hinted.includes(p.id) ? HINT_COST : 0);
    actions.earnXp(xp);
    const solvedSet = new Set([...done, p.id]);
    const skip = firstTry ? skippable(pool, p, solvedSet) : [];
    const upcoming = pickNext(pool, after, new Set([...solvedSet, ...skip]));
    actions.updateLesson(
      rm.slug,
      node.id,
      (l) => ({
        ...l,
        solved: [...l.solved, p.id],
        skipped: [...l.skipped, ...skip],
        currentPid: upcoming?.id,
        history: [...l.history, { pid: p.id, firstTry, before, after, at: Date.now() }],
      }),
      !upcoming,
    );
    setFeedback({ kind: "pass", problem: p, xp, before, after, next: upcoming, skipped: skip.length });
  };

  const nodes = allNodes(rm);
  const nextNode = nodes[nodes.findIndex((n) => n.id === node.id) + 1];
  const progress = done.size / pool.length;

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <header className="flex items-center gap-5 px-4 py-5 sm:px-8">
        <Link href={`/roadmaps/${rm.slug}`} className="rounded-[8px] p-1 hover:bg-raised" aria-label="Close lesson">
          <Icon name="close" size={24} />
        </Link>
        <Progress value={progress} height={14} className="max-w-[1100px] flex-1" />
        <span className="ml-auto flex items-center gap-[6px]" title="Hearts: you lose one for each wrong submission">
          <Icon name="heart" size={20} />
          <span className="text-[15px] font-bold text-red">{state.hearts}</span>
        </span>
        <span className="flex items-center gap-[6px]" title="XP earned today">
          <Icon name="bolt-md" size={20} />
          <span className="text-[15px] font-bold text-yellow">{dailyXp(state)}</span>
        </span>
      </header>

      {problem ? (
        <ProblemView
          key={problem.id}
          problem={problem}
          unitLabel={`Unit ${rm.units.findIndex((u) => u.nodes.includes(node)) + 1} · ${node.title}`}
          position={`${Math.min(done.size + (feedback?.kind === "pass" ? 0 : 1), pool.length)} of ${pool.length}`}
          why={whyPicked(lesson, problem, rating)}
          locked={!!feedback}
          hinted={lesson.hinted.includes(problem.id)}
          onHint={() => actions.updateLesson(rm.slug, node.id, (l) => ({ ...l, hinted: [...l.hinted, problem.id] }))}
          onGrade={(r) => grade(problem, r)}
        />
      ) : (
        <main className="flex flex-1 items-center justify-center p-8">
          <Card className="flex max-w-[480px] flex-col items-center gap-4 p-8 text-center">
            <span className="flex size-[72px] items-center justify-center rounded-full bg-brand shadow-[0_4px_0_0_var(--color-brand-deep)]">
              <Icon name="node-check" size={32} />
            </span>
            <h1 className="text-[24px] font-bold">{node.title} complete!</h1>
            <p className="text-[14px] text-fg-2">
              You solved {lesson.solved.length} problem{lesson.solved.length === 1 ? "" : "s"}
              {lesson.skipped.length > 0 && ` and tested out of ${lesson.skipped.length} warm-up${lesson.skipped.length === 1 ? "" : "s"}`}. Your{" "}
              {SKILLS[skill]} rating is now <b className="text-brand">{rating}</b>.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {nextNode && poolFor(nextNode).length > 0 && (
                <Button onClick={() => router.push(`/practice/${rm.slug}/${nextNode.id}`)}>Next: {nextNode.title}</Button>
              )}
              <Button variant="secondary" href={`/roadmaps/${rm.slug}`}>
                Back to roadmap
              </Button>
              <Button
                variant="secondary"
                onClick={() => actions.updateLesson(rm.slug, node.id, (l) => ({ ...emptyLesson(), history: l.history }))}
              >
                Practice again
              </Button>
            </div>
          </Card>
        </main>
      )}

      {feedback && (
        <FeedbackBar
          fb={feedback}
          skillName={SKILLS[skill]}
          hearts={state.hearts}
          onContinue={() => setFeedback(null)}
        />
      )}
    </div>
  );
}

function whyPicked(lesson: LessonState, p: Problem, rating: number) {
  const hist = lesson.history.filter((h) => h.pid !== p.id);
  const last = hist.at(-1);
  if (!last) return `Picked for you: the closest match to your current rating (${rating}) in this node’s problem pool.`;
  const prev = PROBLEM_BY_ID[last.pid];
  let run = 0;
  for (let i = hist.length - 1; i >= 0 && hist[i].firstTry; i--) run++;
  const words = ["", "one", "two", "three", "four", "five"];
  if (last.firstTry && p.rating > prev.rating) {
    const what = run > 1 ? `solved ${words[run] ?? run} problems in a row on the first try` : `solved ${prev.title} on the first try`;
    return `Picked for you: you ${what}, so difficulty moved up from ${difficultyLabel(prev.rating)} (${prev.rating}) to ${difficultyLabel(p.rating)} (${p.rating}).`;
  }
  if (!last.firstTry) {
    return `Picked for you: ${prev.title} took a few tries, so this one stays close to your level at ${difficultyLabel(p.rating)} (${p.rating}).`;
  }
  return `Picked for you: the next-closest match to your rating (${rating}) in this node’s pool.`;
}

function ProblemView({
  problem: p,
  unitLabel,
  position,
  why,
  locked,
  hinted,
  onHint,
  onGrade,
}: {
  problem: Problem;
  unitLabel: string;
  position: string;
  why: string;
  locked: boolean;
  hinted: boolean;
  onHint: () => void;
  onGrade: (r: { passed: number; total: number; error: boolean }) => void;
}) {
  const { state, actions } = useStore();
  const [code, setCode] = useState(() => state.drafts[p.id] ?? starterCode(p));
  const [result, setResult] = useState<{ res: RunResult; submit: boolean } | null>(null);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const exec = useCallback(
    async (submit: boolean) => {
      if (busy) return;
      setBusy(submit ? "submit" : "run");
      const tests = submit ? p.tests : p.tests.filter((t) => !t.hidden);
      const res = await runPython(code, p.fn, tests);
      setBusy(null);
      setResult({ res, submit });
      if (submit) {
        const passed = res.error ? 0 : res.tests.filter((t) => t.ok).length;
        onGrade({ passed, total: tests.length, error: !!res.error });
      }
    },
    [busy, code, p, onGrade],
  );
  const execRef = useRef(exec);
  useEffect(() => {
    execRef.current = exec;
  }, [exec]);

  const outOfHearts = state.hearts <= 0;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-6 sm:px-8 lg:min-h-0 lg:flex-row">
      <Card className="flex flex-col gap-4 p-6 lg:w-[520px] lg:shrink-0 lg:overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          <Pill tone="blue" className="bg-blue/18">
            {unitLabel}
          </Pill>
          <Pill tone="orange">
            {difficultyLabel(p.rating)} · {p.rating}
          </Pill>
          <Pill>{position}</Pill>
        </div>
        <h1 className="text-[26px] font-bold">{p.title}</h1>
        <p className="text-[15px] text-fg-2">{p.statement}</p>
        <div className="flex flex-col gap-1 rounded-[10px] bg-code px-[14px] py-3">
          <p className="text-[12px] font-bold text-muted">Example 1</p>
          <pre className="font-mono text-[13px] leading-[22px] whitespace-pre-wrap text-fg">
            {`Input:  ${p.example.input.replace(/\n/g, "\n        ")}\nOutput: ${p.example.output}`}
          </pre>
        </div>
        <p className="text-[14px] font-bold">Constraints</p>
        <ul className="text-[14px] text-fg-2">
          {p.constraints.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
        <div className="flex items-start gap-[10px] rounded-[10px] bg-purple/12 px-[14px] py-3">
          <Icon name="bolt-purple" size={18} />
          <p className="flex-1 text-[13px] font-medium text-fg">{why}</p>
        </div>
        <span className="flex-1" />
        {hinted ? (
          <div className="rounded-[10px] border border-yellow/30 bg-yellow/10 px-[14px] py-3 text-[13px] text-fg">
            <b className="text-yellow">Hint:</b> {p.hint}
          </div>
        ) : (
          <Button
            variant="secondary"
            className="self-start whitespace-pre"
            onClick={onHint}
          >
            {`Show hint  (−${HINT_COST} XP)`}
          </Button>
        )}
      </Card>

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0">
        <Card className="flex h-[440px] flex-col overflow-hidden lg:h-auto lg:min-h-0 lg:flex-1">
          <div className="flex items-center gap-2 bg-raised px-4 py-[10px]">
            <span className="text-[13px] font-semibold">solution.py</span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => {
                if (confirm("Reset your code to the starter template?")) setCode(starterCode(p));
              }}
              className="rounded-[8px] px-2 py-1 text-[12px] font-semibold text-muted hover:text-fg"
            >
              Reset
            </button>
            <span
              className="flex items-center gap-1 rounded-[8px] bg-bg py-1 pl-[10px] pr-2 text-[12px] font-semibold text-fg-2"
              title="More languages are coming soon"
            >
              Python 3
              <Icon name="chevron-down" size={14} />
            </span>
          </div>
          <div className="min-h-0 flex-1 bg-code">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              theme="devpath"
              onChange={(v) => {
                const next = v ?? "";
                setCode(next);
                clearTimeout(draftTimer.current);
                draftTimer.current = setTimeout(() => actions.saveDraft(p.id, next), 500);
              }}
              beforeMount={(monaco) => {
                monaco.editor.defineTheme("devpath", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [
                    { token: "keyword", foreground: "a78bfa" },
                    { token: "number", foreground: "ff7a45" },
                    { token: "string", foreground: "3ddc84" },
                    { token: "comment", foreground: "4a5064", fontStyle: "italic" },
                    { token: "identifier", foreground: "e8eaf0" },
                    { token: "delimiter", foreground: "e8eaf0" },
                  ],
                  colors: {
                    "editor.background": "#0b0d12",
                    "editor.foreground": "#e8eaf0",
                    "editorLineNumber.foreground": "#4a5064",
                    "editorLineNumber.activeForeground": "#8c92a3",
                    "editor.lineHighlightBackground": "#161922",
                    "editorCursor.foreground": "#3ddc84",
                    "editor.selectionBackground": "#2a2f3d",
                  },
                });
              }}
              onMount={(editor, monaco) => {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => execRef.current(false));
              }}
              options={{
                fontFamily: jetbrains.style.fontFamily,
                fontSize: 13,
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                tabSize: 4,
                insertSpaces: true,
                renderLineHighlight: "line",
                overviewRulerLanes: 0,
                lineNumbersMinChars: 3,
                automaticLayout: true,
                readOnly: locked,
              }}
            />
          </div>
        </Card>

        <Card className="flex shrink-0 flex-col gap-[10px] p-5">
          <div className="flex items-center">
            <p className="text-[15px] font-bold">Test results</p>
            <span className="flex-1" />
            {result && !result.res.error && (
              <Pill tone={result.res.tests.every((t) => t.ok) ? "green" : "red"}>
                {result.res.tests.filter((t) => t.ok).length} / {result.res.tests.length} passed
              </Pill>
            )}
            {result?.res.error && <Pill tone="red">Error</Pill>}
          </div>
          <TestResults problem={p} result={result} busy={busy} />
          <div className="flex flex-wrap items-center gap-[10px]">
            <p className="text-[12px] text-muted">
              {outOfHearts ? "Out of hearts — they refill tomorrow. You can still Run." : "Runs in your browser · ⌘/Ctrl + Enter to run"}
            </p>
            <span className="flex-1" />
            <Button variant="secondary" onClick={() => exec(false)} disabled={!!busy || locked}>
              {busy === "run" ? "Running…" : "Run"}
            </Button>
            <Button onClick={() => exec(true)} disabled={!!busy || locked || outOfHearts}>
              {busy === "submit" ? "Checking…" : "Submit"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TestResults({ problem: p, result, busy }: { problem: Problem; result: { res: RunResult; submit: boolean } | null; busy: string | null }) {
  if (busy && !result) return <p className="text-[13px] text-muted">Starting Python… the first run downloads it (~10 MB), then it’s instant.</p>;
  if (!result) return <p className="text-[13px] text-muted">Run checks the examples. Submit also runs hidden tests.</p>;
  const { res, submit } = result;
  if (res.error) {
    return <pre className="max-h-40 overflow-auto rounded-[8px] bg-code p-3 font-mono text-[12px] whitespace-pre-wrap text-red">{res.error}</pre>;
  }
  const visible = p.tests.filter((t) => !t.hidden);
  const hiddenOutcomes = submit ? res.tests.slice(visible.length) : [];
  const ms = (x: number) => `${Math.max(1, Math.round(x))} ms`;
  const Line = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <div className="flex items-center gap-[10px] text-[13px] text-fg-2">
      {ok ? (
        <Icon name="test-pass" size={16} />
      ) : (
        <span className="flex size-4 shrink-0 items-center justify-center text-[13px] font-bold text-red">✕</span>
      )}
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
  return (
    <div className={cx("flex flex-col gap-[10px]", busy && "opacity-50")}>
      {visible.map((t, i) => {
        const o = res.tests[i];
        if (!o) return null;
        return (
          <Line key={i} ok={o.ok}>
            {o.ok
              ? `Example ${i + 1} — output ${o.got} (${ms(o.ms)})`
              : o.error
                ? `Example ${i + 1} — ${o.error}`
                : `Example ${i + 1} — expected ${JSON.stringify(t.expected)}, got ${o.got}`}
          </Line>
        );
      })}
      {hiddenOutcomes.length > 0 &&
        (() => {
          const failed = hiddenOutcomes.filter((o) => !o.ok).length;
          const total = hiddenOutcomes.reduce((a, o) => a + o.ms, 0);
          return (
            <Line ok={failed === 0}>
              Hidden tests ({hiddenOutcomes.length}) — {failed === 0 ? `passed (${ms(total)})` : `${failed} failed`}
            </Line>
          );
        })()}
      {res.stdout.trim() && (
        <pre className="max-h-28 overflow-auto rounded-[8px] bg-code p-3 font-mono text-[12px] whitespace-pre-wrap text-fg-2">{res.stdout.trim()}</pre>
      )}
    </div>
  );
}

function FeedbackBar({ fb, skillName, hearts, onContinue }: { fb: Feedback; skillName: string; hearts: number; onContinue: () => void }) {
  const pass = fb.kind === "pass";
  const ratingText =
    fb.before === fb.after ? `${skillName} rating ${fb.after} (unchanged after a retry)` : `${skillName} rating ${fb.before} → ${fb.after}`;
  const sub = pass
    ? [
        `+${fb.xp} XP`,
        ratingText,
        fb.skipped > 0 && `Tested out of ${fb.skipped} warm-up${fb.skipped > 1 ? "s" : ""}`,
        fb.next ? `Next problem: ${difficultyLabel(fb.next.rating)} (~${fb.next.rating})` : "Node complete!",
      ]
    : [`−1 heart (${hearts} left)`, fb.after !== fb.before && ratingText, "Fix it and submit again, or show a hint"];

  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-4 border-t px-4 py-5 sm:px-8",
        pass ? "border-brand/40 bg-brand/10" : "border-red/40 bg-red/10",
      )}
      role="status"
    >
      <span className={cx("flex size-[52px] shrink-0 items-center justify-center rounded-full", pass ? "bg-brand" : "bg-red")}>
        {pass ? <Icon name="feedback-check" size={28} /> : <span className="text-[24px] font-bold text-ink-2">✕</span>}
      </span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        <p className={cx("text-[20px] font-bold", pass ? "text-brand" : "text-red")}>
          {pass
            ? "Nice work! All tests passed."
            : fb.error
              ? "Your code raised an error."
              : `Not quite — ${fb.failed} of ${fb.total} test${fb.total > 1 ? "s" : ""} failed.`}
        </p>
        <p className="text-[14px] whitespace-pre-wrap text-fg">{sub.filter(Boolean).join("  ·  ")}</p>
      </div>
      <span className="flex-1" />
      {pass ? (
        <Button size="lg" onClick={onContinue} autoFocus>
          Continue
        </Button>
      ) : (
        <Button variant="secondary" size="lg" onClick={onContinue} autoFocus>
          Got it
        </Button>
      )}
    </div>
  );
}
