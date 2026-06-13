import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/main/ts/**/*.test.ts"],
    environment: "node",
  },
});
