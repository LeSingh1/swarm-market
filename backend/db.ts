// ============================================================
// Butterbase table helpers (Person B's backend slice + A).
// Swap the in-memory Map for Butterbase calls once the project exists.
// Tables: skill_packs, agent_runs, install_events.
// ============================================================
import type { AgentRun, SkillPack } from "../src/types/contract";

// TODO(B): replace with Butterbase client. Keep signatures identical.
const packs = new Map<string, SkillPack>();

export async function upsertPack(p: SkillPack) { packs.set(p.id, p); }
export async function getPack(id: string): Promise<SkillPack> {
  const p = packs.get(id);
  if (!p) throw new Error(`pack ${id} not found`);
  return p;
}
export async function listPacks(): Promise<SkillPack[]> { return [...packs.values()]; }
export async function bumpRep(id: string, delta: number): Promise<SkillPack> {
  const p = await getPack(id);
  p.rep_score += delta;
  packs.set(id, p);
  return p;
}
export async function logRun(_run: AgentRun) { /* TODO(B): insert into agent_runs */ }
export async function logInstall(_packId: string, _agentId: string) { /* TODO(B): insert into install_events */ }
