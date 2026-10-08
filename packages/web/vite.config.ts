import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
    plugins: [tanstackRouter({ target: "react" }), react(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
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
