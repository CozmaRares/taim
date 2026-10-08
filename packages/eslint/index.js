import tsParser from "@typescript-eslint/parser";
import noRedundantArrowAwait from "./rules/no-redundant-arrow-await.js";

export default [
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/reports/**",
            "**/test-results/**",
            "**/playwright-report/**",
            "**/public/generated/**",
        ],
    },
    {
        files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaVersion: "latest", sourceType: "module" },
        },
        plugins: {
            shared: {
                rules: { "no-redundant-arrow-await": noRedundantArrowAwait },
            },
        },
        rules: {
            curly: ["error", "all"],
            "shared/no-redundant-arrow-await": "error",
        },
    },
];
