import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SkillPack } from '../src/types/contract'

vi.mock('./db', () => ({
  listPacks: vi.fn(),
  getPack: vi.fn(),
  upsertPack: vi.fn(),
  bumpRep: vi.fn(),
  logRun: vi.fn(),
  logInstall: vi.fn(),
}))

import { listPacks, bumpRep } from './db'
import { getSearch, postRate } from './api'

const mockPacks: SkillPack[] = [
  {
    id: 'sp_1',
    name: 'Fintech objection: lead with compliance',
    lesson: 'Pivot to compliance risk reduction first, then TCO.',
    trigger: 'price objection from fintech prospect',
    domain: 'sdr-outreach',
    rep_score: 12,
    provenance: { created_by: 'agent_publisher', episode_count: 3 },
    created_at: '2026-05-30T00:00:00Z',
  },
  {
    id: 'sp_2',
    name: 'Cold open: mutual connection hook',
    lesson: 'Open by naming a mutual connection or shared context.',
    trigger: 'cold outreach with no prior relationship',
    domain: 'sdr-outreach',
    rep_score: 8,
    provenance: { created_by: 'agent_publisher', episode_count: 2 },
    created_at: '2026-05-30T00:00:00Z',
  },
]

describe('getSearch', () => {
  beforeEach(() => vi.mocked(listPacks).mockResolvedValue(mockPacks))

  it('returns all packs ranked by rep_score when q is empty', async () => {
    const { packs } = await getSearch('')
    expect(packs).toHaveLength(2)
    expect(packs[0].rep_score).toBeGreaterThanOrEqual(packs[1].rep_score)
  })

  it('filters by name (case-insensitive)', async () => {
    const { packs } = await getSearch('fintech')
    expect(packs).toHaveLength(1)
    expect(packs[0].id).toBe('sp_1')
  })

  it('filters by lesson text', async () => {
    const { packs } = await getSearch('mutual connection')
    expect(packs).toHaveLength(1)
    expect(packs[0].id).toBe('sp_2')
  })

  it('returns empty array for no match', async () => {
    const { packs } = await getSearch('zzznomatch')
    expect(packs).toHaveLength(0)
  })
})

describe('postRate', () => {
  it('returns updated pack after bumping rep', async () => {
    const updated = { ...mockPacks[0], rep_score: 13 }
    vi.mocked(bumpRep).mockResolvedValue(updated)
    const { pack } = await postRate({ pack_id: 'sp_1', delta: 1 })
    expect(pack.rep_score).toBe(13)
    expect(pack.id).toBe('sp_1')
  })

  it('throws when pack not found', async () => {
    vi.mocked(bumpRep).mockRejectedValue(new Error('pack bad not found'))
    await expect(postRate({ pack_id: 'bad', delta: 1 })).rejects.toThrow('not found')
  })
})
