import { defineConfig } from "vitest/config";

// Pruebas unitarias (rápidas, sin red). Las de RLS van aparte: vitest.rls.config.mts
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/rls/**"],
  },
});
