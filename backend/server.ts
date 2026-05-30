import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { getSearch, postRate, postPublish } from './api'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/market/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) ?? ''
    res.json(await getSearch(q))
  } catch (err) { next(err) }
})

app.post('/market/rate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pack_id, delta } = req.body
    if (!pack_id || delta === undefined) {
      res.status(400).json({ error: 'pack_id and delta are required' })
      return
    }
    try {
      res.json(await postRate({ pack_id, delta }))
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('not found')) {
        res.status(404).json({ error: e.message })
      } else { throw e }
    }
  } catch (err) { next(err) }
})

app.post('/market/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pack } = req.body
    if (!pack) { res.status(400).json({ error: 'pack is required' }); return }
    res.json(await postPublish({ pack }))
  } catch (err) { next(err) }
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => console.log(`Swarm Market backend → http://localhost:${PORT}`))
