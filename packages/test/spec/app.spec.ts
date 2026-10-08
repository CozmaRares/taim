import { Ensure, equals, includes } from "@serenity-js/assertions";
import { describe, it } from "@serenity-js/playwright-test";
import { GetRequest, LastResponse, Send } from "@serenity-js/rest";

describe("Compiled application", () => {
    it("serves the frontend", ({ actor }) =>
        actor.attemptsTo(
            Send.a(
                GetRequest.to("/").using({
                    headers: { Accept: "text/html" },
                }),
            ),
            Ensure.that(LastResponse.status(), equals(200)),
            Ensure.that(
                LastResponse.body<string>(),
                includes('<div id="root">'),
            ),
        ));

    it("rejects unauthenticated RPC requests", ({ actor }) =>
        actor.attemptsTo(
            Send.a(
                GetRequest.to("/api/hello").using({
                    headers: { "Sec-Fetch-Dest": "empty" },
                }),
            ),
            Ensure.that(LastResponse.status(), equals(401)),
            Ensure.that(
                LastResponse.body<{ error: string }>(),
                equals({ error: "Unauthorized" }),
            ),
        ));
});
