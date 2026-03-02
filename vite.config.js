import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ── Dev proxy ────────────────────────────────────────────────────────────
  // During `npm run dev`, any request to /api/* is forwarded to the Express
  // server at localhost:5000. This avoids CORS issues in development and
  // means the frontend never needs to hard-code the backend URL.
  //
  // In production your reverse-proxy (nginx / Vercel rewrite / etc.) handles
  // this routing instead.
  server: {
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
