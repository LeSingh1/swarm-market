// ============================================================
// Full end-to-end smoke test against real Claude + EverMind.
// Mirrors the GOAL Definition of Done, in order.
// Needs ANTHROPIC_API_KEY (and EVERMIND_* if you want real EverMind;
// otherwise the in-memory mirror carries it).
// Run: npm run smoke
// ============================================================
import "./env";
import { postRun, postReflect, postPublish, getSearch, postInstall, postRate } from "./api";
import { DEMO } from "../src/types/contract";

function step(n: number, msg: string) {
  console.log(`\n[${n}] ${msg}`);
}
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`  FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ok: ${msg}`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set — copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  step(1, "Cold consumer run (no packs) — expect FAIL");
  const cold = await postRun({ agent_id: DEMO.consumerId, task: DEMO.task });
  assert(cold.outcome === "fail", "cold run outcome is 'fail'");
  assert(!cold.applied_pack_id, "cold run has no applied_pack_id");

  step(2, "Reflect cold episodes into ONE skill-pack");
  const { pack } = await postReflect({ agent_id: DEMO.publisherId, episodes: cold.episodes });
  assert(!!pack.id && !!pack.name && !!pack.lesson, "pack has id, name, lesson");
  console.log(`     pack: "${pack.name}" — ${pack.lesson.slice(0, 80)}...`);

  step(3, "Publish pack to the market");
  const pub = await postPublish({ pack });
  assert(pub.pack.id === pack.id, "published pack echoed with id");

  step(4, "Search the market — pack should appear");
  const search = await getSearch("");
  assert(search.packs.some((p) => p.id === pack.id), "published pack is searchable");

  step(5, "Install pack into consumer");
  const inst = await postInstall({ agent_id: DEMO.consumerId, pack_id: pack.id });
  assert(inst.ok && inst.pack.id === pack.id, "install ok, returns the pack");

  step(6, "Warm consumer run (pack installed) — expect SUCCESS + applied_pack_id");
  const warm = await postRun({ agent_id: DEMO.consumerId, task: DEMO.task });
  assert(warm.outcome === "success", "warm run outcome is 'success'");
  assert(warm.applied_pack_id === pack.id, "warm run cites the installed pack");

  step(7, "Rate the pack — rep_score should tick up");
  const rated = await postRate({ pack_id: pack.id, delta: 1 });
  assert(rated.pack.rep_score === 1, "rep_score bumped to 1");

  console.log("\nE2E OK — cold fails, install, warm succeeds citing the pack, rep ticks up. Demo path is live.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
