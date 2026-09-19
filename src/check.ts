// Smoke test: one boolean question. Prints raw result incl. providerMetadata.
import { jev as evaluate } from './lib/jev.ts';

const result = await evaluate({
  state: 'The support agent issued a full refund to the customer.',
  questions: {
    refunded: { type: 'boolean', instructions: 'Was a refund issued?' },
  },
});

console.log(JSON.stringify(result, null, 2));

for (const ev of ["unhandledRejection", "uncaughtException"] as const) process.on(ev, (e: any) => { console.error(e?.message ?? e); process.exit(1); });
