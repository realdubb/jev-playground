// Forma-flavored: claim/card transaction -> category, eligible, needs_human_review, fraud_risk.
import { jev as evaluate } from './lib/jev.ts';

const policy = {
  account: 'Lifestyle Spending Account (post-tax)',
  eligible: ['gym memberships', 'fitness classes', 'meditation apps', 'home office furniture', 'ergonomic equipment'],
  ineligible: ['alcohol', 'firearms', 'cash advances', 'gift cards', 'medical services (use HSA/FSA)'],
  monthlyLimit: 150,
};

const claims = [
  { merchant: 'Equinox', amount: 89.0, mcc: '7997', memo: 'Monthly membership', receiptText: 'EQUINOX MEMBERSHIP SEPT 2026 $89.00' },
  { merchant: 'Amazon', amount: 149.99, mcc: '5942', memo: 'Standing desk', receiptText: 'FLEXISPOT STANDING DESK EN1 $149.99' },
  { merchant: 'Total Wine', amount: 64.2, mcc: '5921', memo: 'Team offsite supplies', receiptText: 'CABERNET x3 $64.20' },
  { merchant: 'Target', amount: 150.0, mcc: '5310', memo: 'Home office', receiptText: 'TARGET GIFTCARD $150.00' },
  { merchant: 'Kaiser Permanente', amount: 40.0, mcc: '8011', memo: 'Copay', receiptText: 'OFFICE VISIT COPAY $40.00' },
];

for (const claim of claims) {
  const { answers } = await evaluate({
    // Jev is not a calculator: do numeric comparisons in code, pass the verdict as state.
    state: { policy, claim, derived: { atMonthlyLimit: claim.amount >= policy.monthlyLimit } },
    questions: {
      category: {
        type: 'choice',
        instructions: 'Which spending category best describes this claim?',
        criteria: {
          fitness: 'gyms, classes, sports, wellness apps',
          home_office: 'desks, chairs, monitors, ergonomic gear',
          medical: 'doctor visits, prescriptions, copays',
          alcohol: 'wine, beer, spirits',
          gift_card: 'stored value or gift cards',
          other: 'anything else',
        },
      },
      eligible: {
        type: 'boolean',
        instructions: 'Is this claim eligible under the account policy?',
      },
      needs_human_review: {
        type: 'boolean',
        instructions: 'Should a human reviewer look at this before approving or denying?',
        criteria: {
          true: 'memo and receipt disagree, category is borderline, or derived.atMonthlyLimit is true',
          false: 'clearly eligible or clearly ineligible with consistent evidence',
        },
      },
      fraud_risk: {
        type: 'score',
        instructions: 'How likely is this claim to be an attempt to misuse the benefit?',
        criteria: [
          'none: ordinary eligible purchase',
          'low: eligible but unusual',
          'medium: memo does not match the receipt',
          'high: disguising an ineligible purchase as eligible',
        ],
      },
    },
  });

  console.log(
    `${claim.merchant.padEnd(18)} $${claim.amount.toFixed(2).padStart(7)}  ${answers.category.choice.padEnd(12)}` +
      `eligible=${answers.eligible.probability.toFixed(2)}  review=${answers.needs_human_review.probability.toFixed(2)}` +
      `  fraud=${answers.fraud_risk.score.toFixed(2)}/3`,
  );
}

for (const ev of ["unhandledRejection", "uncaughtException"] as const) process.on(ev, (e: any) => { console.error(e?.message ?? e); process.exit(1); });
