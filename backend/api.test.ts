import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import type { SkillPack } from '../src/types/contract'

vi.mock('./db', () => ({
  listPacks: vi.fn(),
  ratePack: vi.fn(),
}))

import { listPacks, ratePack } from './db'
import { createApp } from './api'

const mockPacks: SkillPack[] = [
  {
    id: 'pack-1',
    name: 'NavigatorPro',
    description: 'Pathfinding + map-reading skills',
    repScore: 94,
    authorAgentId: 'agent-atlas',
    installedBy: [],
    createdAt: '2026-05-30T00:00:00Z',
  },
  {
    id: 'pack-2',
    name: 'CodeReviewer',
    description: 'Automated PR review patterns',
    repScore: 87,
    authorAgentId: 'agent-sigma',
    installedBy: [],
    createdAt: '2026-05-30T00:00:00Z',
  },
]

describe('GET /market/search', () => {
  beforeEach(() => {
    vi.mocked(listPacks).mockResolvedValue(mockPacks)
  })

  it('returns all packs when q is absent', async () => {
    const res = await request(createApp()).get('/market/search')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('returns all packs when q is empty string', async () => {
    const res = await request(createApp()).get('/market/search?q=')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('filters by name case-insensitively', async () => {
    const res = await request(createApp()).get('/market/search?q=nav')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('NavigatorPro')
  })

  it('filters by description', async () => {
    const res = await request(createApp()).get('/market/search?q=PR review')
    expect(res.status).toBe(200)
    expect(res.body[0].name).toBe('CodeReviewer')
  })

  it('returns empty array when no match', async () => {
    const res = await request(createApp()).get('/market/search?q=zzznomatch')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

describe('POST /market/rate', () => {
  it('returns 400 when body fields are missing', async () => {
    const res = await request(createApp())
      .post('/market/rate')
      .send({ packId: 'pack-1' })
    expect(res.status).toBe(400)
  })

  it('returns 404 for nonexistent packId', async () => {
    vi.mocked(ratePack).mockResolvedValue(null)
    const res = await request(createApp())
      .post('/market/rate')
      .send({ packId: 'bad', agentId: 'agent-x', score: 80 })
    expect(res.status).toBe(404)
  })

  it('returns updated pack with new repScore', async () => {
    const updated = { ...mockPacks[0], repScore: 97 }
    vi.mocked(ratePack).mockResolvedValue(updated)
    const res = await request(createApp())
      .post('/market/rate')
      .send({ packId: 'pack-1', agentId: 'agent-x', score: 100 })
    expect(res.status).toBe(200)
    expect(res.body.repScore).toBe(97)
    expect(res.body.id).toBe('pack-1')
  })
})
