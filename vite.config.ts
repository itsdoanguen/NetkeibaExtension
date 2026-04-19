import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1', // Ép chạy trên IPv4
    hmr: {
      port: 5173,
      host: '127.0.0.1', // Bắt HMR kết nối qua IPv4
    },
  },
})