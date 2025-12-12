import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/reward-catcher/',
  define: {
    'process.env': process.env,
    global: 'globalThis'
  },
  resolve: {
    alias: {
      // Remove the custom JSX runtime alias as it's not needed
    }
  }
})
