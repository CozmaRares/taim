import {
    Show,
    SignInButton,
    SignUpButton,
    UserButton,
    useAuth,
} from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    return (
        <main className="mx-auto my-[20vh] max-w-180 p-8">
            <h1 className="mb-6 text-5xl font-bold">Taim</h1>
            <Show when="signed-out">
                <div className="flex gap-4">
                    <SignInButton mode="modal" />
                    <SignUpButton mode="modal" />
                </div>
            </Show>
            <Show when="signed-in">
                <UserButton />
                <AuthenticatedHome />
            </Show>
        </main>
    );
}

function AuthenticatedHome() {
    const { userId } = useAuth();
    const hello = useQuery(api.hello.options(userId!));
    const message = hello.isPending
        ? "Connecting to the API…"
        : hello.isError
          ? "Unable to connect to the API."
          : hello.data.message;

    return (
        <p
            role="status"
            className="mt-6 leading-relaxed text-text-200"
        >
            {message}
        </p>
    );
}
