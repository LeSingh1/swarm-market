// ============================================================
// EverMind memory interface (Person A). REAL endpoints wired.
//
// EverMind (api.evermind.ai) is an async long-term MEMORY-EXTRACTION engine,
// not a key-value store: POST /api/v0/memories ingests a message (202 queued),
// extraction happens in the background on conversation boundaries, and
// GET /api/v0/memories?user_id= returns extracted *summaries* — never your
// exact JSON, and never synchronously. (Verified: a single posted message
// does not come back within 25s.)
//
// So the design that actually fits both tools:
//   - WRITE-THROUGH to real EverMind: every agent episode + published pack is
//     genuinely POSTed to EverMind (202). This is real long-term agent memory.
//   - The exact, synchronous skill-pack REGISTRY is the in-memory mirror
//     (and Butterbase in db.ts). Recall reads the mirror so the cold->install
//     ->success demo is deterministic and exact.
//
// namespace = agent_id (per-agent memory) or "market" (shared registry).
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

// ---------- real EverMind wire (api.evermind.ai, /api/v0/memories) ----------
const isoTz = () => new Date().toISOString().replace(/\.\d+Z$/, "+00:00");

// Ingest one memory under `namespace` (the EverMind user_id). 202 = queued.
async function emWrite(namespace: string, kind: string, data: unknown): Promise<void> {
  await em("POST", "/api/v0/memories", {
    message_id: `${kind}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    create_time: isoTz(),
    sender: namespace,
    sender_name: namespace,
    role: "assistant",
    content: `[swarm:${kind}] ${JSON.stringify(data)}`,
  });
}

// Best-effort: fetch extracted memories for a namespace. Returns summaries, not
// exact objects, and only after async extraction — so it backstops the mirror,
// it does not replace it.
async function emRecall(namespace: string, _kind: string): Promise<unknown[]> {
  const r = await em(
    "GET",
    `/api/v0/memories?user_id=${encodeURIComponent(namespace)}&memory_type=episodic_memory&limit=50`,
  );
  return (r?.result?.memories ?? []) as unknown[];
}

// Count of extracted memories EverMind holds for a namespace (proof of backing).
export async function everMindMemoryCount(namespace: string): Promise<number> {
  try {
    return (await emRecall(namespace, "episode")).length;
  } catch {
    return -1;
  }
}
// ----------------------------------------------------------------------------

async function em(method: "GET" | "POST", path: string, body?: unknown): Promise<any> {
  if (!EVERMIND_API_KEY) throw new Error("EVERMIND_API_KEY not set");
  const res = await fetch(`${EVERMIND_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${EVERMIND_API_KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`EverMind ${method} ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

let warnedWrite = false;
let confirmedWrite = false;

async function write(ns: string, kind: string, data: unknown): Promise<void> {
  mirrorWrite(ns, kind, data); // exact, synchronous registry copy
  try {
    await emWrite(ns, kind, data); // genuine write-through to EverMind (202 queued)
    if (!confirmedWrite) {
      console.log(`[evermind] write-through live: ${kind} -> EverMind (api.evermind.ai)`);
      confirmedWrite = true;
    }
  } catch (err) {
    if (!warnedWrite) {
      console.warn(`[evermind] write-through unavailable, mirror only: ${(err as Error).message}`);
      warnedWrite = true;
    }
  }
}

// Mirror is authoritative for exact objects (deterministic demo). EverMind's
// extracted summaries only backstop the rare case where the mirror is empty.
async function recall<T>(ns: string, kind: string): Promise<T[]> {
  const local = mirrorRead<T>(ns, kind);
  if (local.length) return local;
  try {
    return (await emRecall(ns, kind)) as T[];
  } catch {
    return [];
  }
}

// --- episodic ---
export async function storeEpisode(ep: Episode): Promise<void> {
  await write(ep.agent_id, "episode", ep);
}
export async function recallEpisodes(agentId: string, _query: string): Promise<Episode[]> {
  return recall<Episode>(agentId, "episode");
}

// --- long-term registry (skill-packs) ---
export async function storePack(pack: SkillPack): Promise<void> {
  await write(MARKET_NS, "skillpack", pack);
}
export async function recallInstalledPacks(agentId: string): Promise<SkillPack[]> {
  return recall<SkillPack>(agentId, "skillpack");
}

// install = copy a pack from the shared market namespace into the agent's own memory
export async function installPack(agentId: string, pack: SkillPack): Promise<void> {
  await write(agentId, "skillpack", pack);
}
