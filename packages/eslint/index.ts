import type { TSESLint } from "@typescript-eslint/utils";
import * as tsParser from "@typescript-eslint/parser";
import noRedundantArrowAwait from "./rules/no-redundant-arrow-await.ts";
import noParentImport from "./rules/no-parent-import.ts";

const config: TSESLint.FlatConfig.Config[] = [
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
                rules: {
                    "no-redundant-arrow-await": noRedundantArrowAwait,
                    "no-parent-import": noParentImport,
                },
            },
        },
        rules: {
            curly: ["error", "all"],
            "shared/no-redundant-arrow-await": "error",
            "shared/no-parent-import": "error",
        },
    },
];

export default config;
