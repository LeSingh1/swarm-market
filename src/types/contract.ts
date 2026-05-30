// ============================================================
// FROZEN CONTRACT — do not change after 11:20 AM.
// Both A (backend) and B (frontend) build against this.
// ============================================================

export type SkillPack = {
  id: string;            // "sp_8f3a"
  name: string;          // "Fintech objection: lead with compliance"
  lesson: string;        // distilled, portable lesson (NOT a transcript)
  trigger: string;       // when this pack should fire
  domain: string;        // "sdr-outreach"
  rep_score: number;     // starts 0, +1 per good outcome
  provenance: { created_by: string; episode_count: number };
  created_at: string;    // ISO
};

export type Episode = {
  id: string;
  agent_id: string;
  task: string;
  action: string;        // what the agent did
  outcome: "success" | "fail" | "unknown";
  note?: string;
  created_at: string;
};

// One agent run = the agent attempts a task, producing actions + an outcome.
export type AgentRun = {
  agent_id: string;
  task: string;
  actions: string[];     // ordered steps the agent took
  outcome: "success" | "fail";
  result: string;        // the visible artifact (e.g. the email it wrote)
  applied_pack_id?: string; // set when behavior came from an installed pack
  episodes: Episode[];
};

// ---------- API shapes ----------

export type RunRequest    = { agent_id: string; task: string };
export type RunResponse   = AgentRun;

export type ReflectRequest  = { agent_id: string; episodes: Episode[] };
export type ReflectResponse = { pack: SkillPack };

export type PublishRequest  = { pack: SkillPack };
export type PublishResponse = { pack: SkillPack };       // echoes stored pack w/ id

export type SearchResponse  = { packs: SkillPack[] };    // ranked

export type InstallRequest  = { agent_id: string; pack_id: string };
export type InstallResponse = { ok: true; pack: SkillPack };

export type RateRequest     = { pack_id: string; delta: 1 };
export type RateResponse    = { pack: SkillPack };

// ---------- routes (single source of truth) ----------

export const API = {
  base: import.meta?.env?.VITE_API_BASE_URL ?? "/api",
  run:     "/agent/run",
  reflect: "/agent/reflect",
  publish: "/market/publish",
  search:  "/market/search",   // ?q=
  install: "/market/install",
  rate:    "/market/rate",
} as const;

// Demo constants — keep the live demo deterministic.
export const DEMO = {
  domain: "sdr-outreach",
  task: "Write a cold outreach email to a fintech prospect who objects on price.",
  publisherId: "agent_publisher",
  consumerId: "agent_consumer",
} as const;
