// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  site: "https://rafaelnegron.me/",
  vite: {
    plugins: [tailwindcss()],
  },
});
