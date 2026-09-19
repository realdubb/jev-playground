// Fan-out helper: judge many items in ONE Jev call by asking one question per item.
// Jev adds ~zero latency per extra question, so this is far cheaper than N calls.
import { jev as evaluate } from './jev.ts';

export type Judged<T> = { item: T; probability: number };

export async function judgeEach<T>(
  items: T[],
  instructions: string,
  opts: { context?: unknown; chunk?: number; criteria?: { true: string; false: string } } = {},
): Promise<Judged<T>[]> {
  const chunk = opts.chunk ?? 40;
  const out: Judged<T>[] = [];
  for (let i = 0; i < items.length; i += chunk) {
    const slice = items.slice(i, i + chunk);
    const state = {
      ...(opts.context ? { context: opts.context } : {}),
      items: Object.fromEntries(slice.map((it, j) => [`item_${j}`, it])),
    };
    const questions = Object.fromEntries(
      slice.map((_, j) => [
        `item_${j}`,
        { type: 'boolean' as const, instructions: `For items.item_${j}: ${instructions}`, criteria: opts.criteria },
      ]),
    );
    const { answers } = await evaluate({ state, questions });
    slice.forEach((item, j) => out.push({ item, probability: (answers as any)[`item_${j}`].probability }));
  }
  return out;
}

export async function classifyEach<T, C extends Record<string, string>>(
  items: T[],
  instructions: string,
  criteria: C,
  opts: { context?: unknown; chunk?: number } = {},
): Promise<{ item: T; choice: keyof C & string; probability: number; confidence?: number }[]> {
  const chunk = opts.chunk ?? 40;
  const out: { item: T; choice: keyof C & string; probability: number; confidence?: number }[] = [];
  for (let i = 0; i < items.length; i += chunk) {
    const slice = items.slice(i, i + chunk);
    const state = {
      ...(opts.context ? { context: opts.context } : {}),
      items: Object.fromEntries(slice.map((it, j) => [`item_${j}`, it])),
    };
    const questions = Object.fromEntries(
      slice.map((_, j) => [
        `item_${j}`,
        { type: 'choice' as const, instructions: `For items.item_${j}: ${instructions}`, criteria },
      ]),
    );
    const { answers, providerMetadata } = await evaluate({ state, questions });
    const conf = (providerMetadata as any)?.typesafe?.confidence ?? {};
    slice.forEach((item, j) => {
      const a = (answers as any)[`item_${j}`];
      out.push({ item, choice: a.choice, probability: a.probabilities[a.choice], confidence: conf[`item_${j}`] });
    });
  }
  return out;
}
