import 'dotenv/config';

const BASE = 'http://localhost:4000';

const AGENTS = [
  {
    name: 'Nova-Creative',
    personality: 'creative',
    goal: 'Build innovative AI solutions and generate sustainable income'
  },
  {
    name: 'Vega-Steady',
    personality: 'conservative',
    goal: 'Preserve capital and grow wealth through safe, reliable work'
  },
  {
    name: 'Riko-Maverick',
    personality: 'aggressive',
    goal: 'Take high-risk high-reward jobs and dominate the leaderboard'
  }
];

async function post(path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  // ── Spawn remaining agents ──────────────────────────────────────────────
  for (const agent of AGENTS) {
    console.log(`\n🚀 Spawning ${agent.name}...`);
    const result = await post('/api/agents', agent);
    if (result.error) {
      console.error(`  ❌ Failed: ${result.error}`);
    } else {
      console.log(`  ✅ Created | balance: ${result.balance} ADA | address: ${result.walletAddress}`);
    }
    // Wait 5s between spawns to avoid TX conflicts on the faucet wallet
    console.log('  ⏳ Waiting 5s before next spawn...');
    await delay(5000);
  }

  // ── Wait for funding TXs to confirm on-chain (20s) ─────────────────────
  console.log('\n⏳ Waiting 25s for all funding transactions to confirm on-chain...');
  await delay(25000);

  // ── Run 5 ticks to generate events and balance changes ──────────────────
  for (let i = 1; i <= 5; i++) {
    console.log(`\n⚡ Running Tick ${i}/5...`);
    const result = await post('/api/tick');
    console.log(`  ✅ Tick ${result.tick} | processed: ${result.processed} | survivors: ${result.survivors} | deaths: ${result.deaths}`);
    console.log(`  📋 Events generated: ${result.events?.length ?? 0}`);
    // Wait 8s between ticks so Blockfrost can settle
    if (i < 5) {
      console.log('  ⏳ Waiting 8s before next tick...');
      await delay(8000);
    }
  }

  // ── Final state ─────────────────────────────────────────────────────────
  const agentsRes = await fetch(`${BASE}/api/agents`);
  const agents = await agentsRes.json();
  const eventsRes = await fetch(`${BASE}/api/events`);
  const events = await eventsRes.json();

  console.log('\n═══════════════════════════════════════');
  console.log('📊 DEMO SETUP COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`Total Agents : ${agents.length}`);
  console.log(`Alive        : ${agents.filter((a: any) => a.alive).length}`);
  console.log(`Dead         : ${agents.filter((a: any) => !a.alive).length}`);
  console.log(`Total Events : ${events.length}`);
  console.log('\nAgent Leaderboard:');
  [...agents]
    .sort((a: any, b: any) => b.balance - a.balance)
    .forEach((a: any, i: number) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `  ${i + 1}.`;
      const status = a.alive ? '🟢' : '💀';
      console.log(`  ${medal} ${status} ${a.name.padEnd(18)} ${a.balance.toFixed(2)} ADA`);
    });
  console.log('\n✅ Open http://localhost:3000 to see the live dashboard!');
}

main().catch(console.error);
