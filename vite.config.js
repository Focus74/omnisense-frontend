// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ใช้ Terser minify (เบากว่า esbuild บางเครื่อง)
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      format: { comments: false },
    },
    target: 'es2018',
  },
})
