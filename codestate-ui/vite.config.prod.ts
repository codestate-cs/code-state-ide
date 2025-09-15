import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// Production configuration for IIFE web component
export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/webview.tsx',
      name: 'CodeStateUI',
      fileName: 'codesate-ui',
      formats: ['iife']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    minify: 'esbuild',
    sourcemap: false,
    emptyOutDir: true
  },
  css: {
    devSourcemap: false
  },
  esbuild: {
    // Remove console.log statements in production build
    drop: ['console', 'debugger']
  }
})