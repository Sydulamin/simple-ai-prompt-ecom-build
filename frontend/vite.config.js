import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
  ],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Same proxy for `vite preview` (production build preview)
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Enable minification (esbuild is default, fastest)
    minify: 'esbuild',

    // Increase warning threshold slightly — we're aggressively splitting anyway
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Manual chunk splitting: keep vendor libs separate from app code
        manualChunks(id) {
          // Core React ecosystem — tiny, cached independently
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }
          // React Router
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/')) {
            return 'router';
          }
          // Redux stack
          if (id.includes('node_modules/@reduxjs/') ||
              id.includes('node_modules/redux') ||
              id.includes('node_modules/react-redux') ||
              id.includes('node_modules/immer') ||
              id.includes('node_modules/reselect')) {
            return 'redux';
          }
          // Axios (small, cache separately)
          if (id.includes('node_modules/axios')) {
            return 'axios';
          }
          // lucide-react — large icon lib; isolate so tree-shaking is applied per-page
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
        },

        // Deterministic file names for better long-term caching
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
      },
    },
  },
});
