// FROZEN — do not edit. Both Person A and Person B build to these types.

export interface SkillPack {
  id: string;
  name: string;
  description: string;
  repScore: number;
  authorAgentId: string;
  installedBy: string[];
  createdAt: string;
}

export interface RateRequest {
  packId: string;
  agentId: string;
  score: number;
}

export type SearchResult = SkillPack[];

// Routes (reference — actual implementation in backend/api.ts and src/lib/api.ts)
// GET  /api/market/search?q=<string>  → SearchResult
// POST /api/market/rate               → SkillPack
// POST /api/market/publish            → SkillPack       (Person A)
// POST /api/market/install            → SkillPack       (Person A)
// POST /api/agent/run                 → AgentRunResult  (Person A)
