import { defineConfig } from 'vite'
// import { devtools } from '@tanstack/devtools-vite'
// Désactivé : ce plugin crée un pont console client↔serveur via SSE qui peut
// partir en boucle infinie quand une erreur survient (chaque console.error
// renvoyé au client redéclenche un nouveau console.error → spam à l'infini).
// Le panel UI <TanStackDevtools/> dans __root.tsx fonctionne sans ce plugin.

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: {
    noExternal: ['@convex-dev/better-auth'],
  },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
})

export default config
