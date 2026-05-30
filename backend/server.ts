// ============================================================
// Minimal HTTP server exposing the 6 contract routes.
// Gives Person B real working endpoints without waiting for Butterbase.
// Run: npm run server  (reads .env)
// ============================================================
import "./env"; // load .env before any module reads process.env
import { createServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { API } from "../src/types/contract";
import { postRun, postReflect, postPublish, getSearch, postInstall, postRate } from "./api";
import { buildMarketMcpServer } from "./mcp";

const PORT = Number(process.env.PORT ?? 8787);

// strip the API.base prefix ("/api") if the frontend includes it
const BASE = (API.base ?? "/api").replace(/\/$/, "");

function json(res: import("node:http").ServerResponse, code: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    // CORS so B's Vite dev server can call us directly during dev
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function readBody(req: import("node:http").IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1_000_000) reject(new Error("body too large"));
    });
    req.on("end", () => resolve(raw ? JSON.parse(raw) : {}));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return json(res, 204, {});

    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    let path = url.pathname;

    // --- MCP connector: the channel agents use to reach the market ---
    // Stateless — fresh server+transport per request; shared state lives in
    // evermind's mirror + db's Map, so it persists across requests.
    if (path === "/mcp") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      const body = req.method === "POST" ? await readBody(req) : undefined;
      const mcp = buildMarketMcpServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => {
        transport.close().catch(() => {});
        mcp.close().catch(() => {});
      });
      await mcp.connect(transport);
      await transport.handleRequest(req, res, body);
      return;
    }

    if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length) || "/";

    if (req.method === "GET" && path === "/health") return json(res, 200, { ok: true });

    if (req.method === "GET" && path === API.search) {
      return json(res, 200, await getSearch(url.searchParams.get("q") ?? ""));
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      switch (path) {
        case API.run:     return json(res, 200, await postRun(body));
        case API.reflect: return json(res, 200, await postReflect(body));
        case API.publish: return json(res, 200, await postPublish(body));
        case API.install: return json(res, 200, await postInstall(body));
        case API.rate:    return json(res, 200, await postRate(body));
      }
    }

    json(res, 404, { error: `no route for ${req.method} ${path}` });
  } catch (err) {
    console.error("[server]", err);
    json(res, 500, { error: (err as Error).message });
  }
});

server.listen(PORT, () => {
  console.log(`Swarm Market backend on http://localhost:${PORT}`);
  console.log(`  MCP  POST http://localhost:${PORT}/mcp   <- agents connect here`);
  console.log(`  GET  ${BASE}/health`);
  for (const [k, v] of Object.entries(API)) {
    if (k === "base") continue;
    console.log(`  ${k === "search" ? "GET " : "POST"} ${BASE}${v}   <- UI`);
  }
});
