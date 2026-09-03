import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Set by CI (deploy.yml) to "/<repo-name>/" so asset URLs resolve on GitHub Pages.
// Falls back to "/" for local dev and custom-domain deploys.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}", "data/*.json"],
        // Cache exercise GIFs/thumbnails from jsDelivr for offline use.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "exercise-media",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: "MyGym — Workout Browser & Builder",
        short_name: "MyGym",
        description:
          "Search exercises, watch the animation, and build your own workout routines.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
