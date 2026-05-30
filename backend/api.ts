// ============================================================
// HTTP routes (Person A owns run/reflect/publish/install; Person B owns search + rate).
// ============================================================
import type {
  RunRequest, ReflectRequest, PublishRequest, InstallRequest, RateRequest,
  SkillPack,
} from "../src/types/contract"
import * as db from "./db"

// POST /agent/run  (Person A)
export async function postRun(_body: RunRequest) {
  throw new Error("postRun: Person A's implementation")
}

// POST /agent/reflect  (Person A)
export async function postReflect(_body: ReflectRequest) {
  throw new Error("postReflect: Person A's implementation")
}

// POST /market/publish  (Person A)
export async function postPublish(body: PublishRequest) {
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

// POST /market/install  (Person A)
export async function postInstall(_body: InstallRequest) {
  throw new Error("postInstall: Person A's implementation")
}

// POST /market/rate  (Person B)
export async function postRate(body: RateRequest) {
  const pack = await db.bumpRep(body.pack_id, body.delta)
  return { pack }
}

export type { SkillPack }
