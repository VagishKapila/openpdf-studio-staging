import { defineConfig } from 'vite'

// Dev server for local development.
// Production build uses scripts/build.mjs (simple file copy).
export default defineConfig({
  root: 'src',
  server: {
    port: 5173,
    host: 'localhost',
  },
})
