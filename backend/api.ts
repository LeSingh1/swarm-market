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

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
