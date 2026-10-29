import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base نسبی تا روی GitHub Pages و هر مسیر دیگری بدون تغییر اجرا شود
export default defineConfig({
  base: './',
  plugins: [react()],
})
