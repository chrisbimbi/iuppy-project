import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig(({ mode }) => {
  // carrega variáveis de ambiente de .env.<mode>
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tsconfigPaths()       // aplica seus caminhos de tsconfig.json
    ],
    resolve: {
      alias: {
        // faz @shared/arquivo.ts → ../shared/src/arquivo.ts
        '@shared': path.resolve(__dirname, '../shared/src')
      }
    },
    define: {
      'process.env': env
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom']
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '')
        }
      }
    }
  }
})
