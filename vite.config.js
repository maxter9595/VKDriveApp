import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { aliases } from './frontend/src/config/aliases.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')  
  const port = parseInt(env.VITE_CLIENT_PORT) || 5173
  
  return {
    plugins: [react()],
    resolve: {
      alias: aliases
    },
    server: {
      port: port,
      host: true
    }
  }
})
