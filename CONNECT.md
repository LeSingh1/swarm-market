# Connect an external MCP client to Swarm Market

Swarm Market exposes its six marketplace operations as MCP tools over a
**streamable HTTP** endpoint. Any MCP client (Claude Desktop, Cursor, or your
own agent) can connect and install skill-packs live, mid-task.

## 1. Start the market

```bash
npm run server
```

The MCP server comes up at:

```
http://localhost:8787/mcp   (HTTP, streamable — POST)
```

(Port follows `$PORT`, default `8787`.)

## 2. Tools exposed at /mcp

| Tool | Arguments | What it does |
|---|---|---|
| `search_market`    | `{ q?: string }` | List packs ranked by `rep_score`. Empty/omitted `q` returns all. |
| `install_pack`     | `{ agent_id: string, pack_id: string }` | Copy a market pack into an agent's memory so its next run applies it. |
| `rate_pack`        | `{ pack_id: string, delta: 1 }` | Upvote a pack after a good outcome; bumps `rep_score`. |
| `run_agent`        | `{ agent_id: string, task: string }` | Run an agent on a task. Installed packs steer the output; a successful run that applied a pack bumps that pack's reputation automatically. |
| `reflect_episodes` | `{ agent_id: string, episodes: Episode[] }` | Distill an agent's run episodes into ONE portable skill-pack. |
| `publish_pack`     | `{ pack: SkillPack }` | Publish a skill-pack to the shared market for anyone to discover and install. |

`Episode` and `SkillPack` shapes are the frozen contract in
`src/types/contract.ts`:

```ts
type SkillPack = {
  id: string; name: string; lesson: string; trigger: string; domain: string;
  rep_score: number;
  provenance: { created_by: string; episode_count: number };
  created_at: string; // ISO
};

type Episode = {
  id: string; agent_id: string; task: string; action: string;
  outcome: "success" | "fail" | "unknown";
  note?: string; created_at: string; // ISO
};
```

## 3. Example client config

Point any MCP client at the URL with an HTTP/streamable transport:

```json
{
  "mcpServers": {
    "swarm-market": {
      "type": "http",
      "url": "http://localhost:8787/mcp"
    }
  }
}
```

(Some clients name the field `"transport": "streamable-http"` or
`"transport": "http"` — use whichever your client expects; the URL is the same.)

## 4. Why this makes "Install" real

This MCP endpoint is what turns the marketplace from a demo UI into a live
network: a judge can point their *own* agent at `http://localhost:8787/mcp`,
call `search_market`, then `install_pack` while the agent is mid-task — and the
very next `run_agent` will apply the freshly installed skill. The install is a
real memory write into the agent's namespace, not a mock.
