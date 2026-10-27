import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLEFILE=1 inlines everything into one HTML file for the shareable preview.
// PORTAL_SUBMIT_URL (in .env.local, never committed) is the "ITOps - Portal Submit" flow URL.
// The dev server proxies /live/submit to it, so the secret URL never reaches the browser.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = {};
  if (env.PORTAL_SUBMIT_URL) {
    const u = new URL(env.PORTAL_SUBMIT_URL);
    proxy['/live/submit'] = {
      target: u.origin,
      changeOrigin: true,
      secure: true,
      rewrite: () => u.pathname + u.search,
    };
  }
  return {
    plugins: [react(), ...(process.env.SINGLEFILE ? [viteSingleFile()] : [])],
    server: { port: 5173, proxy },
  };
});
