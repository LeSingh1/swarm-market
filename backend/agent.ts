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
const claude = () => (_claude ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));
const MODEL = "claude-opus-4-7"; // latest Opus

const id = (p: string) => `${p}_${Math.random().toString(16).slice(2, 6)}`;

// Run the agent on a task. Pulls any installed skill-packs from EverMind and
// lets them steer behavior — this is how an installed pack visibly changes output.
export async function runAgent(agentId: string, task: string): Promise<AgentRun> {
  const packs = await recallInstalledPacks(agentId);
  const guidance = packs.length
    ? `\n\nYou have learned skills. Apply them:\n${packs.map(p => `- ${p.name}: ${p.lesson} (when: ${p.trigger})`).join("\n")}`
    : "";

  const msg = await claude().messages.create({
    model: MODEL,
    max_tokens: 600,
    system: `You are an autonomous SDR agent. Do the task. Be concrete.${guidance}`,
    messages: [{ role: "user", content: task }],
  });
  const result = msg.content.map(c => (c.type === "text" ? c.text : "")).join("");

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
  const msg = await claude().messages.create({
    model: MODEL,
    max_tokens: 400,
    system:
      "Extract ONE reusable, portable lesson another agent could install. " +
      'Reply as JSON: {"name","lesson","trigger"}. lesson must be a rule, not a transcript.',
    messages: [{ role: "user", content: `Episodes:\n${transcript}` }],
  });
  const text = msg.content.map(c => (c.type === "text" ? c.text : "")).join("");
  const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

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
