import base from "@taim/eslint";
import rule0 from "@taim/eslint/rules/db-query-concise-callback";
import rule1 from "@taim/eslint/rules/no-private-db-import-outside-dal";
import rule2 from "@taim/eslint/rules/no-parent-import";
import rule3 from "@taim/eslint/rules/no-layer-inversion";

export default [
    ...base,
    {
        files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
        plugins: {
            local: {
                rules: {
                    "db-query-concise-callback": rule0,
                    "no-private-db-import-outside-dal": rule1,
                    "no-parent-import": rule2,
                    "no-layer-inversion": rule3,
                },
            },
        },
        rules: {
            "local/db-query-concise-callback": "error",
            "local/no-private-db-import-outside-dal": "error",
            "local/no-parent-import": "error",
            "local/no-layer-inversion": "error",
        },
    },
];
