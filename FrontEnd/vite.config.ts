import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      host: "::",
      port: 8080,
      // When VITE_API_BASE_URL is empty, /api requests are proxied to the local backend
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    preview: { host: "::", port: 8080 },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
  };
});
