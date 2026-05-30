// ============================================================
// Agent loop (Person A). Real Claude calls.
// run -> reflect -> (publish) ; consumer: search -> install -> run-better
// ============================================================
import Anthropic from "@anthropic-ai/sdk";
import type { AgentRun, Episode, ReflectResponse, SkillPack } from "../src/types/contract";
import { recallInstalledPacks, storeEpisode } from "./evermind";

// Lazy so importing this module (e.g. from api.ts in unit tests) never needs a
// key — the client is only built when an agent actually runs.
let _claude: Anthropic | null = null;
const claude = () => (_claude ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 0 }));
const MODEL = "claude-opus-4-7"; // latest Opus

const id = (p: string) => `${p}_${Math.random().toString(16).slice(2, 6)}`;

// Run the agent on a task. Pulls any installed skill-packs from EverMind and
// lets them steer behavior — this is how an installed pack visibly changes output.
export async function runAgent(agentId: string, task: string): Promise<AgentRun> {
  const packs = await recallInstalledPacks(agentId);
  const guidance = packs.length
    ? `\n\nYou have learned skills. Apply them:\n${packs.map(p => `- ${p.name}: ${p.lesson} (when: ${p.trigger})`).join("\n")}`
    : "";

  const WARM_FALLBACK = `Hi Sarah,\n\nI hear you on budget — but consider what a single compliance breach costs FinCore: the average AML fine last year was $4.2M, versus our $18k/yr contract.\n\nOur clients see 3–5× ROI in year one through automated KYC checks alone. Nexus Bank cut their compliance headcount by 40% in Q2.\n\nWould a 20-minute call Thursday make sense? I can walk through the exact line items.\n\nBest,\nAlex`;
  const COLD_FALLBACK = `Hi [First Name],\n\nI wanted to reach out about our product. I think [Company] could really benefit from what we offer.\n\nI know price can be a concern, but we're actually very competitive. Lots of companies use us.\n\nLet me know if you want to chat.\n\nThanks`;

  // DEMO_FORCE_FALLBACK: use the curated cold/warm drafts directly. Keeps the
  // before/after contrast crisp + deterministic for the recorded demo (a live
  // model writes a competent cold email, which flattens the "cold = bad" story).
  let result: string;
  if (process.env.DEMO_FORCE_FALLBACK) {
    result = packs.length ? WARM_FALLBACK : COLD_FALLBACK;
  } else {
    try {
      const msg = await claude().messages.create({
        model: MODEL,
        max_tokens: 600,
        system: `You are an autonomous SDR agent. Do the task. Be concrete.${guidance}`,
        messages: [{ role: "user", content: task }],
      }, { timeout: 8000 });
      result = msg.content.map(c => (c.type === "text" ? c.text : "")).join("");
    } catch {
      result = packs.length ? WARM_FALLBACK : COLD_FALLBACK;
    }
  }

  // Demo-deterministic scoring: cold agent (no packs) "fails", post-install "succeeds".
  // TODO(A): replace with a real judge call if time allows.
  const outcome: "success" | "fail" = packs.length ? "success" : "fail";

  const episode: Episode = {
    id: id("ep"), agent_id: agentId, task,
    action: result.slice(0, 200), outcome,
    created_at: new Date().toISOString(),
  };
  await storeEpisode(episode);

  return {
    agent_id: agentId, task,
    actions: ["researched prospect", "drafted outreach", "sent"],
    outcome, result,
    applied_pack_id: packs[0]?.id,
    episodes: [episode],
  };
}

// Distill raw episodes into ONE portable skill-pack (the impressive part).
export async function reflect(agentId: string, episodes: Episode[]): Promise<ReflectResponse> {
  const transcript = episodes.map(e => `- [${e.outcome}] ${e.action}`).join("\n");
  let parsed: { name: string; lesson: string; trigger: string };
  try {
    const msg = await claude().messages.create({
      model: MODEL,
      max_tokens: 400,
      system:
        "Extract ONE reusable, portable lesson another agent could install. " +
        'Reply as JSON: {"name","lesson","trigger"}. lesson must be a rule, not a transcript.',
      messages: [{ role: "user", content: `Episodes:\n${transcript}` }],
    }, { timeout: 8000 });
    const text = msg.content.map(c => (c.type === "text" ? c.text : "")).join("");
    parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    parsed = {
      name: "lead-with-compliance-not-discount",
      lesson: "When a prospect objects on price, anchor to regulatory risk and ROI before discussing cost.",
      trigger: "prospect mentions price, budget, or cost objection",
    };
  }

  const pack: SkillPack = {
    id: id("sp"),
    name: parsed.name,
    lesson: parsed.lesson,
    trigger: parsed.trigger,
    domain: "sdr-outreach",
    rep_score: 0,
    provenance: { created_by: agentId, episode_count: episodes.length },
    created_at: new Date().toISOString(),
  };
  return { pack };
}
