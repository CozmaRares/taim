import base from "@taim/eslint";
import rpcContractOnly from "@taim/eslint/rules/rpc-contract-only";

export default [
    ...base,
    { ignores: ["src/routeTree.gen.ts"] },
    {
        files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
        plugins: {
            local: {
                rules: {
                    "rpc-contract-only": rpcContractOnly,
                },
            },
        },
        rules: {
            "local/rpc-contract-only": "error",
        },
    },
];
