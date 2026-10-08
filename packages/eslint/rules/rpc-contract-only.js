import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = fileURLToPath(
    new URL("../../server/", import.meta.url),
);

const rpcContractOnly = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            restricted:
                "Import server types only through @taim/server/rpc using import type.",
        },
    },
    create(context) {
        function check(node, source, typeOnly = false) {
            if (typeof source !== "string") {
                return;
            }
            const resolved = path.resolve(
                path.dirname(context.filename),
                source,
            );
            const isServer =
                source === "@taim/server" ||
                source.startsWith("@taim/server/") ||
                ((source.startsWith(".") || path.isAbsolute(source)) &&
                    (resolved === path.resolve(serverDirectory) ||
                        resolved.startsWith(serverDirectory)));
            if (isServer && !(source === "@taim/server/rpc" && typeOnly)) {
                context.report({ node, messageId: "restricted" });
            }
        }
        return {
            ImportDeclaration(node) {
                check(
                    node,
                    node.source.value,
                    node.importKind === "type" ||
                        (node.specifiers.length > 0 &&
                            node.specifiers.every(
                                s => s.importKind === "type",
                            )),
                );
            },
            ExportNamedDeclaration(node) {
                check(
                    node,
                    node.source?.value,
                    node.exportKind === "type" ||
                        (node.specifiers.length > 0 &&
                            node.specifiers.every(
                                s => s.exportKind === "type",
                            )),
                );
            },
            ExportAllDeclaration(node) {
                check(node, node.source.value, node.exportKind === "type");
            },
            ImportExpression(node) {
                check(node, node.source.value);
            },
            TSImportType(node) {
                check(
                    node,
                    node.argument.literal?.value ?? node.argument.value,
                    !node.isTypeOf,
                );
            },
            CallExpression(node) {
                if (
                    node.callee.type === "Identifier" &&
                    node.callee.name === "require"
                ) {
                    check(node, node.arguments[0]?.value);
                }
            },
            TSImportEqualsDeclaration(node) {
                check(node, node.moduleReference.expression?.value);
            },
        };
    },
};

export default rpcContractOnly;
