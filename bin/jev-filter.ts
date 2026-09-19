#!/usr/bin/env -S node --env-file-if-exists=/Users/alexw/git/jev-playground/.env
// jev-filter: keep only the lines that answer YES to a question. Cuts noise BEFORE it reaches an LLM's context.
//
//   gh pr view 123 --comments --json comments | jq -c '.comments[]' | jev-filter "is actionable review feedback, not praise or bot noise"
//   git log --oneline -200 | jev-filter "touches auth or permissions"
//   kubectl logs pod | jev-filter --threshold 0.7 "indicates an error or failed request"
//
// Flags: --threshold 0.5   --invert   --json (emit {line, p})   --context "extra facts for the judge"
import { judgeEach } from '../src/lib/fanout.ts';

const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const has = (n: string) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const threshold = +(flag('--threshold') ?? 0.5);
const context = flag('--context');
const invert = has('--invert');
const asJson = has('--json');
const question = args.join(' ').trim();
if (!question || process.stdin.isTTY) {
  console.error('usage: <lines> | jev-filter [--threshold 0.5] [--invert] [--json] [--context "..."] "question"');
  process.exit(2);
}

const input = await new Response(process.stdin as any).text();
const lines = input.split('\n').filter((l) => l.trim());
if (!lines.length) process.exit(0);

const judged = await judgeEach(lines, question, { context, chunk: 50 });
let kept = 0;
for (const { item, probability } of judged) {
  const yes = probability >= threshold;
  if (yes === !invert) {
    kept++;
    console.log(asJson ? JSON.stringify({ line: item, p: +probability.toFixed(3) }) : item);
  }
}
console.error(`jev-filter: kept ${kept}/${lines.length}`);

for (const ev of ["unhandledRejection", "uncaughtException"] as const) process.on(ev, (e: any) => { console.error(e?.message ?? e); process.exit(1); });
