import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Pruebas unitarias (rápidas, sin red). Las de RLS van aparte: vitest.rls.config.mts
export default defineConfig({
  resolve: {
    // Mismo alias que tsconfig.json: "@/domain/slug" -> src/domain/slug
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/rls/**"],
  },
});
