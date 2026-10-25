import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = fileURLToPath(new URL("../", import.meta.url));
const packageNames = ["server", "web", "test"];
const filesByPackage = new Map(
    packageNames.map(name => [name, [] as string[]]),
);

for (const stagedFile of Bun.argv.slice(2)) {
    const file = resolve(stagedFile);

    for (const packageName of packageNames) {
        const packageDirectory =
            join(rootDirectory, "packages", packageName) + sep;

        if (file.startsWith(packageDirectory)) {
            filesByPackage.get(packageName)?.push(file);
            break;
        }
    }
}

const lintResults = await Promise.all(
    [...filesByPackage.entries()].map(async ([packageName, files]) => {
        if (files.length === 0) {
            return 0;
        }

        const eslint = Bun.spawn(
            [process.execPath, "x", "eslint", "--fix", ...files],
            {
                cwd: join(rootDirectory, "packages", packageName),
                stdin: "inherit",
                stdout: "inherit",
                stderr: "inherit",
            },
        );

        return eslint.exited;
    }),
);

if (lintResults.some(exitCode => exitCode !== 0)) {
    process.exitCode = 1;
}
