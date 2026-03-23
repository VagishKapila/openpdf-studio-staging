import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Vite dev server configuration
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: false,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries for better caching
          'pdf': ['pdfjs-dist', 'pdf-lib'],
          'fabric': ['fabric'],
          'ocr': ['tesseract.js'],
        },
      },
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  // Environment variables prefix
  envPrefix: 'VITE_',

  // CSS preprocessing
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          $primary-color: #DC143C;
          $secondary-color: #0066CC;
          $dark-bg: #1e1e1e;
          $light-text: #ffffff;
        `,
      },
    },
  },

  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'pdfjs-dist',
      'pdf-lib',
      'fabric',
      'tesseract.js',
    ],
  },
})
