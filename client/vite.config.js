import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api calls to backend to avoid CORS in dev
      '/api': 'http://localhost:4000'
    }
  }
})
