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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
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
  },
});
