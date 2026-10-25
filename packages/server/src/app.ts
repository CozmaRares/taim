import { Hono } from "hono";
import { createLogger } from "@server/lib/logger";
import {
    openDatabaseConnection,
    requestLogger,
    requireAuth,
} from "@server/middleware";
import { apiRouter } from "./routers";

const app = new Hono();

app.use("*", requestLogger);
app.onError((error, c) => {
    createLogger("server").error(error);
    return c.json({ error: "Internal server error" }, 500);
});
app.use("/api/*", requireAuth);
app.use("/api/*", openDatabaseConnection);
app.route("/api", apiRouter);

export default app;
