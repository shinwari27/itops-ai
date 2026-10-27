import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLEFILE=1 inlines everything into one HTML file for the shareable preview.
// PORTAL_SUBMIT_URL (in .env.local, never committed) is the "ITOps - Portal Submit" flow URL.
// The dev server proxies /live/submit to it, so the secret URL never reaches the browser.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = {};
  const route = (path, url) => {
    if (!url) return;
    const u = new URL(url);
    proxy[path] = { target: u.origin, changeOrigin: true, secure: true, rewrite: () => u.pathname + u.search };
  };
  route('/live/submit', env.PORTAL_SUBMIT_URL); // "ITOps - Portal Submit" flow
  route('/live/mine', env.PORTAL_MINE_URL);     // "ITOps - Portal My Tickets" flow
  route('/live/all', env.PORTAL_ALL_URL);       // "ITOps - Portal All Tickets" flow
  return {
    plugins: [react(), ...(process.env.SINGLEFILE ? [viteSingleFile()] : [])],
    server: { port: 5173, proxy },
  };
});
