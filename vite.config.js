import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? 'https://mauriciopoppe.github.io/PojoViz/' : '/',
  plugins: [
    tailwindcss(),
    svelte(),
    viteStaticCopy({
      targets: [
        {
          src: 'README.md',
          dest: '.'
        },
        {
          src: 'DEV_README.md',
          dest: '.'
        }
      ]
    })
  ]
})
