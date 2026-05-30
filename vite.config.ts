import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // UI calls /api/* -> backend server (server.ts) which serves the /api prefix.
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
})
