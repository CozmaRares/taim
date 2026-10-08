import path from "node:path";

const noLayerInversion = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Keep database access and pure library modules below application services.",
        },
        schema: [],
        messages: {
            databaseToService:
                "Database access modules must not import application services.",
            pureLibraryToDatabase:
                "Pure library modules must not import database values.",
            pureLibraryToService:
                "Pure library modules must not import application services.",
            pageToDataLayer:
                "Pages must not import database or service values. Use a page loader instead.",
        },
    },
    create(context) {
        const filename = context.filename ?? context.getFilename();
        const normalizedFilename = filename.split(path.sep).join("/");
        const isDalFile = /(^|\/)src\/db\/dal\/.+\.[cm]?[jt]sx?$/.test(
            normalizedFilename,
        );
        const isLibraryFile = /(^|\/)src\/lib\/.+\.[cm]?[jt]sx?$/.test(
            normalizedFilename,
        );
        const isServiceFile =
            /(^|\/)src\/lib\/services\/.+\.[cm]?[jt]sx?$/.test(
                normalizedFilename,
            );
        const isPureLibraryFile = isLibraryFile && !isServiceFile;
        const isPageFile = /(^|\/)src\/pages\/.+\.[cm]?[jt]sx?$/.test(
            normalizedFilename,
        );

        return {
            ImportDeclaration(node) {
                if (typeof node.source.value !== "string") {
                    return;
                }

                if (
                    isDalFile &&
                    node.source.value.startsWith("@/lib/services/")
                ) {
                    context.report({
                        node,
                        messageId: "databaseToService",
                    });
                }

                if (
                    isPureLibraryFile &&
                    node.importKind !== "type" &&
                    node.source.value.startsWith("@/db/")
                ) {
                    context.report({
                        node,
                        messageId: "pureLibraryToDatabase",
                    });
                }

                if (
                    isPureLibraryFile &&
                    node.source.value.startsWith("@/lib/services/")
                ) {
                    context.report({
                        node,
                        messageId: "pureLibraryToService",
                    });
                }

                if (
                    isPageFile &&
                    node.importKind !== "type" &&
                    (node.source.value.startsWith("@/db/") ||
                        node.source.value.startsWith("@/lib/services/"))
                ) {
                    context.report({
                        node,
                        messageId: "pageToDataLayer",
                    });
                }
            },
        };
    },
};

export default noLayerInversion;
