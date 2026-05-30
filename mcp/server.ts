import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { listPacks, getPack, savePack, ratePack } from '../backend/db.js'
import type { SkillPack } from '../src/types/contract.js'

const server = new McpServer({
  name: 'swarm-market',
  version: '1.0.0',
})

// Tool: search skill packs
server.tool(
  'search_packs',
  'Search the Swarm Market for skill packs by name or description. Returns matching packs an agent can install.',
  { q: z.string().optional().describe('Search query — filters by name and description. Omit to list all packs.') },
  async ({ q }) => {
    const all = await listPacks()
    const query = (q ?? '').toLowerCase().trim()
    const results = query
      ? all.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
      : all
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    }
  }
)

// Tool: get a single pack by id
server.tool(
  'get_pack',
  'Get details of a specific skill pack by its ID.',
  { packId: z.string().describe('The ID of the skill pack to retrieve.') },
  async ({ packId }) => {
    const pack = await getPack(packId)
    if (!pack) {
      return { content: [{ type: 'text', text: `No skill pack found with id "${packId}".` }], isError: true }
    }
    return { content: [{ type: 'text', text: JSON.stringify(pack, null, 2) }] }
  }
)

// Tool: install a pack for an agent (records the install, unlocks agent success)
server.tool(
  'install_pack',
  'Install a skill pack for an agent. After installing, the agent can perform tasks it previously failed at.',
  {
    packId: z.string().describe('The ID of the skill pack to install.'),
    agentId: z.string().describe('The ID of the agent installing the pack.'),
  },
  async ({ packId, agentId }) => {
    const pack = await getPack(packId)
    if (!pack) {
      return { content: [{ type: 'text', text: `Pack "${packId}" not found.` }], isError: true }
    }
    if (!pack.installedBy.includes(agentId)) {
      const updated: SkillPack = { ...pack, installedBy: [...pack.installedBy, agentId] }
      await savePack(updated)
      return {
        content: [{
          type: 'text',
          text: `✓ "${pack.name}" installed for agent ${agentId}. The agent can now use these skills.`,
        }],
      }
    }
    return {
      content: [{ type: 'text', text: `"${pack.name}" is already installed for agent ${agentId}.` }],
    }
  }
)

// Tool: rate a pack
server.tool(
  'rate_pack',
  'Rate a skill pack after using it. Updates the pack\'s reputation score in the marketplace.',
  {
    packId: z.string().describe('The ID of the skill pack to rate.'),
    agentId: z.string().describe('The ID of the agent submitting the rating.'),
    score: z.number().min(0).max(100).describe('Score from 0–100.'),
  },
  async ({ packId, agentId, score }) => {
    const updated = await ratePack(packId, score)
    if (!updated) {
      return { content: [{ type: 'text', text: `Pack "${packId}" not found.` }], isError: true }
    }
    return {
      content: [{
        type: 'text',
        text: `Rated "${updated.name}" ${score}/100 on behalf of ${agentId}. New rep score: ${updated.repScore}.`,
      }],
    }
  }
)

// Tool: publish a new skill pack
server.tool(
  'publish_pack',
  'Publish a new skill pack to the Swarm Market so other agents can discover and install it.',
  {
    name: z.string().describe('Short name of the skill pack.'),
    description: z.string().describe('What skills or capabilities this pack provides.'),
    authorAgentId: z.string().describe('The agent ID publishing this pack.'),
  },
  async ({ name, description, authorAgentId }) => {
    const pack: SkillPack = {
      id: `pack-${Date.now()}`,
      name,
      description,
      repScore: 50,
      authorAgentId,
      installedBy: [],
      createdAt: new Date().toISOString(),
    }
    await savePack(pack)
    return {
      content: [{
        type: 'text',
        text: `✓ Published "${name}" (id: ${pack.id}) to Swarm Market. Starting rep score: 50.`,
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
