// Discover how OpenRouter exposes Jev (beta). Needs OPENROUTER_API_KEY. Read-only, prints evidence.
const key = process.env.OPENROUTER_API_KEY?.trim();
if (!key) { console.error('OPENROUTER_API_KEY not set in .env'); process.exit(2); }
const H = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const body = { model: 'typesafe/jev-1.13', state: 'The agent issued a full refund.', questions: { refunded: { type: 'noul', instructions: 'Was a refund issued?' } } };
const show = async (label: string, res: Response) => {
  const text = (await res.text()).replace(/\s+/g, ' ').slice(0, 300);
  console.log(`${res.status}  ${label}\n      ${text}`);
};

console.log('== authenticated model listing');
const models = await (await fetch('https://openrouter.ai/api/v1/models', { headers: H })).json();
const ts = (models.data ?? []).filter((m: any) => /typesafe|jev/i.test(m.id));
console.log(ts.length ? ts.map((m: any) => `  ${m.id}  arch=${JSON.stringify(m.architecture)} params=${JSON.stringify(m.supported_parameters)}`).join('\n') : '  none visible');
for (const id of ['typesafe/jev-1.13', 'typesafe/jev-latest']) {
  await show(`GET /api/v1/models/${id}/endpoints`, await fetch(`https://openrouter.ai/api/v1/models/${id}/endpoints`, { headers: H }));
}

console.log('\n== System One wire format at candidate paths');
for (const p of ['/api/alpha/decisions']) {
  await show(`POST ${p}`, await fetch(`https://openrouter.ai${p}`, { method: 'POST', headers: H, body: JSON.stringify(body) }));
}

console.log('\nExpect 200 with {answers:{refunded:{type:"noul",noul:0.9x}}} from /api/alpha/decisions. Then: JEV_PROVIDER=openrouter pnpm check');
