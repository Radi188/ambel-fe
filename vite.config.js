import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3030',
        changeOrigin: true,
      },
      // Uploaded product images are served by the API at /uploads
      '/uploads': {
        target: 'http://localhost:3030',
        changeOrigin: true,
      },
    },
  },
})
