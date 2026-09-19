// Thin wrapper around evaluate(): free-tier 429s become a short wait + retry instead of a stack trace.
import { experimental_evaluate as evaluate } from 'ai';
import { jevModel, pickProvider } from './model.ts';

export const provider = pickProvider();
const model = jevModel(provider);

type Args = Parameters<typeof evaluate>[0];

export async function jev<A extends Args>(args: A, opts: { waits?: number[] } = {}) {
  const waits = opts.waits ?? [5_000, 15_000, 30_000, 60_000];
  for (let attempt = 0; ; attempt++) {
    try {
      // Strip undefined values: the SDK requires JSON-compatible state.
      const state = args.state === undefined ? args.state : JSON.parse(JSON.stringify(args.state));
      return await evaluate({ ...args, state, model: model as any, maxRetries: 0 });
    } catch (err: any) {
      const status = err?.statusCode ?? err?.cause?.statusCode;
      if (status === 429 && attempt < waits.length) {
        const retryAfter = Number(err?.cause?.responseHeaders?.['retry-after']) * 1000;
        const wait = retryAfter > 0 ? retryAfter : waits[attempt];
        console.error(`jev: free-tier rate limit hit, waiting ${wait / 1000}s (attempt ${attempt + 1}/${waits.length})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (status === 429) throw new Error(`jev: rate limited by ${provider} after retries.`);
      if (status === 402) throw new Error(`jev: ${provider} says insufficient credits. ${err?.data?.error?.message ?? ''}`.trim());
      if (status === 401 || err?.name === 'GatewayAuthenticationError') throw new Error(`jev: auth failed for provider ${provider}. Check its key in .env`);
      throw err;
    }
  }
}
