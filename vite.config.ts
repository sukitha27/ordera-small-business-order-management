import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: {},
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: true,
    },
  },
});