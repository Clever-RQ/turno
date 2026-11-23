import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Pruebas de RLS contra el proyecto real de Supabase (npm run test:rls).
 * Crean dos dueños temporales, comprueban que no se ven entre sí y los borran.
 * Variables: .env.local en tu máquina, secrets de GitHub en el CI.
 */
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/rls/**/*.test.ts"],
    env: loadEnv(mode, process.cwd(), ""),
    // Llamadas de red a Supabase: más margen que las unitarias.
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
}));
