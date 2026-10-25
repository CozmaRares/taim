import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

const noRedundantArrowAwait: TSESLint.RuleModule<"redundant", []> = {
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
                node: TSESTree.ArrowFunctionExpression,
            ) {
                if (node.body.type !== "AwaitExpression") {
                    return;
                }
                const body = node.body;
                context.report({
                    node: body,
                    messageId: "redundant",
                    fix: fixer => {
                        const token = context.sourceCode.getFirstToken(body);
                        return token ? fixer.remove(token) : null;
                    },
                });
            },
        };
    },
};

export default noRedundantArrowAwait;
