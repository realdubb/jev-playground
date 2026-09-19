// GitHub pruner: classify your repos and stars, print a plan, emit commands. Never runs destructive commands.
// Usage: pnpm prune            -> plan only
//        pnpm prune -- --json  -> machine readable
import { execFileSync } from 'node:child_process';
import { classifyEach } from './lib/fanout.ts';

const gh = (args: string[]) => JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64e6 }));
const days = (iso: string) => Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
const json = process.argv.includes('--json');

const owner = gh(['api', 'user']).login;

// Jev is not a calculator: precompute ages and sizes; give it plain facts.
const repos = gh([
  'repo', 'list', owner, '--limit', '300', '--json',
  'name,description,isFork,isArchived,isPrivate,pushedAt,createdAt,stargazerCount,forkCount,primaryLanguage,diskUsage,parent',
]).map((r: any) => ({
  name: r.name,
  description: r.description || '(none)',
  language: r.primaryLanguage?.name ?? 'none',
  private: r.isPrivate,
  fork: r.isFork,
  forkOf: r.parent?.nameWithOwner,
  archived: r.isArchived,
  stars: r.stargazerCount,
  forks: r.forkCount,
  ageYears: +(days(r.createdAt) / 365).toFixed(1),
  yearsSinceLastPush: +(days(r.pushedAt) / 365).toFixed(1),
  sizeMB: +(r.diskUsage / 1024).toFixed(1),
}));

const stars = gh(['api', 'user/starred?per_page=100', '--paginate']).map((s: any) => ({
  repo: s.full_name,
  description: s.description || '(none)',
  language: s.language ?? 'none',
  stars: s.stargazers_count,
  archived: s.archived,
  yearsSinceLastPush: +(days(s.pushed_at) / 365).toFixed(1),
}));

const profile = {
  owner,
  role: 'TypeScript/React + Node engineer at a benefits fintech; builds macOS/iOS side projects in Swift; heavy Claude Code and dotfiles tinkerer',
  currentInterests: ['TypeScript', 'React', 'NestJS', 'Swift/SwiftUI', 'Claude Code tooling', 'dotfiles', 'personal productivity apps'],
  staleThreshold: 'anything untouched for 3+ years with no stars and no description is probably dead',
};

const repoPlan = await classifyEach(
  repos.filter((r: any) => !r.archived),
  'What should the owner do with this repository?',
  {
    keep: 'active, referenced by other work, or has external users (stars/forks)',
    archive: 'finished or abandoned but worth keeping read-only for reference',
    delete: 'empty, throwaway, duplicate starter, or a fork with no changes and no purpose',
  },
  { context: profile },
);

const starPlan = await classifyEach(
  stars,
  'Should the owner keep this star?',
  {
    keep: 'still relevant to current interests or a reference worth finding again',
    unstar: 'obsolete, unmaintained, or unrelated to anything the owner works on now',
  },
  { context: profile },
);

if (json) {
  console.log(JSON.stringify({ repos: repoPlan, stars: starPlan }, null, 2));
  process.exit(0);
}

const pct = (n: number) => `${Math.round(n * 100)}%`.padStart(4);
console.log(`\n== Repos (${repoPlan.length})`);
for (const r of repoPlan.sort((a, b) => a.choice.localeCompare(b.choice) || b.probability - a.probability)) {
  console.log(`${r.choice.padEnd(8)} ${pct(r.probability)}  ${r.item.name.padEnd(32)} ${r.item.yearsSinceLastPush}y idle  ${r.item.description.slice(0, 50)}`);
}
console.log(`\n== Stars (${starPlan.length})`);
for (const s of starPlan.filter((s) => s.choice === 'unstar').sort((a, b) => b.probability - a.probability)) {
  console.log(`unstar   ${pct(s.probability)}  ${s.item.repo.padEnd(45)} ${s.item.yearsSinceLastPush}y idle`);
}

const sure = 0.8;
console.log(`\n== Commands (only >= ${pct(sure)} confidence; review, then paste what you agree with)`);
for (const r of repoPlan.filter((r) => r.choice === 'archive' && r.probability >= sure))
  console.log(`gh repo archive ${owner}/${r.item.name} --yes`);
for (const r of repoPlan.filter((r) => r.choice === 'delete' && r.probability >= sure))
  console.log(`gh repo delete ${owner}/${r.item.name} --yes   # irreversible`);
for (const s of starPlan.filter((s) => s.choice === 'unstar' && s.probability >= sure))
  console.log(`gh api -X DELETE user/starred/${s.item.repo}`);

for (const ev of ["unhandledRejection", "uncaughtException"] as const) process.on(ev, (e: any) => { console.error(e?.message ?? e); process.exit(1); });
