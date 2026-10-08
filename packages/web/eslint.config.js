import base from "@taim/eslint";
import rule0 from "@taim/eslint/rules/rpc-contract-only";

export default [
    ...base,
    {
        files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
        plugins: {
            local: {
                rules: {
                    "rpc-contract-only": rule0,
                },
            },
        },
        rules: {
            "local/rpc-contract-only": "error",
        },
    },
];
