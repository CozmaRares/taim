import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({ routeTree });
export const queryClient = new QueryClient();

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
