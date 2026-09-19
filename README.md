# jev-playground

Small TypeScript playground for [Jev](https://typesafe.ai), TypeSafe AI's System One decision model. Jev is not an LLM. You hand it state plus typed questions and get back Choice, Score, and Boolean answers with probabilities. No prompt parsing, no JSON begging.

Provider-agnostic: Vercel AI Gateway, TypeSafe direct, or OpenRouter, chosen by one env var.

## Setup

```bash
pnpm install
cp .env.example .env   # add one key, set JEV_PROVIDER
pnpm check             # one boolean question, prints the raw result
```

Needs Node 22+ (Node 26 runs the `.ts` files directly, no build step).

## What's here

| Command | What it does |
|---|---|
| `pnpm email` | Inbox triage: action, needs_reply, urgency per email |
| `pnpm pr` | PR verifier: does the description match the diff, how risky, who reviews |
| `pnpm prune` | GitHub pruner: keep / archive / delete per repo, keep / unstar per star, prints `gh` commands only |
| `bin/jev-filter.ts` | CLI: pipe lines in, ask one yes/no question, only matching lines come out |
| `src/lib/fanout.ts` | Judge or classify N items in one call (one question per item) |
| `src/lib/jev.ts` | Wrapper: provider selection, 429 wait-and-retry, JSON-safe state, short errors |
| `audit/` | Logs, undo and re-fork scripts from the GitHub cleanup runs |

```bash
git log --oneline -300 | bin/jev-filter.ts "touches auth or permissions"
```

## Lessons

- Fan out. Extra questions in one call cost almost no latency. Extra calls do.
- Jev is not a calculator. Precompute numbers and dates in code, pass the facts as state.
- Confidence is the product. Route anything under ~0.7 to a human.
- State is not treated as hostile. Do not make Jev the only gate on a destructive action.
