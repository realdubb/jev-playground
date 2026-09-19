// Real-inbox triage: emails JSON in -> Jev decisions -> filing plan out. Never applies anything.
// usage: node --env-file=.env src/inbox-triage.ts <emails.json> [--out plan.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { jev as evaluate } from './lib/jev.ts';

type Email = { id: string; from_: string; to: string; subject: string; date: string; receivedDaysAgo: number | null; unread: boolean; body: string };
type Row = Email & { action: string; actionP: number; pStay: number; needsReply: number; urgency: number; stale: number; moot: number; file: string; reasons: string[] };

const ACTION = {
  reply: 'a person is waiting on a response from me',
  todo: 'something I need to do or remember, but no reply is expected',
  receipt: 'a payment confirmation, invoice, statement, or receipt',
  newsletter: 'marketing, digest, promotional, or newsletter content',
  archive: 'informational only, nothing to do',
} as const;
const URGENCY = ['none: no deadline, purely informational', 'low: this week is fine', 'medium: today or tomorrow', 'high: within hours, blocks someone else'];

const [file, ...rest] = process.argv.slice(2);
const outPath = rest[rest.indexOf('--out') + 1] || undefined;
const CHUNK = 40;
const emails: Email[] = JSON.parse(readFileSync(file, 'utf8'));
const rows: Row[] = [];
let calls = 0;

// Serial, one HTTP call per CHUNK emails, three questions per email. Two 429 waits max, then stop and report.
// A batch the SDK rejects (e.g. a choice with no clear winner) is split in half; a single email that still fails is surfaced as uncertain.
const failed: Email[] = [];
async function triage(slice: Email[]): Promise<void> {
  const state = {
    context: { today: '2026-09-19', owner: 'Alex Wachira (awach@sent.com, mwa@sent.com, mwangi@sent.com)', notes: ['Calendar notices titled Synced invitation / Updated invitation / Invitation are already on the calendar and need no action.', 'Volunteer scheduling from clients.rotundasoftware.com (church music/tech ministry) asks for a yes/no on a date.'] },
    items: Object.fromEntries(slice.map((e, j) => [`item_${j}`, { from: e.from_, to: e.to, subject: e.subject, receivedDaysAgo: e.receivedDaysAgo, body: e.body }])),
  };
  const questions: Record<string, any> = {};
  slice.forEach((_, j) => {
    questions[`action_${j}`] = { type: 'choice', instructions: `For items.item_${j}: what should I do with this email?`, criteria: ACTION };
    questions[`reply_${j}`] = { type: 'boolean', instructions: `For items.item_${j}: does the sender expect a written reply from me?` };
    questions[`urgency_${j}`] = { type: 'score', instructions: `For items.item_${j}: how time sensitive is this email?`, criteria: URGENCY };
    questions[`moot_${j}`] = { type: 'boolean', instructions: `For items.item_${j}: given it arrived receivedDaysAgo days ago, is whatever it asked for almost certainly already handled, past, or moot by now?` };
    questions[`stale_${j}`] = { type: 'boolean', instructions: `For items.item_${j}: is this email worthless after about a day (one-time code, sign-in code, delivery notice, same-day reminder, expired offer)?` };
  });
  let answers: any;
  try {
    ({ answers } = await evaluate({ model: 'typesafe-ai/jev', state, questions }, { waits: [10_000, 30_000] }));
    calls++;
  } catch (err: any) {
    const status = err?.statusCode ?? err?.cause?.statusCode;
    if (status === 429 || /rate limit/i.test(err?.message ?? '') || /AI_GATEWAY_API_KEY/.test(err?.message ?? '')) throw err;
    if (slice.length === 1) { console.error(`  item ${slice[0].id} failed: ${err?.message}`); failed.push(slice[0]); return; }
    console.error(`  batch of ${slice.length} rejected (${String(err?.message).slice(0, 80)}), splitting`);
    const mid = Math.ceil(slice.length / 2);
    await triage(slice.slice(0, mid)); await triage(slice.slice(mid));
    return;
  }
  slice.forEach((e, j) => {
    const a = answers[`action_${j}`];
    const pStay = (a.probabilities.todo ?? 0) + (a.probabilities.reply ?? 0);
    const stale = answers[`stale_${j}`].probability;
    const expired = stale > 0.7 && (e.receivedDaysAgo ?? 0) > 1;
    const moot = answers[`moot_${j}`].probability;
    const row: Row = { ...e, action: a.choice, actionP: a.probabilities[a.choice], pStay, needsReply: answers[`reply_${j}`].probability, urgency: answers[`urgency_${j}`].score, stale, moot, file: '', reasons: [] };
    if (expired) row.file = 'archive (expired)';
    else if (row.action === 'receipt' && row.actionP >= 0.7) row.file = 'Receipts';
    else if (row.action !== 'reply' && moot > 0.85 && (e.receivedDaysAgo ?? 0) > 21) row.file = 'archive (moot)';
    else if (row.action === 'reply') { row.file = 'inbox'; row.reasons.push('action=reply'); }
    else {
      if (row.urgency >= 2) row.reasons.push(`urgency=${row.urgency.toFixed(1)}`);
      if (pStay > 0.35 && pStay < 0.65) row.reasons.push(`stay p=${pStay.toFixed(2)}`);
      if (pStay >= 0.5 && row.needsReply > 0.4 && row.needsReply < 0.6) row.reasons.push(`reply p=${row.needsReply.toFixed(2)}`);
      row.file = row.action === 'todo' ? 'inbox, label Todo' : row.action === 'receipt' ? 'Receipts' : 'archive';
    }
    rows.push(row);
  });
}
try {
  for (let i = 0; i < emails.length; i += CHUNK) {
    await triage(emails.slice(i, i + CHUNK));
    console.error(`progress: ${rows.length + failed.length}/${emails.length} (${calls} calls)`);
  }
} catch (err: any) {
  console.error(`STOPPED after ${rows.length}/${emails.length}: ${err?.message ?? err}`);
}
for (const e of failed) rows.push({ ...e, action: 'archive', actionP: 0, pStay: 0.5, needsReply: 0.5, urgency: 0, stale: 0, moot: 0, file: 'inbox', reasons: ['jev could not decide'] });

