import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { seo } from './vite-plugin-seo.ts'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), seo()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          // React on its own: otherwise it lands in vendor-three and the entry
          // preloads all of three.js before the loader can even paint.
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react'
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'vendor-three'
        },
      },
    },
  },
})
