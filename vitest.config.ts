import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'prio-state': path.resolve(__dirname, '../../packages/state/src'),
      '@zondax/auth-web': path.resolve(__dirname, '../../packages/auth-web/src'),
      config: path.resolve(__dirname, './config'),
      state: path.resolve(__dirname, './state'),
      lib: path.resolve(__dirname, './lib'),
    },
  },
})
