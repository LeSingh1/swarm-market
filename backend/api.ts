// ============================================================
// HTTP routes (Person A owns all; Person B owns search + rate slice).
// Framework-light: adapt handlers to Butterbase serverless functions.
// Each export = one route from contract.API.
// ============================================================
import type {
  RunRequest, ReflectRequest, PublishRequest, InstallRequest, RateRequest,
  SkillPack,
} from "../src/types/contract";
import { runAgent, reflect } from "./agent";
import { storePack, installPack, recallInstalledPacks } from "./evermind";
import * as db from "./db"; // Butterbase table helpers (thin)

// POST /agent/run
export async function postRun(body: RunRequest) {
  const run = await runAgent(body.agent_id, body.task);
  await db.logRun(run);
  return run;
}

// POST /agent/reflect
export async function postReflect(body: ReflectRequest) {
  return reflect(body.agent_id, body.episodes); // { pack }
}

// POST /market/publish  -> EverMind shared namespace + Butterbase mirror
export async function postPublish(body: PublishRequest) {
  await storePack(body.pack);
  await db.upsertPack(body.pack);
  return { pack: body.pack };
}

// GET /market/search?q=   (Person B slice)
export async function getSearch(q: string) {
  const all = await db.listPacks();
  const ranked = all
    .filter(p => !q || `${p.name} ${p.lesson} ${p.domain}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.rep_score - a.rep_score);
  return { packs: ranked };
}

// POST /market/install -> copy pack into agent's EverMind memory
export async function postInstall(body: InstallRequest) {
  const pack = await db.getPack(body.pack_id);
  await installPack(body.agent_id, pack);
  await db.logInstall(body.pack_id, body.agent_id);
  return { ok: true as const, pack };
}

// POST /market/rate  (Person B slice)
export async function postRate(body: RateRequest) {
  const pack = await db.bumpRep(body.pack_id, body.delta);
  await storePack(pack); // keep EverMind copy in sync
  return { pack };
}

export type { SkillPack };
export { recallInstalledPacks };
