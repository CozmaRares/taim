const dbQueryConciseCallback = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Require dbQuery callbacks to be concise arrow functions.",
        },
        schema: [],
        messages: {
            missingCallback:
                "dbQuery must receive a concise arrow function callback.",
            nonArrowCallback:
                "dbQuery callback must be an arrow function so it stays inline with the query.",
            blockCallback:
                "dbQuery callback must not use braces. Keep it to one returned query expression.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.type !== "Identifier") {
                    return;
                }

                if (node.callee.name !== "dbQuery") {
                    return;
                }

                const callback = node.arguments[1];

                if (!callback) {
                    context.report({
                        node,
                        messageId: "missingCallback",
                    });
                    return;
                }

                if (callback.type !== "ArrowFunctionExpression") {
                    context.report({
                        node: callback,
                        messageId: "nonArrowCallback",
                    });
                    return;
                }

                if (callback.body.type === "BlockStatement") {
                    context.report({
                        node: callback.body,
                        messageId: "blockCallback",
                    });
                }
            },
        };
    },
};

export default dbQueryConciseCallback;
