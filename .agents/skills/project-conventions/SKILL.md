---
name: project-conventions
description: Review this repository for project convention violations, report actionable and ignored findings, and fix user-selected items. Use for explicit convention audits or follow-up fixes and exception management, rather than ordinary implementation work.
---

# Project conventions

Review first, then fix only the findings the user selects. A request to audit is not permission to rewrite the project. If the user already selected findings or authorized all actionable fixes, proceed without asking again. Do not automatically create backlog tasks.

## Review the current code

Review the current state of the requested files, or all project source when no scope is given. Read relevant project instructions and configuration for context. Do not inspect Git diffs, compare revisions, or classify findings by when they were introduced. Exclude dependencies, build output, generated files, secrets, and machine-local files from ordinary source review.

Look for `conventions-ignore` comments in the reviewed source before classifying findings. The comment format and scope are described below.

Review the conventions below. Do not duplicate checks that ESLint can enforce automatically or report ESLint-covered style/import rules as manual convention findings. This audit does not require running lint, formatting, or other automated checks to populate the findings list. Read code and trace behavior; use targeted tests only when needed to substantiate a finding.

### UI components belong in components

All UI components must live under `packages/web/src/components/`, including page content, layouts, shared controls, loading/error views, and authentication UI. Route modules should define route configuration and compose/import components from that directory. Layout-only wrappers and non-color Tailwind utilities for spacing, sizing, positioning, and display are allowed in routes; extracted UI component implementations belong in `components/`. Application bootstrap/provider wiring can remain in the entrypoint, but any extracted UI component belongs in `components/`.

Use rule ID `ui-component-location` for violations.

### All UI colors stay inside components

All UI color usages must live under `packages/web/src/components/`. This includes built-in Tailwind palette utilities, project shade utilities such as `text-primary-300` and `bg-background-950`, arbitrary colors, CSS color-variable references such as `var(--color-text-100)`, inline styles, and third-party appearance/theme configuration such as Clerk's color settings.

Outside `components/`, including routes and application bootstrap, allow layout and other non-color utilities but no color styling, except for the Clerk setup described below. Move other colored UI and theme/appearance configuration into components and compose them from routes or the entrypoint. Check variants, opacity modifiers, gradients, borders, rings, shadows, class-building helpers, and color props as well as direct text/background classes. Do not move colors into a helper outside `components/` to bypass the rule.

Clerk's `ClerkProvider` appearance/color configuration may remain in `packages/web/src/index.tsx`, where Clerk is directly configured. Do not report that configuration or require extracting a component solely to relocate it. This exception does not allow other UI color styling in the entrypoint.

The shared palette definitions in `packages/web/src/style.css` remain the source of color tokens; defining those tokens is not UI color usage. Applying colors through global selectors outside `components/` is still a finding.

Use rule ID `ui-color-location` for violations.

### Server errors use neverthrow

Server code must use `neverthrow` to represent and propagate failures through typed `Result`/`ResultAsync` values. Trace error-producing operations and every caller: converting one operation to a Result is insufficient if another failure can still escape through a throw or rejected promise.

- Identify synchronous throws and promise rejections from database operations, I/O, parsing/validation, authentication/SDK calls, and other fallible dependencies. Use `fromThrowable`, `ResultAsync.fromPromise`, or equivalent safe boundaries; wrapping a promise does not catch an exception thrown before that promise is created.
- Model expected failures with meaningful typed errors. Narrow caught values from `unknown`, retain useful causes, and provide an explicit unexpected-error fallback. Do not silently swallow failures, use unchecked unwraps, cast away error types, or return success after an unhandled failure.
- Verify every error branch is handled or propagated through callers to a deliberate HTTP response or startup failure. A global error handler alone does not replace typed handling in the server. Check cleanup, transaction rollback, and error paths themselves for failures that could mask the original error or leak resources.
- State which failure paths were traced and any uncertainty; do not claim to prove all third-party failure modes impossible.

Use rule IDs `server-neverthrow` and `server-error-handling` as appropriate; group overlapping reports of the same failure path.

Startup environment validation is an explicit exception: missing or invalid required environment settings must immediately prevent the application from starting. A running application cannot repair its own environment configuration. Direct validation throws during initialization (`createEnv`) are intentional; do not flag them under `server-neverthrow` or `server-error-handling`, require converting them to recoverable Results, or suggest starting with defaults/disabled validation to conceal missing required settings. Keep runtime error handling separate from this fatal configuration boundary.

### DAL operations use private implementations and exported wrappers

Each public server DAL operation under `packages/server/src/db/dal/` has a non-exported implementation named `_<operation>` and an exported neverthrow wrapper named `<operation>`. Keep each pair adjacent in this exact order: private implementation first, exported wrapper immediately afterward. Do not collect all private implementations or wrappers into separate sections.

