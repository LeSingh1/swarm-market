// ============================================================
// EverMind memory interface (Person A).
// Thin wrapper so we can see exactly where it breaks.
// >>> FILL THE 3 TODOs FROM THE 10:30 EVERMIND WORKSHOP <<<
// Episodic memory = raw run history per agent.
// Long-term store = the published skill-pack registry.
// ============================================================
import type { Episode, SkillPack } from "../src/types/contract";

const EVERMIND_API_KEY = process.env.EVERMIND_API_KEY!;
const EVERMIND_BASE = process.env.EVERMIND_BASE_URL ?? "https://api.evermind.ai"; // confirm in workshop

async function em(path: string, body: unknown) {
  const res = await fetch(`${EVERMIND_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${EVERMIND_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`EverMind ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

// --- episodic ---
export async function storeEpisode(ep: Episode): Promise<void> {
  // TODO(workshop): exact endpoint + payload to write one memory under agent namespace = ep.agent_id
  await em("/v1/memory/write", { namespace: ep.agent_id, kind: "episode", data: ep });
}

export async function recallEpisodes(agentId: string, query: string): Promise<Episode[]> {
  // TODO(workshop): retrieval call for an agent's episodic memory
  const r = await em("/v1/memory/recall", { namespace: agentId, query, kind: "episode" });
  return (r.items ?? []) as Episode[];
}

// --- long-term registry (skill-packs) ---
export async function storePack(pack: SkillPack): Promise<void> {
  // TODO(workshop): write pack to a SHARED namespace so every agent can find it
  await em("/v1/memory/write", { namespace: "market", kind: "skillpack", data: pack });
}

export async function recallInstalledPacks(agentId: string): Promise<SkillPack[]> {
  const r = await em("/v1/memory/recall", { namespace: agentId, kind: "skillpack", query: "*" });
  return (r.items ?? []) as SkillPack[];
}

// install = copy a pack from the shared market namespace into the agent's own memory
export async function installPack(agentId: string, pack: SkillPack): Promise<void> {
  await em("/v1/memory/write", { namespace: agentId, kind: "skillpack", data: pack });
}
