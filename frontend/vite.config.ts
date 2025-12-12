import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    wasm(),
    topLevelAwait(),
    process.env.REPORT === 'true' &&
      visualizer({
        open: true, // 只有在这个模式下才自动打开浏览器
        gzipSize: true, // 显示 gzip 后的大小
        brotliSize: true, // 显示 brotli 后的大小
        filename: 'stats.html', // 分析图生成的文件名
      }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
