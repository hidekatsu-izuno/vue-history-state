import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'vue-history-state',
      fileName: 'vue-history-state',
      formats: ['es', 'cjs']
    }
  }
})
