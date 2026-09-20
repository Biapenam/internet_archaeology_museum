import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative assets keep the SPA deployable at a root domain or a project sub-path.
  base: './',
  plugins: [react()],
})