The private function performs the actual work and returns ordinary values or promises. It may throw or reject; that is intentional inside this boundary and is not independently a `server-neverthrow` violation. The exported wrapper delegates to it, catches all reachable failures, and returns a typed `Result` or `ResultAsync`, classifying expected database/domain errors and retaining an unexpected-error fallback. Ensure the wrapper also catches synchronous throws: `ResultAsync.fromPromise(_operation(...), handler)` is safe when `_operation` is async; otherwise defer invocation through `fromAsyncThrowable` or use an appropriate synchronous boundary. Do not duplicate the implementation in the wrapper.

Within the same DAL file, implementations must reuse private functions directly, never their exported neverthrow wrappers. This includes recursive calls. The outer exported boundary handles their combined failures; wrapping and unwrapping Results at every internal call adds unnecessary overhead. Across files, private functions remain private: import and use the exported wrapper, deliberately handling or propagating its Result. Never export private implementations, use unsafe unwraps, or drop a cross-file Result to bypass this boundary.

Review function order, delegation, and internal/cross-file call paths. This convention concerns DAL data operations, not error type declarations or pure error classifiers/factories. Use rule ID `dal-private-wrapper-pattern` for violations; group overlapping failure-handling findings for the same operation.

### Database error handling follows the schema

Read `packages/server/src/db/schema.ts`, related schema modules, and relevant migrations before evaluating database calls. For each insert/update/delete and transaction, determine which actual constraints can fail and trace their handling:

- Primary-key collisions and unique constraints, including composite keys.
- Foreign-key violations on writes and parent deletion/update, accounting for configured cascade, restrict, and nullification behavior.
- Required columns, check constraints, and other declared restrictions when applicable.

Confirm constraint errors become typed domain errors and intentional responses through neverthrow. Preflight existence checks alone do not handle races; verify database failures are still caught. Check wrapped driver causes when classifying errors and retain an unexpected-database-error fallback. Do not invent constraint scenarios absent from the schema. If there are no tables yet, report this part as not applicable.

Use rule ID `database-constraint-handling` for violations.

### Group related package scripts

In every project `package.json`, keep related script commands adjacent under descriptive separator entries using the existing `"--group-name--": ""` convention. Use groups appropriate to the package, such as `--development--`, `--checks--`, `--database--`, and `--tooling--`. Keep command variants together, such as `lint`/`lint:fix` and `test`/`test:watch`/`test:ui`. Do not rely on blank lines that formatters remove. Preserve script names, commands, and execution behavior when regrouping.

This convention cannot be ignored: always report violations as actionable, never offer an ignore option for them, and reject any ignore comment or JSON index entry targeting this rule. Non-ignorable does not mean auto-fix without selection; keep the normal review-then-selected-fixes workflow.

## Report and selection

Present a numbered actionable list, ordered by impact. Each item includes its current file/line, supporting convention, observed problem, and proposed fix. Group duplicate reports of the same occurrence. Report numbers are selection shortcuts only. Reference ignored occurrences by repository-relative file path and the numeric ID embedded in their source comment, never by symbol names or source snippets.

For each finding, cite its concrete location, the convention, the observed problem, and the proposed correction. Present uncertain interpretations as questions rather than inventing additional rules.

Always include an **Ignored** section: report every ignore comment in the reviewed scope with its current path and each comment ID, convention, and reason, grouped by the construct they mark, or say none. Inspect the code following the ignore-comment block to reconstruct the ignored occurrence. Distinguish active ignored findings from stale or malformed comments; do not silently delete them. Do not claim to have evaluated comments outside the reviewed scope.

If no fixes were selected in the existing request, finish the report by asking which items to fix or ignore. Do not edit source while waiting for selection. On follow-up, re-check the relevant code and resolve selected display numbers against the previous report, not a newly reordered list.

## Persistent exceptions through comments

The source comment itself is the persistent marker. Identify each marker by its current file path and explicit numeric comment ID, not line numbers, symbol-name anchors, or copied source fragments. The JSON review index below is derived from comments and never authorizes suppression. Find the comment by its ID within its file and inspect the code immediately following its ignore-comment block on every run. File moves and symbol renames do not invalidate a comment that stays attached to its target.

When the user selects a finding to ignore, insert a language-appropriate comment immediately above the line causing the finding:

```ts
// conventions-ignore ui-component-location id:1 -- Legacy component. Will be migrated later.
export function LegacyPage() {
```

Inside JSX or CSS, use valid comment syntax with the same marker:

```tsx
{/* conventions-ignore ui-color-location id:2 -- This page's color scheme is not yet finalized. */}
<div className="text-primary-300" />
```

```css
/* conventions-ignore ui-color-location id:3 -- Background is intentionally overwritten for this page. */
background-color: var(--color-background-950) !important;
```

```ts
// conventions-ignore server-neverthrow id:1 -- This function doesn't use the regular API plumbing and is called standalone. Failures are shown directly to the end-user.
// conventions-ignore server-error-handling id:2 -- Error handling is intentionally ommitted for this function. Failures are shown directly to the end-user.
function superImportantServerFunction() {

```

