# Swarm Market Backend Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the search and rate backend routes + Butterbase db layer for the Swarm Market hackathon project.

**Architecture:** Express.js server in `backend/` exposes two routes under `/api/market`. A thin db layer in `backend/db.ts` wraps all Butterbase calls so routes never touch the client directly. Types are imported from the frozen `src/types/contract.ts`.

**Tech Stack:** Node.js 18+, Express 4, TypeScript 5, ts-node-dev (dev server), Vitest (tests), Butterbase JS client.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/contract.ts` | **FROZEN — read only** | SkillPack type + route shapes |
| `backend/db.ts` | Create | All Butterbase reads/writes |
| `backend/api.ts` | Create | GET /market/search, POST /market/rate |
| `backend/server.ts` | Create | Express app + mount routes |
| `backend/db.test.ts` | Create | Unit tests for db layer (mocked) |
| `backend/api.test.ts` | Create | Integration tests for routes (supertest) |
| `package.json` | Modify | Add express, ts-node-dev, supertest deps |
| `tsconfig.json` | Modify | Include backend/ in compilation |
| `vite.config.ts` | Modify | Proxy /api → Express port 3001 |

---

## Task 1: Scaffold the project (skip if repo already exists)

**Files:**
- Create: `C:\Users\raj_k\Desktop\swarm-market\` (project root)

- [ ] **Step 1: Create project with Vite**

```powershell
cd C:\Users\raj_k\Desktop
npm create vite@latest swarm-market -- --template react-ts
cd swarm-market
npm install
```

- [ ] **Step 2: Add backend dependencies**

```powershell
npm install express cors
npm install --save-dev @types/express @types/cors ts-node-dev supertest @types/supertest vitest
```

- [ ] **Step 3: Add Tailwind CSS**

```powershell
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 4: Update tailwind.config.js**

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Add Tailwind directives to src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold vite react-ts + express + tailwind"
```

---

## Task 2: Define contract types (src/types/contract.ts)

**Files:**
- Create: `src/types/contract.ts`

> After this task, treat this file as FROZEN. Never edit it again.

- [ ] **Step 1: Create the file**

```typescript
// src/types/contract.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/contract.ts
git commit -m "feat: add frozen contract types"
```

---

## Task 3: Configure TypeScript and Vite proxy

**Files:**
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`
- Create: `tsconfig.backend.json`

- [ ] **Step 1: Create tsconfig.backend.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist/backend",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "paths": {
      "src/types/*": ["./src/types/*"]
    }
  },
  "include": ["backend/**/*", "src/types/**/*"]
}
```

- [ ] **Step 2: Update vite.config.ts to proxy /api to Express**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

- [ ] **Step 3: Add backend dev script to package.json**

Open `package.json` and add to `"scripts"`:
```json
"dev:backend": "ts-node-dev --project tsconfig.backend.json --respawn backend/server.ts",
"dev:all": "concurrently \"npm run dev\" \"npm run dev:backend\""
```

Then install concurrently:
```powershell
npm install --save-dev concurrently
```

- [ ] **Step 4: Commit**

```bash
git add tsconfig.backend.json vite.config.ts package.json
git commit -m "feat: configure ts backend build + vite proxy"
```

---

## Task 4: Implement Butterbase db layer (backend/db.ts)

**Files:**
- Create: `backend/db.ts`

> Butterbase is the hackathon database. Install their client first.
> Run: `npm install @butterbase/client` (check butterbase.com for exact package name).
> Get your API key from the Butterbase dashboard and put it in `.env` as `BUTTERBASE_API_KEY=<key>` and `BUTTERBASE_TABLE=skill_packs`.

- [ ] **Step 1: Write the failing db tests**

Create `backend/db.test.ts`:
```typescript
// backend/db.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Butterbase before importing db
vi.mock('@butterbase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockReturnThis(),
    })),
  })),
}))

import { listPacks, getPack, savePack, ratePack } from './db'
import type { SkillPack } from '../src/types/contract'

const mockPack: SkillPack = {
  id: 'pack-1',
  name: 'NavigatorPro',
  description: 'Pathfinding skills',
  repScore: 80,
  authorAgentId: 'agent-atlas',
  installedBy: [],
  createdAt: '2026-05-30T00:00:00Z',
}

