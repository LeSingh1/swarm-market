// ============================================================
// No-key proof of the demo's data layer.
// Verifies install -> recall round-trips, which is what makes
// cold=fail / installed=success deterministic. No Claude, no keys needed.
// Run: npm run test:evermind
// ============================================================
import "./env";
import { storePack, installPack, recallInstalledPacks } from "./evermind";
import type { SkillPack } from "../src/types/contract";

const COLD = "agent_cold";
const CONSUMER = "agent_consumer";

const pack: SkillPack = {
  id: "sp_test",
  name: "Fintech objection: lead with compliance",
  lesson: "When a fintech prospect objects on price, anchor on compliance/risk reduction first.",
  trigger: "prospect objects on price in a regulated vertical",
  domain: "sdr-outreach",
  rep_score: 0,
  provenance: { created_by: "agent_publisher", episode_count: 1 },
  created_at: new Date().toISOString(),
};

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`ok: ${msg}`);
}

async function main() {
  await storePack(pack); // publish to shared market

  const coldBefore = await recallInstalledPacks(COLD);
  assert(coldBefore.length === 0, "cold agent has zero installed packs (will fail the task)");

  await installPack(CONSUMER, pack); // the Install click

  const consumerAfter = await recallInstalledPacks(CONSUMER);
  assert(consumerAfter.length === 1, "consumer has exactly 1 pack after install");
  assert(consumerAfter[0].id === pack.id, "recalled pack id matches installed pack");
  assert(consumerAfter[0].name === pack.name, "recalled pack carries the lesson name");

  const coldAfter = await recallInstalledPacks(COLD);
  assert(coldAfter.length === 0, "install did not leak into a different agent's namespace");

  console.log("\nDATA LAYER OK — cold has nothing, installed agent recalls the pack. Demo determinism holds.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
