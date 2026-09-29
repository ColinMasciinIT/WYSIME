import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: ".",
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.js"),
      name: "WYSIME",
      formats: ["es", "umd"],
      fileName: (format) => format === "es" ? "wysime.js" : "wysime.umd.cjs"
    },
    rollupOptions: {
      external: ["dompurify"],
      output: {
        globals: {
          dompurify: "DOMPurify"
        },
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith(".css")
          ? "wysime.css"
          : "assets/[name][extname]"
      }
    }
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"]
  }
});
