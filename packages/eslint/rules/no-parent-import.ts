import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

const noParentImport: TSESLint.RuleModule<"parentImport", []> = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow parent-directory imports outside test files; use the package source alias for src modules.",
        },
        schema: [],
        messages: {
            parentImport:
                "Do not import from a parent directory. Use an @server/, @web/, or @test/ path for src modules.",
        },
    },
    create(context) {
        const filename = context.filename ?? context.getFilename();
        if (/\.test\.[cm]?[jt]sx?$/.test(filename)) {
            return {};
        }

        const reportParentImport = (
            node:
                | TSESTree.ImportDeclaration
                | TSESTree.ExportNamedDeclaration
                | TSESTree.ExportAllDeclaration,
        ) => {
            if (
                typeof node.source?.value === "string" &&
                (node.source.value === ".." ||
                    node.source.value.startsWith("../"))
            ) {
                context.report({ node, messageId: "parentImport" });
            }
        };

        return {
            ImportDeclaration: reportParentImport,
            ExportNamedDeclaration: reportParentImport,
            ExportAllDeclaration: reportParentImport,
        };
    },
};

export default noParentImport;
