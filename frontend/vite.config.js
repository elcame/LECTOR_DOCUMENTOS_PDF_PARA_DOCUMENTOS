import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function serveMulasPlugin() {
  const mulasDir = path.resolve(__dirname, '../modelos/mulas')
  return {
    name: 'serve-mulas',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const prefix = '/tractomula/mulas/'
        if (!req.url?.startsWith(prefix)) return next()
        const name = decodeURIComponent(req.url.slice(prefix.length).split('?')[0])
        const root = path.resolve(mulasDir)
        const file = path.resolve(root, name)
        if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
        res.setHeader('Content-Type', 'model/gltf-binary')
        res.setHeader('Cache-Control', 'public, max-age=86400')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), serveMulasPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@config': path.resolve(__dirname, './src/config'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@api': path.resolve(__dirname, './src/api'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          api: ['axios'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  },
})
