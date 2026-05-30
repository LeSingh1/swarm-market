// ============================================================
// Pack registry + run/install logs.
// Dual-path: real Butterbase when BUTTERBASE_APP_ID is set, plus an in-memory
// Map kept as a live mirror so a Butterbase hiccup/RLS block can never break
// the demo. Same signatures either way. Tables (schema.sql): skill_packs,
// agent_runs, install_events.
// ============================================================
import type { AgentRun, SkillPack } from "../src/types/contract"

const BB_APP_ID = process.env.BUTTERBASE_APP_ID
const BB_API_URL = process.env.BUTTERBASE_API_URL ?? "https://api.butterbase.ai"
const BB_ANON_KEY = process.env.BUTTERBASE_ANON_KEY
const useBB = !!BB_APP_ID

// Lazy client (dynamic import: the SDK is ESM-only, tsx can't static-import it).
let _bb: any = null
async function bb(): Promise<any> {
  if (_bb) return _bb
  const { createClient } = await import("@butterbase/sdk")
  _bb = createClient({ appId: BB_APP_ID!, apiUrl: BB_API_URL, anonKey: BB_ANON_KEY })
  return _bb
}
function unwrap<T>(res: { data: T; error: any }, where: string): T {
  if (res?.error) throw new Error(`${where}: ${res.error.message ?? res.error}`)
  return res.data
}

let warnedBB = false
let confirmedBB = false
function warnBB(where: string, err: unknown) {
  if (!warnedBB) {
    console.warn(`[butterbase] falling back to in-memory mirror (${where}): ${(err as Error).message}`)
    warnedBB = true
  }
}
function confirmBB() {
  if (!confirmedBB) {
    console.log(`[butterbase] live: reads/writes hitting ${BB_API_URL} (app ${BB_APP_ID})`)
    confirmedBB = true
  }
}

// row <-> SkillPack (schema flattens provenance into two columns)
const toRow = (p: SkillPack) => ({
  id: p.id, name: p.name, lesson: p.lesson, trigger: p.trigger, domain: p.domain,
  rep_score: p.rep_score, created_by: p.provenance.created_by,
  episode_count: p.provenance.episode_count, created_at: p.created_at,
})
const fromRow = (r: any): SkillPack => ({
  id: r.id, name: r.name, lesson: r.lesson, trigger: r.trigger, domain: r.domain,
  rep_score: r.rep_score,
  provenance: { created_by: r.created_by, episode_count: r.episode_count },
  created_at: r.created_at,
})

// ---------------- in-memory mirror (seeded so the market isn't empty) ----------------
const seed: SkillPack[] = [
  { id: "sp_demo1", name: "Fintech objection: lead with compliance",
    lesson: "When a fintech prospect objects on price, pivot to compliance risk reduction first, then TCO.",
    trigger: "price objection from fintech prospect", domain: "sdr-outreach", rep_score: 12,
    provenance: { created_by: "agent_publisher", episode_count: 3 }, created_at: new Date().toISOString() },
  { id: "sp_demo2", name: "Cold open: mutual connection hook",
    lesson: "Open cold emails by naming a mutual connection or shared context before any pitch.",
    trigger: "cold outreach with no prior relationship", domain: "sdr-outreach", rep_score: 8,
    provenance: { created_by: "agent_publisher", episode_count: 2 }, created_at: new Date().toISOString() },
]
const packs = new Map<string, SkillPack>(seed.map(p => [p.id, p]))

// Seed Butterbase once if the table is empty, so the UI still has data to show.
let seeded = false
async function seedBBOnce(c: any) {
  if (seeded) return
  seeded = true
  const existing = unwrap<any[]>(await c.from("skill_packs").select("id").limit(1), "seed check")
  if (!existing?.length) for (const p of seed) await c.from("skill_packs").insert(toRow(p))
}

// ---------------- public API (identical signatures both paths) ----------------
export async function upsertPack(p: SkillPack): Promise<void> {
  packs.set(p.id, p) // mirror always
  if (!useBB) return
  try {
    const c = await bb()
    const found = unwrap<any[]>(await c.from("skill_packs").select("id").eq("id", p.id), "upsert lookup")
    if (found?.length) unwrap(await c.from("skill_packs").update(toRow(p)).eq("id", p.id), "update")
    else unwrap(await c.from("skill_packs").insert(toRow(p)), "insert")
    confirmBB()
  } catch (err) { warnBB("upsertPack", err) }
}

export async function getPack(id: string): Promise<SkillPack> {
  if (useBB) {
    try {
      const c = await bb()
      const rows = unwrap<any[]>(await c.from("skill_packs").select("*").eq("id", id), "getPack")
      if (rows?.length) { confirmBB(); return fromRow(rows[0]) }
    } catch (err) { warnBB("getPack", err) }
  }
  const p = packs.get(id)
  if (!p) throw new Error(`pack ${id} not found`)
  return p
}

export async function listPacks(): Promise<SkillPack[]> {
  if (useBB) {
    try {
      const c = await bb()
      await seedBBOnce(c)
      const rows = unwrap<any[]>(await c.from("skill_packs").select("*"), "listPacks")
      confirmBB()
      return (rows ?? []).map(fromRow)
    } catch (err) { warnBB("listPacks", err) }
  }
  return [...packs.values()]
}

export async function bumpRep(id: string, delta: number): Promise<SkillPack> {
  const current = await getPack(id)
  const updated: SkillPack = { ...current, rep_score: current.rep_score + delta }
  packs.set(id, updated) // mirror always
  if (useBB) {
    try {
      const c = await bb()
      unwrap(await c.from("skill_packs").update({ rep_score: updated.rep_score }).eq("id", id), "bumpRep")
      confirmBB()
    } catch (err) { warnBB("bumpRep", err) }
  }
  return updated
}

export async function logRun(run: AgentRun): Promise<void> {
  if (!useBB) return
  try {
    const c = await bb()
    unwrap(await c.from("agent_runs").insert(
      { agent_id: run.agent_id, task: run.task, outcome: run.outcome, result: run.result }), "logRun")
  } catch (err) { warnBB("logRun", err) }
}

export async function logInstall(packId: string, agentId: string): Promise<void> {
  if (!useBB) return
  try {
    const c = await bb()
    unwrap(await c.from("install_events").insert({ pack_id: packId, agent_id: agentId }), "logInstall")
  } catch (err) { warnBB("logInstall", err) }
}
