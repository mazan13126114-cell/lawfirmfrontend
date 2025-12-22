import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
