// ============================================================
// Butterbase table helpers (Person B's backend slice).
// In-memory store now — swap each fn body for Butterbase calls once you have the API key.
// Tables: skill_packs, agent_runs, install_events.
//
// Butterbase swap pattern (Supabase-compatible):
//   import { createClient } from '@butterbase/client'
//   const db = createClient(process.env.BUTTERBASE_URL!, process.env.BUTTERBASE_API_KEY!)
//   upsertPack: db.from('skill_packs').upsert(p)
//   getPack:    db.from('skill_packs').select('*').eq('id', id) → data[0]
//   listPacks:  db.from('skill_packs').select('*') → data
//   bumpRep:    db.from('skill_packs').update({rep_score}).eq('id',id).select → data[0]
// ============================================================
import type { AgentRun, SkillPack } from "../src/types/contract"

const packs = new Map<string, SkillPack>([
  ["sp_demo1", {
    id: "sp_demo1",
    name: "Fintech objection: lead with compliance",
    lesson: "When a fintech prospect objects on price, pivot to compliance risk reduction first, then TCO.",
    trigger: "price objection from fintech prospect",
    domain: "sdr-outreach",
    rep_score: 12,
    provenance: { created_by: "agent_publisher", episode_count: 3 },
    created_at: new Date().toISOString(),
  }],
  ["sp_demo2", {
    id: "sp_demo2",
    name: "Cold open: mutual connection hook",
    lesson: "Open cold emails by naming a mutual connection or shared context before any pitch.",
    trigger: "cold outreach with no prior relationship",
    domain: "sdr-outreach",
    rep_score: 8,
    provenance: { created_by: "agent_publisher", episode_count: 2 },
    created_at: new Date().toISOString(),
  }],
])

export async function upsertPack(p: SkillPack): Promise<void> {
  packs.set(p.id, p)
}

export async function getPack(id: string): Promise<SkillPack> {
  const p = packs.get(id)
  if (!p) throw new Error(`pack ${id} not found`)
  return p
}

export async function listPacks(): Promise<SkillPack[]> {
  return [...packs.values()]
}

export async function bumpRep(id: string, delta: number): Promise<SkillPack> {
  const p = await getPack(id)
  const updated: SkillPack = { ...p, rep_score: p.rep_score + delta }
  packs.set(id, updated)
  return updated
}

export async function logRun(_run: AgentRun): Promise<void> {
  // TODO: insert into agent_runs table when Butterbase is wired
}

export async function logInstall(_packId: string, _agentId: string): Promise<void> {
  // TODO: insert into install_events table when Butterbase is wired
}
