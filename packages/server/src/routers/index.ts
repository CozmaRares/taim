import { Hono } from "hono";

export const apiRouter = new Hono();

export type ApiType = typeof apiRouter;
