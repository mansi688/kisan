import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4000',
        changeOrigin: true,
        configure(proxy) {
          // Without this, a completely unreachable backend (wrong port,
          // or simply never started — the most common real cause of a
          // confusing "Something went wrong on our server" on a fresh
          // checkout, since it's easy to start only `web` and forget
          // `backend`) surfaces through the proxy as a generic failure
          // indistinguishable from the backend actually running and
          // hitting a real error. A clear, distinct message and status
          // (503, not 500 — the backend never got the request at all)
          // makes that specific, very common setup mistake obvious
          // instead of looking like a genuine server bug.
          proxy.on('error', (err, req, res) => {
            if (res.headersSent) return;
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Cannot reach the KisanUnnatti backend on port 4000. Make sure it is running: cd backend && npm start'
            }));
          });
        }
      }
    }
  }
});
