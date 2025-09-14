import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// Development configuration for web UI
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 3000,
    open: true,
    hmr: true
  },
  build: {
    outDir: 'dist-dev',
    sourcemap: true,
    minify: false
  },
  css: {
    devSourcemap: true
  }
})