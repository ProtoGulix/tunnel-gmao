import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false, // ✅ Désactive PWA en développement
      },
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "TUNNEL GMAO",
        short_name: "TUNNEL",
        description: "Gestion de Maintenance Assistée par Ordinateur",
        theme_color: "#2c3e50",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        skipWaiting: true, // ✅ Force mise à jour immédiate
        clientsClaim: true, // ✅ Prend contrôle immédiatement
        cleanupOutdatedCaches: true, // ✅ Nettoie les anciens caches
        // index.html exclu du précache : le navigateur doit toujours le
        // récupérer depuis le réseau pour détecter les nouvelles versions.
        // Les assets hashés (JS/CSS) sont inclus — leur nom change à chaque build.
        globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
        // Pour les navigations SPA, toujours réseau en premier.
        // Si hors-ligne, on accepte le cache — mais dès que le réseau répond
        // avec un nouveau SW, skipWaiting prend le relais immédiatement.
        navigateFallback: null,
        runtimeCaching: [
          {
            // index.html (et toutes les routes SPA) — réseau en priorité,
            // jamais servi depuis le cache SW si le réseau est disponible.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-navigation',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 0, // invalide immédiatement
              },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /^http:\/\/localhost:8055\/.*/i,
            handler: "NetworkFirst", // ✅ Réseau d'abord pour l'API
            options: {
              cacheName: "directus-api-cache",
              expiration: {
                maxEntries: 50, // ✅ Réduit de 100 à 50
                maxAgeSeconds: 5 * 60, // ✅ Réduit à 5 minutes au lieu d'1 heure
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10, // ✅ Timeout réseau de 10s
            },
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // ✅ Évite les problèmes de chunking
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true, // ✅ Force le port exact
    watch: {
      usePolling: true,
      interval: 100, // ✅ Vérifie les changements toutes les 100ms
    },
    hmr: {
      overlay: true, // ✅ Affiche les erreurs HMR
    },
    // Proxy API → élimine le CORS en dev (même origine)
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        cookieDomainRewrite: 'localhost',
      },
    },
  },
});
