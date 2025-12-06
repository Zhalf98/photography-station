import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
import { fileURLToPath, URL } from 'node:url'

// 导入站点配置
import { siteConfig } from './src/config/index.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          // 注入配置到 HTML
          siteName: siteConfig.name,
          siteAuthor: siteConfig.name,
          siteTitle: `${siteConfig.name} - ${siteConfig.description.slice(0, 20)}`,
          siteDomain: siteConfig.domain,
          siteDescription: siteConfig.description,
          siteKeywords: siteConfig.keywords,
          siteLogo: siteConfig.logo,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/views/Admin/')) {
            return 'admin'
          }
        }
      }
    }
  }
}))
