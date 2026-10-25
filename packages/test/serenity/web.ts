import { By as SerenityBy } from "@serenity-js/web";

export * from "@serenity-js/web";

export class By extends SerenityBy {
    static testId(id: string) {
        return By.css(`[data-test-id=${JSON.stringify(id)}]`);
    }
}
