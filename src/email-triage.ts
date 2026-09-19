// Inbox triage: per email -> action (choice), needs_reply (boolean), urgency (score).
import { jev as evaluate } from './lib/jev.ts';

type Email = { from: string; subject: string; body: string };

const inbox: Email[] = [
  {
    from: 'billing@fastmail.com',
    subject: 'Your receipt for September',
    body: 'Thanks for your payment of $50.00. This is your receipt. No action needed.',
  },
  {
    from: 'sarah@joinforma.com',
    subject: 'Re: card-review PR, can you look today?',
    body: 'Hey Alex, the release is cut at 4pm and your PR is the last blocker. Can you review by 2pm?',
  },
  {
    from: 'newsletter@syntax.fm',
    subject: 'Syntax 900: The one about Bun',
    body: 'This week we talk about Bun 2.0, TS 6, and why your build is slow. Listen now.',
  },
  {
    from: 'landlord@example.com',
    subject: 'Water shutoff Tuesday',
    body: 'Building water will be off Tuesday 9am to 1pm for repairs. Please plan accordingly.',
  },
];

const ACTION = {
  reply: 'a person is waiting on a response from me',
  todo: 'something I need to do or remember, but no reply is expected',
  receipt: 'a payment confirmation, invoice, or receipt',
  newsletter: 'marketing, digest, or newsletter content',
  archive: 'informational only, nothing to do',
} as const;

for (const email of inbox) {
  const { answers, providerMetadata } = await evaluate({
    state: email,
    questions: {
      action: {
        type: 'choice',
        instructions: 'What should I do with this email?',
        criteria: ACTION,
      },
      needs_reply: {
        type: 'boolean',
        instructions: 'Does the sender expect a written reply from me?',
      },
      urgency: {
        type: 'score',
        instructions: 'How time sensitive is this email?',
        criteria: [
          'none: no deadline, purely informational',
          'low: this week is fine',
          'medium: today or tomorrow',
          'high: within hours, blocks someone else',
        ],
      },
    },
  });

  const a = answers.action;
  const conf = (providerMetadata as any)?.typesafe?.confidence;
  console.log(
    `${email.subject.padEnd(42)} -> ${a.choice.padEnd(10)} p=${a.probabilities[a.choice].toFixed(2)}` +
      `  reply=${answers.needs_reply.probability.toFixed(2)}` +
      `  urgency=${answers.urgency.score.toFixed(2)}/3` +
      (conf ? `  conf=${JSON.stringify(conf)}` : ''),
  );
}

for (const ev of ["unhandledRejection", "uncaughtException"] as const) process.on(ev, (e: any) => { console.error(e?.message ?? e); process.exit(1); });
