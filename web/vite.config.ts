import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { resolve, isAbsolute } from 'path'
import { existsSync, statSync } from 'fs'

const simpleMindMapRoot = resolve(__dirname, '../simple-mind-map')

export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills(),
    // 保证 simple-mind-map 内相对路径在打包时能正确解析到源码目录
    {
      name: 'resolve-simple-mind-map',
      enforce: 'pre',
      resolveId(id, importer) {
        if (!importer || !importer.includes('simple-mind-map')) return null
        if (id.startsWith('.')) {
          const importerPath = importer.startsWith('file://') ? importer.slice(7) : importer
          const importerAbs = isAbsolute(importerPath) ? importerPath : resolve(__dirname, importerPath)
          const base = importerAbs.replace(/\/[^/]+$/, '')
          const resolved = resolve(base, id)
          if (resolved.startsWith(simpleMindMapRoot)) {
            const withTs = resolved.endsWith('.ts') || resolved.endsWith('.tsx') ? resolved : `${resolved}.ts`
            const withJs = `${resolved}.js`
            if (existsSync(withTs)) return withTs
            if (existsSync(withJs)) return withJs
            if (existsSync(resolved)) {
              if (statSync(resolved).isDirectory()) {
                const idx = resolve(resolved, 'index.ts')
                if (existsSync(idx)) return idx
                const idxJs = resolve(resolved, 'index.js')
                if (existsSync(idxJs)) return idxJs
              } else return resolved
            }
          }
        }
        return null
      }
    }
  ],
  base: process.env.NODE_ENV === 'development' ? '/' : './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/css/i.test(ext)) return 'css/[name].[hash][extname]'
          return 'assets/[name].[hash][extname]'
        }
      }
    }
  },
  resolve: {
    alias: [
      // 构建时 simple-mind-map/node_modules 下的依赖会注入 shims 引用，需强制解析到 web 的 node_modules
      {
        find: 'vite-plugin-node-polyfills/shims/global',
        replacement: resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/global/dist/index.js')
      },
      {
        find: 'vite-plugin-node-polyfills/shims/buffer',
        replacement: resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js')
      },
      {
        find: 'vite-plugin-node-polyfills/shims/process',
        replacement: resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js')
      },
      { find: /^simple-mind-map\/(.*)$/, replacement: `${simpleMindMapRoot}/$1` },
      { find: 'simple-mind-map', replacement: resolve(simpleMindMapRoot, 'index.ts') },
      // simple-mind-map 内多处用相对路径引用，打包时统一解析到源码
      { find: '../../../constants/constant', replacement: resolve(simpleMindMapRoot, 'src/constants/constant.ts') },
      { find: '../../constants/constant', replacement: resolve(simpleMindMapRoot, 'src/constants/constant.ts') },
      { find: '../../../utils/index', replacement: resolve(simpleMindMapRoot, 'src/utils/index.ts') },
      { find: 'quill-delta', replacement: resolve(__dirname, 'node_modules/quill-delta') },
      { find: 'parchment', replacement: resolve(__dirname, 'node_modules/parchment') },
      { find: '@', replacement: resolve(__dirname, 'src') }
    ]
  },
  optimizeDeps: {
    include: ['element-plus', 'vue', 'dayjs'],
    exclude: ['simple-mind-map']
  },
  server: {
    proxy: {
      '^/api/v3/': {
        target: 'http://ark.cn-beijing.volces.com',
        changeOrigin: true
      }
    }
  }
})
