import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";
import testIds from "@web/testIds";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    return (
        <main
            data-test-id={testIds.home.page}
            className="mx-auto my-[20vh] max-w-180 p-8"
        >
            <h1
                data-test-id={testIds.home.title}
                className="mb-6 text-5xl font-bold"
            >
                Taim
            </h1>
            <Show when="signed-out">
                <div
                    data-test-id={testIds.home.authActions}
                    className="flex gap-4"
                >
                    <SignInButton mode="modal">
                        <button
                            type="button"
                            data-test-id={testIds.home.signInButton}
                        >
                            Sign in
                        </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <button
                            type="button"
                            data-test-id={testIds.home.signUpButton}
                        >
                            Sign up
                        </button>
                    </SignUpButton>
                </div>
            </Show>
            <Show when="signed-in">
                <div data-test-id={testIds.home.userMenu}>
                    <UserButton />
                </div>
            </Show>
        </main>
    );
}
