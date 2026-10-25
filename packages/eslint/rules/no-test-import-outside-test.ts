import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

const isTestPath = (value: string) => /(^|[/\\])_test([/\\]|$)/.test(value);

const noTestImportOutsideTest: TSESLint.RuleModule<"testImport", []> = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Restrict imports from _test directories to modules inside _test directories.",
        },
        schema: [],
        messages: {
            testImport:
                "Only modules inside an _test directory may import from _test directories.",
        },
    },
    create(context) {
        if (isTestPath(context.filename)) {
            return {};
        }

        function check(
            node: TSESTree.Node,
            source: TSESTree.Node | null | undefined,
        ) {
            const value =
                source?.type === "TemplateLiteral" &&
                source.expressions.length === 0
                    ? source.quasis[0].value.cooked
                    : source && "value" in source
                      ? source.value
                      : undefined;
            if (typeof value === "string" && isTestPath(value)) {
                context.report({ node, messageId: "testImport" });
            }
        }

        return {
            ImportDeclaration: node => check(node, node.source),
            ExportNamedDeclaration: node => check(node, node.source),
            ExportAllDeclaration: node => check(node, node.source),
            ImportExpression: node => check(node, node.source),
            CallExpression(node) {
                if (
                    node.callee.type === "Identifier" &&
                    node.callee.name === "require"
                ) {
                    check(node, node.arguments[0]);
                }
            },
        };
    },
};

export default noTestImportOutsideTest;
