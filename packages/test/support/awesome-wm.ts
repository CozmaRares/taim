import { execFileSync } from "node:child_process";

const removeRule = `
local rules = require("awful.rules").rules
for i = #rules, 1, -1 do
    if rules[i].id == "taim-integration-tests" then table.remove(rules, i) end
end
`;

function runLua(source: string) {
    const output = execFileSync("awesome-client", [], {
        input: source,
        encoding: "utf8",
        timeout: 5_000,
    });
    if (output.includes("Error") || output.includes('string "error:')) {
        throw new Error(`AwesomeWM configuration failed: ${output}`);
    }
}

export default async function setupAwesomeWM() {
    runLua(`${removeRule}
local awful = require("awful")
local target = awful.screen.focused()
local tag = target.tags[9]
if not tag then return "error: tag 9 does not exist on the focused screen" end
table.insert(awful.rules.rules, {
    id = "taim-integration-tests",
    rule = { class = "taim-integration-tests" },
    properties = { screen = target, tag = tag, floating = false, switchtotag = false },
})
return "ok"
`);
    return async () => {
        runLua(removeRule);
    };
}
