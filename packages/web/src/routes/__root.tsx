import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import testIds from "@web/testIds";

export const Route = createRootRoute({
    component: Outlet,
    notFoundComponent: () => (
        <main
            data-test-id={testIds.notFound.page}
            className="mx-auto my-[20vh] max-w-180 p-8"
        >
            <h1
                data-test-id={testIds.notFound.title}
                className="mb-4 text-3xl font-bold"
            >
                Page not found
            </h1>
            <Link
                data-test-id={testIds.notFound.returnHomeLink}
                to="/"
                className="text-primary-300"
            >
                Return home
            </Link>
        </main>
    ),
});
