import { Hono } from "hono";
import { helloRouter } from "./hello";

export const apiRouter = new Hono().route("/hello", helloRouter);

export type ApiType = typeof apiRouter;
