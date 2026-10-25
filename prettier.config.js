/** @type {import('prettier').Config} */
const config = {
    plugins: ["prettier-plugin-tailwindcss"],
    tailwindStylesheet: "./packages/web/src/style.css",
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: false,
    quoteProps: "as-needed",
    jsxSingleQuote: false,
    trailingComma: "all",
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "avoid",
    singleAttributePerLine: true,
};

export default config;
