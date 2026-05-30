// ============================================================
// EverMind memory interface (Person A).
// Thin wrapper so we can see exactly where it breaks.
//
// >>> ONE THING TO SWAP FROM THE 10:30 WORKSHOP <<<
// The endpoint paths + payload shape in WORKSHOP below are a best guess.
// When you have the real spec, edit ONLY the WORKSHOP block. Everything
// else (mirror, fallback, the 5 exported fns) stays as-is.
//
// Episodic memory = raw run history per agent (namespace = agent_id).
// Long-term store  = the published skill-pack registry (namespace "market").
//
// Resilience: every write also lands in an in-memory mirror, and every
// recall falls back to the mirror if EverMind errors or returns nothing.
// This keeps the live demo deterministic even if EverMind is down.
// ============================================================
import type { Episode, SkillPack } from "../src/types/contract";

const EVERMIND_API_KEY = process.env.EVERMIND_API_KEY;
const EVERMIND_BASE = process.env.EVERMIND_BASE_URL ?? "https://api.evermind.ai";
const MARKET_NS = "market";

// ---------- in-memory mirror (fallback that makes the demo bulletproof) ----------
// key: `${namespace}:${kind}` -> array of items (newest last)
const mirror = new Map<string, unknown[]>();
const mkey = (ns: string, kind: string) => `${ns}:${kind}`;

function mirrorWrite(ns: string, kind: string, data: unknown) {
  const k = mkey(ns, kind);
  const arr = mirror.get(k) ?? [];
  arr.push(data);
  mirror.set(k, arr);
}
function mirrorRead<T>(ns: string, kind: string): T[] {
  return ([...(mirror.get(mkey(ns, kind)) ?? [])] as T[]);
}

// ---------- WORKSHOP: the only block to edit once you have the real spec ----------
async function emWrite(namespace: string, kind: string, data: unknown): Promise<void> {
  // TODO(workshop): exact write endpoint + payload shape.
  await em("/v1/memory/write", { namespace, kind, data });
}
async function emRecall(namespace: string, kind: string, query: string): Promise<unknown[]> {
  // TODO(workshop): exact recall endpoint + how results come back.
  const r = await em("/v1/memory/recall", { namespace, kind, query });
  return (r.items ?? r.results ?? r.memories ?? []) as unknown[];
}
// ---------------------------------------------------------------------------------

async function em(path: string, body: unknown): Promise<any> {
  if (!EVERMIND_API_KEY) throw new Error("EVERMIND_API_KEY not set");
  const res = await fetch(`${EVERMIND_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${EVERMIND_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`EverMind ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

let warnedOnce = false;
function note(kind: string, err: unknown) {
  if (!warnedOnce) {
    console.warn(`[evermind] using in-memory mirror (${kind}): ${(err as Error).message}`);
    warnedOnce = true;
  }
}

async function write(ns: string, kind: string, data: unknown): Promise<void> {
  mirrorWrite(ns, kind, data); // always mirror first so recall can never miss
  try {
    await emWrite(ns, kind, data);
  } catch (err) {
    note(`write ${kind}`, err);
  }
}

async function recall<T>(ns: string, kind: string, query: string): Promise<T[]> {
  try {
    const items = await emRecall(ns, kind, query);
    if (items.length) return items as T[];
  } catch (err) {
    note(`recall ${kind}`, err);
  }
  return mirrorRead<T>(ns, kind);
}

// --- episodic ---
export async function storeEpisode(ep: Episode): Promise<void> {
  await write(ep.agent_id, "episode", ep);
}
export async function recallEpisodes(agentId: string, query: string): Promise<Episode[]> {
  return recall<Episode>(agentId, "episode", query);
}

// --- long-term registry (skill-packs) ---
export async function storePack(pack: SkillPack): Promise<void> {
  await write(MARKET_NS, "skillpack", pack);
}
export async function recallInstalledPacks(agentId: string): Promise<SkillPack[]> {
  return recall<SkillPack>(agentId, "skillpack", "*");
}

// install = copy a pack from the shared market namespace into the agent's own memory
export async function installPack(agentId: string, pack: SkillPack): Promise<void> {
  await write(agentId, "skillpack", pack);
}
