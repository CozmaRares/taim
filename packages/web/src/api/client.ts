import { getToken } from "@clerk/react";
import { hc } from "hono/client";
import type { ApiType } from "@taim/server/rpc";

export const client = hc<ApiType>("/api", {
    headers: async (): Promise<Record<string, string>> => {
        const token = await getToken();

        const headers: Record<string, string> = {};

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        return headers;
    },
    init: { credentials: "include" },
});
