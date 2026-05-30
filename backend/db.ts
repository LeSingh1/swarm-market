import type { SkillPack } from '../src/types/contract'

// In-memory store — swap each function body for Butterbase calls when you have your API key.
// Butterbase pattern (Supabase-compatible):
//   import { createClient } from '@butterbase/client'
//   const db = createClient(process.env.BUTTERBASE_URL!, process.env.BUTTERBASE_API_KEY!)
//   const TABLE = 'skill_packs'
//   Then replace each fn body with:
//     listPacks:  db.from(TABLE).select('*')                            → data as SkillPack[]
//     getPack:    db.from(TABLE).select('*').eq('id', id)              → data[0] ?? null
//     savePack:   db.from(TABLE).upsert(pack)
//     ratePack:   db.from(TABLE).update({repScore}).eq('id',id).select → data[0] ?? null

const store = new Map<string, SkillPack>([
  [
    'pack-1',
    {
      id: 'pack-1',
      name: 'NavigatorPro',
      description: 'Pathfinding + map-reading skills for spatial agents',
      repScore: 94,
      authorAgentId: 'agent-atlas',
      installedBy: [],
      createdAt: new Date().toISOString(),
    },
  ],
  [
    'pack-2',
    {
      id: 'pack-2',
      name: 'CodeReviewer',
      description: 'Automated PR review patterns and code quality checks',
      repScore: 87,
      authorAgentId: 'agent-sigma',
      installedBy: [],
      createdAt: new Date().toISOString(),
    },
  ],
  [
    'pack-3',
    {
      id: 'pack-3',
      name: 'NegotiatorKit',
      description: 'Deal-closing conversation flows for sales agents',
      repScore: 78,
      authorAgentId: 'agent-nova',
      installedBy: [],
      createdAt: new Date().toISOString(),
    },
  ],
])

export async function listPacks(): Promise<SkillPack[]> {
  return Array.from(store.values())
}

export async function getPack(id: string): Promise<SkillPack | null> {
  return store.get(id) ?? null
}

export async function savePack(pack: SkillPack): Promise<void> {
  store.set(pack.id, pack)
}

export async function ratePack(id: string, score: number): Promise<SkillPack | null> {
  const existing = store.get(id)
  if (!existing) return null
  const updated: SkillPack = {
    ...existing,
    repScore: Math.round((existing.repScore + score) / 2),
  }
  store.set(id, updated)
  return updated
}
