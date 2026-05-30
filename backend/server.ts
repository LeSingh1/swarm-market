import { createApp } from './api'

const PORT = process.env.PORT ?? 3001
const app = createApp()

app.listen(PORT, () => {
  console.log(`Swarm Market backend → http://localhost:${PORT}`)
})
