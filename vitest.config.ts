import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["scripts/registry/__tests__/**/*.test.ts", "src/config/__tests__/**/*.test.ts"],
    watch: false,
  },
});
