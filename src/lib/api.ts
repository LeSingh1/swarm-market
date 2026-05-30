import type { SkillPack, RateRequest, SearchResult } from '../types/contract'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export async function search(q?: string): Promise<SearchResult> {
  const url = `${BASE}/market/search${q ? `?q=${encodeURIComponent(q)}` : ''}`
  return json<SearchResult>(await fetch(url))
}

export async function rate(req: RateRequest): Promise<SkillPack> {
  return json<SkillPack>(
    await fetch(`${BASE}/market/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
  )
}

// Stubs for Person A's routes — swap in real impl when their API is live
export async function publish(_pack: Omit<SkillPack, 'id' | 'createdAt' | 'repScore' | 'installedBy'>): Promise<SkillPack> {
  throw new Error('publish: waiting on Person A')
}

export async function install(_packId: string, _agentId: string): Promise<SkillPack> {
  throw new Error('install: waiting on Person A')
}

export async function runAgent(_agentId: string): Promise<{ success: boolean; output: string }> {
  throw new Error('runAgent: waiting on Person A')
}
