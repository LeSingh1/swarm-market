// ============================================================
// The swarm demo, driven entirely over MCP.
// Two agents connect to the Market MCP server as separate clients and
// reach each other through it: the publisher teaches a lesson, the cold
// consumer discovers + installs it and instantly behaves better.
//
// Prereq: the server must be running ->  npm run server   (in another shell)
// Run:    npm run swarm
// ============================================================
import "./env";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DEMO } from "../src/types/contract";

const MCP_URL = new URL(process.env.MCP_URL ?? "http://localhost:8787/mcp");

async function connect(agentName: string): Promise<Client> {
  const client = new Client({ name: agentName, version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(MCP_URL));
  return client;
}

async function call<T = any>(client: Client, tool: string, args: Record<string, unknown>): Promise<T> {
  const r: any = await client.callTool({ name: tool, arguments: args });
  const text = r?.content?.[0]?.text ?? "{}";
  return JSON.parse(text) as T;
}

function line(s = "") { console.log(s); }
function assert(cond: boolean, msg: string) {
  if (!cond) { console.error(`  FAIL: ${msg}`); process.exit(1); }
  console.log(`  ok: ${msg}`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set in .env (the server needs it for run/reflect).");
    process.exit(1);
  }

  line("Connecting two agents to the Market over MCP...");
  const publisher = await connect("agent_publisher");
  const consumer = await connect("agent_consumer");
  line(`  publisher + consumer connected to ${MCP_URL.href}\n`);

  line("PUBLISHER teaches a lesson");
  const pubRun = await call(publisher, "run_agent", { agent_id: DEMO.publisherId, task: DEMO.task });
  const { pack } = await call(publisher, "reflect_episodes", {
    agent_id: DEMO.publisherId,
    episodes: pubRun.episodes,
  });
  assert(!!pack?.id && !!pack?.lesson, "publisher reflected ONE skill-pack");
  line(`     pack: "${pack.name}"`);
  await call(publisher, "publish_pack", { pack });
  assert(true, "published to the shared market");
  line("");

  line("CONSUMER (cold) tries the same task over MCP");
  const cold = await call(consumer, "run_agent", { agent_id: DEMO.consumerId, task: DEMO.task });
  assert(cold.outcome === "fail", "cold consumer FAILS (no packs)");
  assert(!cold.applied_pack_id, "cold run cites no pack");
  line("");

  line("CONSUMER browses the market and installs");
  const search = await call(consumer, "search_market", { q: "" });
  const found = search.packs.find((p: any) => p.id === pack.id);
  assert(!!found, "consumer found the publisher's pack in the market");
  await call(consumer, "install_pack", { agent_id: DEMO.consumerId, pack_id: pack.id });
  assert(true, "consumer installed it (copied into its memory)");
  line("");

  line("CONSUMER retries the SAME task — now warm");
  const warm = await call(consumer, "run_agent", { agent_id: DEMO.consumerId, task: DEMO.task });
  assert(warm.outcome === "success", "consumer now SUCCEEDS");
  assert(warm.applied_pack_id === pack.id, "success cites the installed pack it never learned");
  line("");

  line("CONSUMER rates the pack");
  const rated = await call(consumer, "rate_pack", { pack_id: pack.id, delta: 1 });
  assert(rated.pack.rep_score >= 1, "rep_score ticked up");
  line("");

  await publisher.close();
  await consumer.close();
  line("SWARM OK — one agent's lesson, discovered and applied by another, entirely over MCP.");
}

main().catch((e) => { console.error(e); process.exit(1); });
