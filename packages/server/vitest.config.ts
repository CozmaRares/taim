import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@web": fileURLToPath(new URL("../web/src", import.meta.url)),
            "@server": fileURLToPath(new URL("./src", import.meta.url)),
            "@test": fileURLToPath(new URL("../test/src", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        setupFiles: ["./src/_test/setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        passWithNoTests: true,
    },
});
