import { resolve } from "node:path";
import { serveStatic } from "@hono/bun";
import app from "@/app";
import { env } from "@/env";

if (env.NODE_ENV === "production") {
    const root = resolve(import.meta.dir, "../public");

    // Unknown API routes must remain JSON 404s, even with the SPA fallback.
    app.all("/api", c => c.json({ error: "Not found" }, 404));
    app.all("/api/*", c => c.json({ error: "Not found" }, 404));
    app.use("*", serveStatic({ root }));
    app.get("*", async (c, next) => {
        // Missing assets should return 404 instead of the frontend HTML.
        if (
            c.req.path.startsWith("/assets/") ||
            !c.req.header("Accept")?.includes("text/html")
        ) {
            return next();
        }
        return serveStatic({ root, path: "index.html" })(c, next);
    });
}

export default {
    port: env.PORT,
    fetch: app.fetch,
};