The format is `conventions-ignore <convention> id:<id>  -- <reason>`. IDs are positive integers unique within each file. For a new comment, allocate one greater than the largest ID in that file's current comments and every `ids` array in its existing JSON entries (start at 1); do not fill gaps or renumber existing comments. Different files may use the same ID. Preserve IDs through edits and moves. Duplicate IDs within a file are invalid and must be reported rather than silently reassigned. Use the rule IDs defined above as convention names. When one construct violates multiple conventions, use one comment per convention, each with its own ID and reason. Consecutive ignore comments form a block applying to the same immediately following uncommented code line. Store that block as one JSON entry. Do not group separate constructs just because their reasons or conventions are similar. When that line opens a declaration, call, or JSX element, it identifies that construct for the listed finding; it does not suppress independent findings inside its body, descendants, or neighboring constructs. Place a separate comment immediately above each additional offending line.

Unknown conventions, attempts to ignore the non-ignorable `package-script-grouping` rule, missing reasons, missing targets, or stale markers are reported for review. An attempted ignore of a non-ignorable rule never suppresses its finding and must not enter the generated index. File-wide and directory-wide ignores are not supported. New occurrences remain actionable.

Only add comments for user-selected ignores. Record the user's reason. Do not accept a comment without a reason, or reasoning like "the user said so"; ensure the user has a valid reason before accepting. Preserve comments during unrelated fixes. Remove or revise an ignore only when the user requests it or explicitly selects the ignored finding for fixing. "Fix all" excludes ignored findings unless the user includes them.

These comments apply to this review workflow only. They do not disable ESLint, Knip, TypeScript, tests, or CI. Do not add tool suppression directives or weaken automated checks unless separately requested.

## JSON review index

[conventions-ignores.json](conventions-ignores.json), beside this SKILL.md, is a Git-tracked, generated index for the human to browse. Source comments are the only authority. An index entry without a matching source comment never suppresses a finding; never insert a source comment merely to match the index.

After fixes or ignore-comment changes, re-read the current source and synchronize the index. This metadata update is part of the review workflow and does not authorize source fixes before selection.

Use this shape, with each repository-relative file path mapping to an array of marked constructs:

```json
{
    "packages/server/src/superImportantServerFunction.ts": [
        {
            "ids": [1, 2],
            "conventions": ["server-neverthrow", "server-error-handling"],
            "reasons": [
                "This function doesn't use the regular API plumbing and is called standalone. Failures are shown directly to the end-user.",
                "Error handling is intentionally ommitted for this function. Failures are shown directly to the end-user."
            ]
        }
    ]
}
```

Each entry groups the ignore comments attached to one construct. Store only `ids`, `conventions`, and `reasons`, always as arrays, including for a single-comment construct. The arrays must be nonempty, have equal lengths, and correspond positionally: `ids[i]`, `conventions[i]`, and `reasons[i]` describe the same source comment. Each comment names exactly one convention and has its own reason; multiple comments may have the same reason, but retain each value explicitly. Never deduplicate or sort the arrays independently.

The pair of file path and an ID in `ids` links back to that comment; the contiguous comment block determines its construct. Do not store a construct ID, line numbers, symbols, copied code, positional anchors, status, or diagnostic notes. Rebuild grouping from the current source code, not array positions in an earlier JSON version. If comments move between constructs, regroup them while preserving their IDs.

Flag stale or malformed comments, duplicate IDs, missing targets, and other problems in the review report, not as JSON states or diagnostic entries. An invalid marker does not suppress a finding. Exclude problematic markers from the refreshed index and explain the exclusion in the report; do not silently repair or remove their source comments.

Within fully reviewed files, rebuild construct groups from current valid comment blocks: add new comments to their construct group, refresh conventions and reasons, and remove the corresponding aligned array items when comments disappear or are flagged as problematic. If a block mixes valid and invalid comments, index only valid comments and flag the others. Remove a construct group when no valid comments remain. Do not remove or renumber source comments during synchronization. Remove empty file groups and groups for deleted files only when their absence was confirmed. During a partial review, replace groups only for fully reviewed files and preserve other groups unchanged; disclose that scope in the report. For file moves, migrate the group key when both paths were covered; preserve the comment IDs. If merging moved code into another file creates duplicate IDs, flag the conflict for correction.

Sort file keys lexically, construct entries by their smallest numeric ID, and each construct's comment triplets by ID, moving aligned values together. Validate JSON, equal array lengths, positive integer IDs, and ID uniqueness within each file after writing it and report the index update with the review/fix results. If synchronization cannot complete, say which files remain unverified rather than presenting the index as current.

## Fix selected findings

Make the smallest changes addressing selected actionable findings, preserving unrelated edits and ignored occurrences. Do not run broad autofix or formatting commands that would modify unselected or ignored findings.

After selected fixes, run checks appropriate to the changes and report fixed findings, remaining actionable findings, ignored findings, and verification results using current locations. If a selected fix requires changing another ignored occurrence or materially expanding scope, explain the dependency before making that additional change. Do not claim a clean review when checks failed or reviewed scope was incomplete.

Finish the fix pass by synchronizing the JSON review index with the final source state using the rules above, including adding new comment entries and removing entries for comments that no longer exist.
