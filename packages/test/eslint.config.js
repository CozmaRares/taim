import base from "@taim/eslint";

export default [
    ...base,
    {
        files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
        ignores: ["serenity/**"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["@serenity-js/*"],
                            message:
                                "Import from @test/serenity/<package> so shared test extensions apply.",
                        },
                    ],
                },
            ],
        },
    },
];
