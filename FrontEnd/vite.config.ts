import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "https://video-tube-fawn.vercel.app/",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "::",
    port: 8080,
  },
});