import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { stripTestIds } from "./build/strip-test-ids";

export default defineConfig({
    plugins: [
        stripTestIds(),
        tanstackRouter({ target: "react" }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@web": fileURLToPath(new URL("./src", import.meta.url)),
            "@server": fileURLToPath(new URL("../server/src", import.meta.url)),
            "@test": fileURLToPath(new URL("../test/src", import.meta.url)),
        },
    },
    build: {
        outDir: fileURLToPath(new URL("../../dist/public", import.meta.url)),
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        strictPort: true,
        proxy: { "/api": "http://localhost:3000" },
    },
});
