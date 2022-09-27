import { defineConfig } from 'vite';
export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'VueHistoryState',
            fileName: 'vue-history-state',
            formats: ['es', 'cjs']
        }
    }
});
