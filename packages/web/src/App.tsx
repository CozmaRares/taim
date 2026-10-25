import { ClerkProvider } from "@clerk/react";
import { env } from "@web/env";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { router, queryClient } from "@web/lib/globals";

export default function App() {
    return (
        <ClerkProvider
            publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
            appearance={{
                variables: {
                    colorPrimary: "var(--color-primary-300)",
                    colorPrimaryForeground: "var(--color-background-950)",
                    colorBackground: "var(--color-background-900)",
                    colorForeground: "var(--color-text-100)",
                    colorNeutral: "var(--color-text-100)",
                    colorMutedForeground: "var(--color-text-200)",
                    colorMuted: "var(--color-background-800)",
                    colorInput: "var(--color-background-950)",
                    colorInputForeground: "var(--color-text-100)",
                    colorBorder: "var(--color-background-700)",
                    colorRing: "var(--color-accent-400)",
                },
            }}
        >
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </ClerkProvider>
    );
}
