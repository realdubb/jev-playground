// Provider-agnostic Jev model resolution. Pick with JEV_PROVIDER=gateway|typesafe|openrouter,
// or leave unset and the first provider with a key wins (order below).
import { createTypeSafeAi } from '@ai-sdk/typesafe-ai';

export type Provider = 'gateway' | 'typesafe' | 'openrouter';

const env = (k: string) => process.env[k]?.trim() || undefined;

export function pickProvider(): Provider {
  const forced = env('JEV_PROVIDER') as Provider | undefined;
  if (forced) return forced;
  if (env('TYPESAFE_AI_API_KEY')) return 'typesafe';
  if (env('AI_GATEWAY_API_KEY')) return 'gateway';
  if (env('OPENROUTER_API_KEY')) return 'openrouter';
  throw new Error('jev: no key found. Set TYPESAFE_AI_API_KEY, AI_GATEWAY_API_KEY, or OPENROUTER_API_KEY in .env');
}

export function jevModel(provider: Provider = pickProvider()) {
  switch (provider) {
    case 'gateway':
      // Plain string id: the AI SDK routes it through Vercel AI Gateway using AI_GATEWAY_API_KEY.
      return 'typesafe-ai/jev';
    case 'typesafe': {
      // Direct to TypeSafe: POST https://api.typesafe.ai/v1/systemone
      const ts = createTypeSafeAi({ apiKey: env('TYPESAFE_AI_API_KEY') });
      return ts.evaluationModel(env('TYPESAFE_MODEL') ?? 'jev-latest');
    }
    case 'openrouter': {
      // Beta endpoint: POST https://openrouter.ai/api/alpha/decisions, TypeSafe System One wire format.
      // The TypeSafe provider hardcodes `${baseURL}/systemone`, so a custom fetch rewrites the path.
      const base = env('OPENROUTER_JEV_BASE_URL') ?? 'https://openrouter.ai/api/alpha';
      const or = createTypeSafeAi({
        apiKey: env('OPENROUTER_API_KEY'),
        baseURL: base,
        headers: { 'HTTP-Referer': 'https://github.com/realdubb/jev-playground', 'X-Title': 'jev-playground' },
        fetch: (input, init) => {
          const url = String(input instanceof Request ? input.url : input).replace(/\/systemone$/, '/decisions');
          return fetch(url, init);
        },
      });
      return or.evaluationModel(env('OPENROUTER_MODEL') ?? 'typesafe/jev-1.13');
    }
  }
}
