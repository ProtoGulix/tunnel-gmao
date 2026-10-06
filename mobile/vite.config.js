import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Sous-chemin de service : '/' en dev, '/m/' dans l'image Docker (ADR 0006).
  const base = (env.VITE_BASE_PATH || '/').replace(/\/?$/, '/')

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icons/*.png'],
        manifest: {
          name: 'Tunnel Mobile',
          short_name: 'Tunnel',
          description: 'Tunnel GMAO — Application mobile technicien',
          theme_color: '#1a2332',
          background_color: '#f8fafc',
          display: 'standalone',
          scope: base,
          start_url: base,
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/],
          cleanupOutdatedCaches: true,
          runtimeCaching: []
        }
      })
    ],
    server: {
      host: true,
      allowedHosts: env.VITE_ALLOWED_HOSTS?.split(',') ?? [],
      port: 5174,
      strictPort: true,
    },
    resolve: {
      alias: { '@': '/src' }
    }
  }
})
