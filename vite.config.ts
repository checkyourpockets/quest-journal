import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";
import { fixturePlugin } from "./vite.fixtures";

export default defineConfig({
  base: "/quest-journal/",
  plugins: [
    react(),
    fixturePlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Quest Journal",
        short_name: "Quest Journal",
        description: "A personal quest journal.",
        theme_color: "#0f6e6e",
        background_color: "#f7f3ea",
        display: "standalone",
        orientation: "portrait",
        start_url: "/quest-journal/",
        scope: "/quest-journal/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/quest-journal/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,woff2}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
