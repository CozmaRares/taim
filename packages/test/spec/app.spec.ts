import { Ensure, equals, includes } from "@test/serenity/assertions";
import {
    describe,
    it,
    unauthenticatedIt,
} from "@test/serenity/playwright-test";
import { GetRequest, LastResponse, Send } from "@test/serenity/rest";
import { By, PageElement, isVisible } from "@test/serenity/web";

describe("Compiled application", () => {
    it("renders the signed-in Clerk user", ({ actor }) =>
        actor.attemptsTo(
            Ensure.that(
                PageElement.located(By.testId("user-menu")),
                isVisible(),
            ),
        ));

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

    unauthenticatedIt("rejects unauthenticated RPC requests", ({ actor }) =>
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
        ),
    );
});
