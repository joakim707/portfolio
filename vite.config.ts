import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    // Vite 8 pre-bundling can otherwise hand zustand its own React copy (invalid hook call).
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'],
  },
  optimizeDeps: {
    // Pre-bundle every 3D dependency up front: discovering one later triggers a
    // re-optimisation that can split @react-three/fiber into two copies.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'zustand',
      'zustand/middleware',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/rapier',
      'gsap',
    ],
  },
  build: {
    sourcemap: true,
    // Rapier ships its physics engine as WASM embedded in JS (~2 MB on its own).
    chunkSizeWarningLimit: 2500,
    rolldownOptions: {
      output: {
        // separate vendor chunks: parallel download + long-term caching
        advancedChunks: {
          groups: [
            { name: 'physics', priority: 25, test: /[\/]node_modules[\/](@dimforge|@react-three[\/]rapier)/ },
            { name: 'three', priority: 30, test: /[\/]node_modules[\/](three|three-stdlib)[\/]/ },
            { name: 'r3f', priority: 20, test: /[\/]node_modules[\/](@react-three|@monogrid|troika|camera-controls|maath)/ },
            { name: 'react', priority: 40, test: /[\/]node_modules[\/](react|react-dom|scheduler|zustand)[\/]/ },
          ],
        },
      },
    },
  },
})
