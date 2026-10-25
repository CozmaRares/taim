import base from "@taim/eslint";
import noTestImportOutsideTest from "@taim/eslint/rules/no-test-import-outside-test";

export default [
    ...base,
    {
        files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
        plugins: {
            local: {
                rules: {
                    "no-test-import-outside-test": noTestImportOutsideTest,
                },
            },
        },
        rules: {
            "local/no-test-import-outside-test": "error",
        },
    },
    {
        files: ["src/**/*.{ts,tsx}"],
        ignores: ["src/db/**"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    paths: [
                        {
                            name: "@server/db/connection",
                            importNames: ["dbQuery"],
                            message:
                                "Database queries belong in the DAL. Import an operation from its DAL module.",
                        },
                        {
                            name: "@server/db/schema",
                            allowTypeImports: true,
                            message:
                                "Schema values belong in the database layer. Import an operation from its DAL module.",
                        },
                    ],
                },
            ],
        },
    },
];
