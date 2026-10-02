"use client";

type Op<T> = { kind: "same" | "add" | "del"; value: T };

/** Longest-common-subsequence diff. Inputs here are small (paragraphs, words). */
function diff<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean = (x, y) => x === y): Op<T>[] {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Op<T>[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (eq(a[i], b[j])) {
      out.push({ kind: "same", value: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ kind: "del", value: a[i++] });
    else out.push({ kind: "add", value: b[j++] });
  }
  while (i < n) out.push({ kind: "del", value: a[i++] });
  while (j < m) out.push({ kind: "add", value: b[j++] });
  return out;
}

const blocks = (md: string) =>
  md
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/** A rewritten paragraph: show the words that changed inside it. */
function WordDiff({ before, after }: { before: string; after: string }) {
  const ops = diff(before.split(/(\s+)/), after.split(/(\s+)/));
  return (
    <p className="whitespace-pre-wrap">
      {ops.map((o, k) =>
        o.kind === "same" ? (
          <span key={k}>{o.value}</span>
        ) : o.kind === "add" ? (
          <ins key={k} className="bg-teal-dim text-teal no-underline">{o.value}</ins>
        ) : (
          <del key={k} className="bg-red-dim text-red">{o.value}</del>
        ),
      )}
    </p>
  );
}

/**
 * What the writer changed since the piece was sent back: paragraphs added,
 * removed or rewritten (with the changed words marked). Unchanged stretches
 * are folded away.
 */
export function ReviewDiff({ before, after }: { before: string; after: string }) {
  const ops = diff(blocks(before), blocks(after));
  if (!ops.some((o) => o.kind !== "same")) {
    return <p className="text-[13px] text-muted">No changes to the text since you sent it back.</p>;
  }

  const rows: React.ReactNode[] = [];
  for (let k = 0; k < ops.length; k++) {
    const o = ops[k];
    if (o.kind === "same") {
      let run = 0;
      while (k + run < ops.length && ops[k + run].kind === "same") run++;
      rows.push(
        <p key={`s${k}`} className="font-mono text-[11px] text-muted">
          {run} unchanged {run === 1 ? "paragraph" : "paragraphs"}
        </p>,
      );
      k += run - 1;
      continue;
    }
    // A deletion followed by an addition is usually the same paragraph, edited.
    const next = ops[k + 1];
    if (o.kind === "del" && next?.kind === "add") {
      rows.push(
        <div key={`e${k}`} className="rounded border-l-2 border-gold bg-surface-1 px-3 py-2">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-gold">Edited</p>
          <WordDiff before={o.value} after={next.value} />
        </div>,
      );
      k++;
      continue;
    }
    rows.push(
      <div
        key={`${o.kind}${k}`}
        className={`rounded border-l-2 px-3 py-2 ${o.kind === "add" ? "border-teal bg-teal-dim" : "border-red bg-red-dim"}`}
      >
        <p className={`mb-1 font-mono text-[10px] uppercase tracking-[1.5px] ${o.kind === "add" ? "text-teal" : "text-red"}`}>
          {o.kind === "add" ? "Added" : "Removed"}
        </p>
        <p className={`whitespace-pre-wrap ${o.kind === "del" ? "line-through opacity-75" : ""}`}>{o.value}</p>
      </div>,
    );
  }
  return <div className="flex flex-col gap-2 text-[13px] leading-relaxed">{rows}</div>;
}