const surface = rows.filter((r) => r.reasons.length);
const auto = rows.filter((r) => !r.reasons.length);
const counts = (rs: Row[]) => Object.entries(rs.reduce((m, r) => ((m[r.action] = (m[r.action] ?? 0) + 1), m), {} as Record<string, number>)).map(([k, v]) => `${k}=${v}`).join(' ');

console.log(`\n== JEV TRIAGE: ${rows.length} emails, ${calls} calls ==`);
console.log(`surface to human: ${surface.length}   auto-file: ${auto.length}  (${counts(auto)}; expired=${auto.filter((r) => r.file.startsWith('archive (expired')).length})`);
console.log(`\n-- SURFACE (${surface.length}) --`);
for (const r of surface.sort((a, b) => b.urgency - a.urgency || b.needsReply - a.needsReply))
  console.log(`${r.id.padStart(6)} ${(r.date || '').slice(0, 10)} ${r.action.padEnd(10)} u=${r.urgency.toFixed(1)} rp=${r.needsReply.toFixed(2)} ${r.from_.slice(0, 34).padEnd(34)} ${r.subject.slice(0, 60)}  [${r.reasons.join(', ')}]`);
console.log(`\n-- AUTO-FILE PLAN (${auto.length}) --`);
const targets = [...new Set(auto.map((r) => r.file))];
for (const t of targets) {
  const g = auto.filter((r) => r.file === t);
  const bySender = Object.entries(g.reduce((m, r) => ((m[r.from_] = (m[r.from_] ?? 0) + 1), m), {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);
  console.log(`\n${t}: ${g.length}`);
  for (const [sn, n] of bySender.slice(0, 15)) console.log(`   ${String(n).padStart(3)}  ${sn.slice(0, 70)}`);
  if (bySender.length > 15) console.log(`   ... ${bySender.length - 15} more senders`);
}
if (outPath) writeFileSync(outPath, JSON.stringify({ surface, auto }, null, 1));
for (const ev of ['unhandledRejection', 'uncaughtException'] as const) process.on(ev, (e: any) => { console.error(e?.message ?? e); process.exit(1); });
