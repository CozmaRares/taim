import base from "@taim/eslint";
import rule0 from "@taim/eslint/rules/concise-test-callback";

export default [
    ...base,
    {
        files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
        plugins: {
            local: {
                rules: {
                    "concise-test-callback": rule0,
                },
            },
        },
        rules: {
            "local/concise-test-callback": "error",
        },
    },
];
