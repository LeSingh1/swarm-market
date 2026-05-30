// ============================================================
// Market MCP server — the connector agents use to reach each other.
// Exposes the 6 marketplace ops as MCP tools, each delegating to the
// SAME api.ts handlers the HTTP/UI routes use. One brain, two faces.
//
// Stateless: a fresh McpServer is built per request (see server.ts).
// Shared state lives in evermind's mirror + db's Map (module-level),
// so it persists across requests regardless of MCP session.
// ============================================================
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { postRun, postReflect, postPublish, getSearch, postInstall, postRate } from "./api";

// zod shapes mirroring the FROZEN contract types
const zPack = z.object({
  id: z.string(),
  name: z.string(),
  lesson: z.string(),
  trigger: z.string(),
  domain: z.string(),
  rep_score: z.number(),
  provenance: z.object({ created_by: z.string(), episode_count: z.number() }),
  created_at: z.string(),
});

const zEpisode = z.object({
  id: z.string(),
  agent_id: z.string(),
  task: z.string(),
  action: z.string(),
  outcome: z.enum(["success", "fail", "unknown"]),
  note: z.string().optional(),
  created_at: z.string(),
});

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data) }] });

export function buildMarketMcpServer(): McpServer {
  const server = new McpServer(
    { name: "swarm-market", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "run_agent",
    {
      description:
        "Run an agent on a task. Pulls the agent's installed skill-packs from the market and lets them steer output. Cold agent (no packs) fails; an agent with an installed pack succeeds and cites it.",
      inputSchema: { agent_id: z.string(), task: z.string() },
    },
    async ({ agent_id, task }) => ok(await postRun({ agent_id, task })),
  );

  server.registerTool(
    "reflect_episodes",
    {
      description:
        "Distill an agent's run episodes into ONE portable skill-pack another agent could install.",
      inputSchema: { agent_id: z.string(), episodes: z.array(zEpisode) },
    },
    async ({ agent_id, episodes }) => ok(await postReflect({ agent_id, episodes })),
  );

  server.registerTool(
    "publish_pack",
    {
      description: "Publish a skill-pack to the shared market so any agent can discover and install it.",
      inputSchema: { pack: zPack },
    },
    async ({ pack }) => ok(await postPublish({ pack })),
  );

  server.registerTool(
    "search_market",
    {
      description: "Search the market for skill-packs, ranked by rep_score. Empty query returns all.",
      inputSchema: { q: z.string().optional() },
    },
    async ({ q }) => ok(await getSearch(q ?? "")),
  );

  server.registerTool(
    "install_pack",
    {
      description: "Install a market pack into an agent's own memory so its next run applies it.",
      inputSchema: { agent_id: z.string(), pack_id: z.string() },
    },
    async ({ agent_id, pack_id }) => ok(await postInstall({ agent_id, pack_id })),
  );

  server.registerTool(
    "rate_pack",
    {
      description: "Upvote a pack after a good outcome. Bumps its rep_score and keeps the market copy in sync.",
      inputSchema: { pack_id: z.string(), delta: z.literal(1) },
    },
    async ({ pack_id, delta }) => ok(await postRate({ pack_id, delta })),
  );

  return server;
}
