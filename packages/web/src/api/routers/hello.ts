import { queryOptions } from "@tanstack/react-query";
import { client } from "@/api/client";

const helloRouter = {
    options: (userId: string) =>
        queryOptions({
            queryKey: ["hello", userId],
            staleTime: Infinity,
            queryFn: async ({ signal }) => {
                const response = await client.hello.$get(
                    {},
                    {
                        init: { signal },
                    },
                );
                if (!response.ok) {
                    throw new Error(await response.text());
                }
                return response.json();
            },
        }),
};

export default helloRouter;
