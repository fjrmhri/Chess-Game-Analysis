import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    css: { include: [/token\.css/] },
    // Batasi proses paralel: bawaan (≈ jumlah core) menghabiskan commit memory Windows saat RAM terpakai aplikasi lain
    maxWorkers: 4,
  },
})
