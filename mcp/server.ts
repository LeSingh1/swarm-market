import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { listPacks, getPack, upsertPack, bumpRep } from '../backend/db.js'
import type { SkillPack } from '../src/types/contract.js'

const server = new McpServer({
  name: 'swarm-market',
  version: '1.0.0',
})

server.tool(
  'search_packs',
  'Search the Swarm Market for skill packs by name, lesson, or domain. Returns packs ranked by rep score.',
  { q: z.string().optional().describe('Search query. Omit to list all packs.') },
  async ({ q }) => {
    const all = await listPacks()
    const query = (q ?? '').toLowerCase()
    const results = query
      ? all.filter(p => `${p.name} ${p.lesson} ${p.domain}`.toLowerCase().includes(query))
      : all
    results.sort((a, b) => b.rep_score - a.rep_score)
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
  }
)

server.tool(
  'get_pack',
  'Get a specific skill pack by ID.',
  { pack_id: z.string().describe('ID of the skill pack.') },
  async ({ pack_id }) => {
    try {
      const pack = await getPack(pack_id)
      return { content: [{ type: 'text', text: JSON.stringify(pack, null, 2) }] }
    } catch {
      return { content: [{ type: 'text', text: `No pack found with id "${pack_id}".` }], isError: true }
    }
  }
)

server.tool(
  'install_pack',
  'Install a skill pack for an agent. After installing, the agent can draw on this skill in future runs.',
  {
    pack_id: z.string().describe('ID of the pack to install.'),
    agent_id: z.string().describe('ID of the agent installing the pack.'),
  },
  async ({ pack_id, agent_id }) => {
    try {
      const pack = await getPack(pack_id)
      return {
        content: [{
          type: 'text',
          text: `✓ "${pack.name}" installed for ${agent_id}. Lesson: ${pack.lesson}`,
        }],
      }
    } catch {
      return { content: [{ type: 'text', text: `Pack "${pack_id}" not found.` }], isError: true }
    }
  }
)

server.tool(
  'rate_pack',
  'Rate a skill pack +1 rep after a successful outcome. Increases its visibility in the marketplace.',
  {
    pack_id: z.string().describe('ID of the pack to rate.'),
    agent_id: z.string().describe('ID of the agent submitting the rating.'),
  },
  async ({ pack_id, agent_id }) => {
    try {
      const updated = await bumpRep(pack_id, 1)
      return {
        content: [{
          type: 'text',
          text: `Rated "${updated.name}" on behalf of ${agent_id}. New rep score: ${updated.rep_score}.`,
        }],
      }
    } catch {
      return { content: [{ type: 'text', text: `Pack "${pack_id}" not found.` }], isError: true }
    }
  }
)

server.tool(
  'publish_pack',
  'Publish a new skill pack to the Swarm Market so other agents can discover and install it.',
  {
    name: z.string().describe('Short name of the skill pack.'),
    lesson: z.string().describe('Distilled, portable lesson — what the agent learned.'),
    trigger: z.string().describe('When this skill should fire (e.g. "price objection from fintech prospect").'),
    domain: z.string().describe('Domain tag, e.g. "sdr-outreach".'),
    author_agent_id: z.string().describe('Agent ID publishing this pack.'),
  },
  async ({ name, lesson, trigger, domain, author_agent_id }) => {
    const pack: SkillPack = {
      id: `sp_${Date.now()}`,
      name,
      lesson,
      trigger,
      domain,
      rep_score: 0,
      provenance: { created_by: author_agent_id, episode_count: 1 },
      created_at: new Date().toISOString(),
    }
    await upsertPack(pack)
    return {
      content: [{
        type: 'text',
        text: `✓ Published "${name}" (id: ${pack.id}) to Swarm Market.`,
      }],
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Swarm Market MCP server running on stdio')
}

main().catch(console.error)
