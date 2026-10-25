import ts from "typescript";
import { loadEnv, type Plugin } from "vite";

export function stripTestIds(): Plugin {
    let keepTestIds = false;
    return {
        name: "strip-test-ids",
        apply: "build",
        enforce: "pre",
        configResolved(config) {
            keepTestIds =
                loadEnv(config.mode, config.envDir, "KEEP_TEST_IDS")
                    .KEEP_TEST_IDS === "true";
        },
        transform(code, id) {
            if (keepTestIds) {
                return;
            }
            const filename = id.split("?")[0];
            if (
                !/\.[jt]sx$/.test(filename) ||
                filename.includes("/node_modules/")
            ) {
                return;
            }
            const source = ts.createSourceFile(
                filename,
                code,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TSX,
            );
            const ranges: { start: number; end: number }[] = [];
            function visit(node: ts.Node) {
                if (
                    ts.isJsxAttribute(node) &&
                    node.name.getText(source) === "data-test-id"
                ) {
                    ranges.push({
                        start: node.getStart(source),
                        end: node.getEnd(),
                    });
                }
                ts.forEachChild(node, visit);
            }
            visit(source);
            if (!ranges.length) {
                return;
            }
            let stripped = code;
            for (const { start, end } of ranges.reverse()) {
                // Preserve positions and line breaks for subsequent source maps.
                stripped =
                    stripped.slice(0, start) +
                    code.slice(start, end).replace(/[^\r\n]/g, " ") +
                    stripped.slice(end);
            }
            return { code: stripped, map: null };
        },
    };
}
