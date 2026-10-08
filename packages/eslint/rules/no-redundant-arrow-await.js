export default {
    meta: {
        type: "suggestion",
        fixable: "code",
        schema: [],
        messages: {
            redundant:
                "Return the expression directly from this async arrow instead of awaiting it.",
        },
    },
    create(context) {
        return {
            "ArrowFunctionExpression[async=true][body.type='AwaitExpression']"(
                node,
            ) {
                context.report({
                    node: node.body,
                    messageId: "redundant",
                    fix: fixer =>
                        fixer.remove(
                            context.sourceCode.getFirstToken(node.body),
                        ),
                });
            },
        };
    },
};
