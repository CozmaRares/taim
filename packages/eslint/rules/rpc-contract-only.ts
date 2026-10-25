import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = fileURLToPath(
    new URL("../../server/", import.meta.url),
);

const rpcContractOnly: TSESLint.RuleModule<"restricted", []> = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            restricted:
                "Import server types only through @taim/server/rpc using import type.",
        },
    },
    create(context) {
        function check(node: TSESTree.Node, source: unknown, typeOnly = false) {
            if (typeof source !== "string") {
                return;
            }
            const resolved = path.resolve(
                path.dirname(context.filename),
                source,
            );
            const isServer =
                source.startsWith("@server/") ||
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
                                s =>
                                    s.type === "ImportSpecifier" &&
                                    s.importKind === "type",
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
                check(
                    node,
                    "value" in node.source ? node.source.value : undefined,
                );
            },
            TSImportType(node) {
                check(
                    node,
                    node.source.value,
                    node.parent.type !== "TSTypeQuery",
                );
            },
            CallExpression(node) {
                if (
                    node.callee.type === "Identifier" &&
                    node.callee.name === "require"
                ) {
                    const source = node.arguments[0];
                    check(
                        node,
                        source && "value" in source ? source.value : undefined,
                    );
                }
            },
            TSImportEqualsDeclaration(node) {
                if (node.moduleReference.type === "TSExternalModuleReference") {
                    check(node, node.moduleReference.expression.value);
                }
            },
        };
    },
};

export default rpcContractOnly;
