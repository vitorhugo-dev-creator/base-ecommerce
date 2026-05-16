import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  root: 'src',
  build: {
    outDir: '../public-react',
    emptyOutDir: false,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3002',
      '/products': 'http://localhost:3002',
      '/admin-assets': 'http://localhost:3002',
    }
  }
})