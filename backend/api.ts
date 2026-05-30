// ============================================================
// HTTP routes (Person A owns run/reflect/publish/install; Person B owns search + rate).
// Each export = one route from contract.API. Used by both the HTTP server
// (UI) and the MCP server (agents) — one set of handlers, two faces.
// ============================================================
import type {
  RunRequest, ReflectRequest, PublishRequest, InstallRequest, RateRequest,
  SkillPack,
} from "../src/types/contract"
import { runAgent, reflect } from "./agent"
import { storePack, installPack, recallInstalledPacks } from "./evermind"
import * as db from "./db"

// POST /agent/run  (Person A)
export async function postRun(body: RunRequest) {
  const run = await runAgent(body.agent_id, body.task)
  await db.logRun(run)
  // Outcome-based reputation: a real install->success bumps the applied pack's rep,
  // so "ranked by reputation" reflects measured usage, not just manual ratings.
  // Best-effort: never let a rep failure break the run response.
  if (run.outcome === "success" && run.applied_pack_id) {
    try {
      const bumped = await db.bumpRep(run.applied_pack_id, 1)
      await storePack(bumped) // keep EverMind shared registry copy in sync
    } catch (err) {
      console.warn(`[rep] outcome bump failed for ${run.applied_pack_id}: ${(err as Error).message}`)
    }
  }
  return run
}

// POST /agent/reflect  (Person A)
export async function postReflect(body: ReflectRequest) {
  return reflect(body.agent_id, body.episodes) // { pack }
}

// POST /market/publish  (Person A) -> EverMind shared namespace + Butterbase mirror
export async function postPublish(body: PublishRequest) {
  await storePack(body.pack)
  await db.upsertPack(body.pack)
  return { pack: body.pack }
}

// GET /market/search?q=   (Person B)
export async function getSearch(q: string) {
  const all = await db.listPacks()
  const ranked = all
    .filter(p => !q || `${p.name} ${p.lesson} ${p.domain}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.rep_score - a.rep_score)
  return { packs: ranked }
}

// POST /market/install  (Person A) -> copy pack into agent's EverMind memory
export async function postInstall(body: InstallRequest) {
  const pack = await db.getPack(body.pack_id)
  await installPack(body.agent_id, pack)
  await db.logInstall(body.pack_id, body.agent_id)
  return { ok: true as const, pack }
}

// POST /market/rate  (Person B) -> bump rep, keep EverMind copy in sync
export async function postRate(body: RateRequest) {
  const pack = await db.bumpRep(body.pack_id, body.delta)
  await storePack(pack)
  return { pack }
}

export type { SkillPack }
export { recallInstalledPacks }
