const modifiers = new Set(["only", "skip", "fixme", "fail", "slow"]);

const conciseTestCallback = {
    meta: {
        type: "suggestion",
        schema: [],
        messages: {
            concise:
                "Test callbacks must be expression-bodied arrow functions that return their activity, e.g. ({ actor }) => actor.attemptsTo(...).",
        },
    },
    create(context) {
        function isTest(callee, node) {
            while (callee.type === "MemberExpression" && !callee.computed) {
                if (!modifiers.has(callee.property.name)) {
                    return false;
                }
                callee = callee.object;
            }
            if (callee.type !== "Identifier") {
                return false;
            }
            let scope = context.sourceCode.getScope(node);
            while (scope && !scope.set.has(callee.name)) {
                scope = scope.upper;
            }
            const binding = scope?.set.get(callee.name);
            return binding?.defs.some(
                def =>
                    def.type === "ImportBinding" &&
                    def.node.type === "ImportSpecifier" &&
                    ["it", "test"].includes(def.node.imported.name) &&
                    def.parent.source.value === "@serenity-js/playwright-test",
            );
        }
        return {
            CallExpression(node) {
                if (!isTest(node.callee, node)) {
                    return;
                }
                for (const callback of node.arguments) {
                    if (
                        callback.type === "FunctionExpression" ||
                        (callback.type === "ArrowFunctionExpression" &&
                            callback.body.type === "BlockStatement")
                    ) {
                        context.report({
                            node: callback,
                            messageId: "concise",
                        });
                    }
                }
            },
        };
    },
};

export default conciseTestCallback;
