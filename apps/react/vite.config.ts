import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      open: false,
      // Dev requests to /api are forwarded to the Express backend,
      // so the browser never has to deal with CORS or absolute URLs.
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
