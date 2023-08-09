import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [],
    build: {
        lib: {
            entry: 'src/client.ts',
            fileName: 'client_bundle',
            name: 'ScreenShare'
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    }
})