describe('listPacks', () => {
  it('returns an array', async () => {
    const result = await listPacks()
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('getPack', () => {
  it('returns null for missing pack', async () => {
    const result = await getPack('nonexistent')
    expect(result).toBeNull()
  })
})

describe('savePack', () => {
  it('accepts a valid SkillPack without throwing', async () => {
    await expect(savePack(mockPack)).resolves.not.toThrow()
  })
})

describe('ratePack', () => {
  it('returns null for nonexistent pack', async () => {
    const result = await ratePack('nonexistent', 90)
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL (db.ts doesn't exist yet)**

```powershell
npx vitest run backend/db.test.ts
```

Expected: FAIL — `Cannot find module './db'`

- [ ] **Step 3: Install Butterbase client**

```powershell
npm install @butterbase/client
```

> If the package name differs, check butterbase.com/docs. The pattern below uses a Supabase-compatible interface — adjust `createClient`, `.from()`, `.select()`, `.eq()`, `.upsert()`, `.update()` if Butterbase's API differs.

- [ ] **Step 4: Create backend/db.ts**

```typescript
// backend/db.ts
import { createClient } from '@butterbase/client'
import type { SkillPack } from '../src/types/contract'

const db = createClient(
  process.env.BUTTERBASE_URL ?? '',
  process.env.BUTTERBASE_API_KEY ?? ''
)
const TABLE = process.env.BUTTERBASE_TABLE ?? 'skill_packs'

export async function listPacks(): Promise<SkillPack[]> {
  const { data, error } = await db.from(TABLE).select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as SkillPack[]
}

export async function getPack(id: string): Promise<SkillPack | null> {
  const { data, error } = await db.from(TABLE).select('*').eq('id', id)
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return null
  return data[0] as SkillPack
}

export async function savePack(pack: SkillPack): Promise<void> {
  const { error } = await db.from(TABLE).upsert(pack)
  if (error) throw new Error(error.message)
}

export async function ratePack(id: string, score: number): Promise<SkillPack | null> {
  const existing = await getPack(id)
  if (!existing) return null
  // Compute new running average: (oldScore + newScore) / 2
  const newRepScore = Math.round((existing.repScore + score) / 2)
  const { data, error } = await db
    .from(TABLE)
    .update({ repScore: newRepScore })
    .eq('id', id)
    .select('*')
  if (error) throw new Error(error.message)
  return (data?.[0] ?? null) as SkillPack | null
}
```

- [ ] **Step 5: Add .env file (never commit)**

Create `.env` in project root:
```
BUTTERBASE_URL=https://your-project.butterbase.io
BUTTERBASE_API_KEY=your_key_here
BUTTERBASE_TABLE=skill_packs
```

Add to `.gitignore`:
```
.env
```

- [ ] **Step 6: Run tests — expect PASS**

```powershell
npx vitest run backend/db.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/db.ts backend/db.test.ts .gitignore
git commit -m "feat: add butterbase db layer with listPacks/getPack/savePack/ratePack"
```

---

## Task 5: Implement Express routes (backend/api.ts)

**Files:**
- Create: `backend/api.ts`
- Create: `backend/api.test.ts`

- [ ] **Step 1: Write the failing route tests**

Create `backend/api.test.ts`:
```typescript
// backend/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import type { SkillPack } from '../src/types/contract'

// Mock db layer
vi.mock('./db', () => ({
  listPacks: vi.fn(),
  getPack: vi.fn(),
  ratePack: vi.fn(),
}))

import { listPacks, getPack, ratePack } from './db'
import { createApp } from './api'

const mockPacks: SkillPack[] = [
  {
    id: 'pack-1',
    name: 'NavigatorPro',
    description: 'Pathfinding skills',
    repScore: 90,
    authorAgentId: 'agent-atlas',
    installedBy: [],
    createdAt: '2026-05-30T00:00:00Z',
  },
  {
    id: 'pack-2',
    name: 'CodeReviewer',
    description: 'Automated PR review patterns',
    repScore: 75,
    authorAgentId: 'agent-sigma',
    installedBy: [],
    createdAt: '2026-05-30T00:00:00Z',
  },
]

describe('GET /market/search', () => {
  beforeEach(() => {
    vi.mocked(listPacks).mockResolvedValue(mockPacks)
  })

  it('returns all packs when q is empty', async () => {
    const app = createApp()
    const res = await request(app).get('/market/search')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('filters by name (case-insensitive)', async () => {
    const app = createApp()
    const res = await request(app).get('/market/search?q=nav')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('NavigatorPro')
  })

  it('filters by description', async () => {
    const app = createApp()
    const res = await request(app).get('/market/search?q=PR review')
    expect(res.status).toBe(200)
    expect(res.body[0].name).toBe('CodeReviewer')
  })

  it('returns empty array when no match', async () => {
    const app = createApp()
    const res = await request(app).get('/market/search?q=zzznomatch')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

describe('POST /market/rate', () => {
  it('returns updated pack on success', async () => {
    const updated = { ...mockPacks[0], repScore: 95 }
    vi.mocked(ratePack).mockResolvedValue(updated)
    const app = createApp()
    const res = await request(app)
      .post('/market/rate')
      .send({ packId: 'pack-1', agentId: 'agent-x', score: 100 })
    expect(res.status).toBe(200)
    expect(res.body.repScore).toBe(95)
    expect(res.body.id).toBe('pack-1')
  })

  it('returns 404 for nonexistent packId', async () => {
    vi.mocked(ratePack).mockResolvedValue(null)
    const app = createApp()
    const res = await request(app)
      .post('/market/rate')
      .send({ packId: 'bad-id', agentId: 'agent-x', score: 80 })
    expect(res.status).toBe(404)
  })

  it('returns 400 when body fields are missing', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/market/rate')
      .send({ packId: 'pack-1' }) // missing agentId and score
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```powershell
npx vitest run backend/api.test.ts
```

Expected: FAIL — `Cannot find module './api'` or `createApp is not a function`

- [ ] **Step 3: Implement backend/api.ts**

```typescript
// backend/api.ts
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { listPacks, ratePack } from './db'
import type { RateRequest } from '../src/types/contract'

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  // GET /market/search?q=<string>
  app.get('/market/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = ((req.query.q as string) ?? '').toLowerCase().trim()
      const all = await listPacks()
      const results = q
        ? all.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
          )
        : all
      res.json(results)
    } catch (err) {
      next(err)
    }
  })

  // POST /market/rate
  app.post('/market/rate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { packId, agentId, score } = req.body as Partial<RateRequest>
      if (!packId || !agentId || score === undefined) {
        res.status(400).json({ error: 'packId, agentId, and score are required' })
        return
      }
      const updated = await ratePack(packId, score)
      if (!updated) {
        res.status(404).json({ error: `SkillPack ${packId} not found` })
        return
      }
      res.json(updated)
    } catch (err) {
      next(err)
    }
  })

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
```

- [ ] **Step 4: Run tests — expect PASS**

```powershell
npx vitest run backend/api.test.ts
```

Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/api.ts backend/api.test.ts
git commit -m "feat: add search and rate routes with full test coverage"
```

---

## Task 6: Wire up the Express server entry point

**Files:**
- Create: `backend/server.ts`

- [ ] **Step 1: Create backend/server.ts**

```typescript
// backend/server.ts
import 'dotenv/config'
import { createApp } from './api'

const PORT = process.env.PORT ?? 3001
const app = createApp()

app.listen(PORT, () => {
  console.log(`Swarm Market backend running on http://localhost:${PORT}`)
})
```

- [ ] **Step 2: Install dotenv**

```powershell
npm install dotenv
```

- [ ] **Step 3: Start backend and smoke-test**

```powershell
npx ts-node-dev --project tsconfig.backend.json backend/server.ts
```

In a second terminal:
```powershell
# Should return JSON array
curl http://localhost:3001/market/search

# Should return filtered result (assuming "NavigatorPro" exists in DB)
curl "http://localhost:3001/market/search?q=nav"

# Should return 400
curl -X POST http://localhost:3001/market/rate -H "Content-Type: application/json" -d "{}"
```

- [ ] **Step 4: Commit**

```bash
git add backend/server.ts package.json
git commit -m "feat: add express server entry point"
```

---

## Task 7: Seed Butterbase with fixture packs (so the UI has data)

**Files:**
- Create: `backend/seed.ts`

- [ ] **Step 1: Create seed script**

```typescript
// backend/seed.ts
import 'dotenv/config'
import { savePack } from './db'
import type { SkillPack } from '../src/types/contract'

const fixtures: SkillPack[] = [
  {
    id: 'pack-1',
    name: 'NavigatorPro',
    description: 'Pathfinding + map-reading skills for spatial agents',
    repScore: 94,
    authorAgentId: 'agent-atlas',
    installedBy: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pack-2',
    name: 'CodeReviewer',
    description: 'Automated PR review patterns and code quality checks',
    repScore: 87,
    authorAgentId: 'agent-sigma',
    installedBy: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pack-3',
    name: 'NegotiatorKit',
    description: 'Deal-closing conversation flows for sales agents',
    repScore: 78,
    authorAgentId: 'agent-nova',
    installedBy: [],
    createdAt: new Date().toISOString(),
  },
]

async function seed() {
  for (const pack of fixtures) {
    await savePack(pack)
    console.log(`Seeded: ${pack.name}`)
  }
  console.log('Done.')
}

seed().catch(console.error)
```

- [ ] **Step 2: Run seed**

```powershell
npx ts-node-dev --project tsconfig.backend.json backend/seed.ts
```

Expected output:
```
Seeded: NavigatorPro
Seeded: CodeReviewer
Seeded: NegotiatorKit
Done.
```

- [ ] **Step 3: Verify search returns seeded data**

```powershell
curl "http://localhost:3001/market/search?q=nav"
```

Expected: JSON array with NavigatorPro only.

- [ ] **Step 4: Commit**

```bash
git add backend/seed.ts
git commit -m "feat: add db seed script with fixture packs"
```

---

## Self-Review

**Spec coverage:**
- [x] GET /market/search?q= → SkillPack[] — Task 5
- [x] POST /market/rate → updated SkillPack — Task 5
- [x] listPacks() — Task 4
- [x] getPack(id) — Task 4
- [x] savePack(p) — Task 4
- [x] ratePack(id, score) — Task 4
- [x] Butterbase swaps — Task 4
- [x] Filter by name/description — Task 5 test + implementation
- [x] Graceful missing q → returns all — Task 5 test
- [x] Graceful nonexistent packId → 404 — Task 5 test
- [x] Missing body fields → 400 — Task 5 test
- [x] contract.ts never edited — enforced by file map note

**No placeholders found.**

**Type consistency:** `SkillPack`, `RateRequest` imported from `contract.ts` throughout. `ratePack(id: string, score: number)` consistent in db.ts and api.ts. `listPacks`, `getPack`, `savePack`, `ratePack` names consistent across db.ts, db.test.ts, api.ts, api.test.ts.
