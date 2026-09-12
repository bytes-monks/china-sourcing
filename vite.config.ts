import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `isSsrBuild` matters: the SSR pass externalises react, and rollup refuses to
// put an external module in a manual chunk — so the chunking below is
// client-only.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  define: {
    // Read by both the client and the SSR build, so the prerendered copyright
    // year can never disagree with the hydrated one.
    __BUILD_YEAR__: JSON.stringify(String(new Date().getFullYear())),
  },
  build: {
    // scripts/prerender.mjs reads dist/.vite/manifest.json to emit a
    // modulepreload for each route's lazy chunk.
    manifest: !isSsrBuild,
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            // Framework code changes far less often than copy; giving it its
            // own content hash keeps it cached across ordinary content deploys.
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-dom/client', 'scheduler'],
              router: ['react-router', 'react-router-dom'],
            },
          },
        },
  },
  base: process.env.BASE_URL || '/',
}))
