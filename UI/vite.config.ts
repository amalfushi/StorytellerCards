import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// When running behind a public tunnel (cloudflared / localtunnel) the request
// Host header is the tunnel's *.trycloudflare.com / *.loca.lt domain, which
// Vite blocks by default. `VITE_ALLOW_ALL_HOSTS=1` opens the door for any
// tunnel host — only set it for the `dev:tunnel` script.
const allowAllHosts =
  process.env.VITE_ALLOW_ALL_HOSTS === '1' || process.env.VITE_ALLOW_ALL_HOSTS === 'true';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    ...(allowAllHosts ? { allowedHosts: true as const } : {}),
    proxy: {
      '/api': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
