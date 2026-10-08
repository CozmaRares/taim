const noParentImport = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow parent-directory imports; use the @/ alias for src modules.",
        },
        schema: [],
        messages: {
            parentImport:
                "Do not import from a parent directory. Use an @/ path for src modules.",
        },
    },
    create(context) {
        const reportParentImport = node => {
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
