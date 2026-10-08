import path from "node:path";

const allowedDbImportsOutsideDal = new Set([
    "@/db/dal",
    "@/db/dal/index",
    "@/db/dal/index.ts",
]);

const noPrivateDbImportOutsideDal = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow importing private database modules outside the DAL.",
        },
        schema: [],
        messages: {
            privateDbImport:
                "Database imports outside src/db/dal must go through @/db/dal.",
        },
    },
    create(context) {
        const filename = context.filename ?? context.getFilename();
        const normalizedFilename = filename.split(path.sep).join("/");
        const isDalFile = /(^|\/)src\/db\/dal\/.+\.[cm]?[jt]sx?$/.test(
            normalizedFilename,
        );

        return {
            ImportDeclaration(node) {
                if (isDalFile) {
                    return;
                }

                if (typeof node.source.value !== "string") {
                    return;
                }

                if (!node.source.value.startsWith("@/db/")) {
                    return;
                }

                if (!allowedDbImportsOutsideDal.has(node.source.value)) {
                    context.report({
                        node,
                        messageId: "privateDbImport",
                    });
                }
            },
        };
    },
};

export default noPrivateDbImportOutsideDal;
