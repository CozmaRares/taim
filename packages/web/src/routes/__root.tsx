import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
    component: Outlet,
    notFoundComponent: () => (
        <main className="mx-auto my-[20vh] max-w-180 p-8">
            <h1 className="mb-4 text-3xl font-bold">Page not found</h1>
            <Link
                to="/"
                className="text-primary-300"
            >
                Return home
            </Link>
        </main>
    ),
});
