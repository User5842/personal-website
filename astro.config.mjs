// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  site: "https://rafaelnegron.me/",
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress warnings about unused imports in Astro's internal files
          if (
            warning.message?.includes("matchHostname") ||
            warning.message?.includes("matchPathname") ||
            warning.message?.includes("matchPort") ||
            warning.message?.includes("matchProtocol") ||
            (warning.code === "UNUSED_EXTERNAL_IMPORT" &&
              (warning.source?.includes("node_modules/astro") ||
                warning.loc?.file?.includes("node_modules/astro")))
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  },
});
