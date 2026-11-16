# Premium integration, 16 November 2026

Operator explicitly authorized the newest design, autonomous correction, integration and Hostinger publication.

## Integration

Starting production main: ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365. Include PR 349 corrections from 1855a1867c80f77c278dc09070b88c9eadf58d48. Restore the latest retained design from preserve/design-main-0cecf51 by reversing the design rollback bb44fc50, resolving overlaps with the current Rundum implementation.

- Restore local Syne and Plus Jakarta Sans, responsive navigation, guide layout, licensed embedded document fonts and the garage film/image chapter.
- Preserve current pricing, removed ceramic add-on, no public photo upload, Rundum intake, SEO and panel handoff. Existing content inventory checks remain enabled.
- Include no-JavaScript consent fallback, existing header/style loading corrections and deferred ResizeObserver writes.
- Restore the photo-signing error correction: eligible photos with no usable signature return an error, not an apparently successful empty list.
- Combine newer Rundum browser checks with the typography/guide/film checks; preserve strict completion counts and existing release protections.

## Publication conditions

Do not infer live publication from merge or build. Require successful full CI for the final main commit, the existing Hostinger workflow with exact predecessor SHA, successful production smoke and live visual checks. No local website server is permitted.

## Old open proposals

PR 287 photo behavior is superseded by the current implementation plus the restored all-signatures-failed correction. PR 289 Qonto release handling is already present in the release migration allowlist; do not reintroduce its old base. PRs 195 and 269 refer to retired Bitrix workflows and must not restore them. PR 267 is an older design prototype superseded by the retained November design. PR 284 environment notes are already in AGENTS.md. PR 297 is an October hero/CSS optimization proposal; the current build retains the route-aware desktop stylesheet preload, mobile-first poster selection and deferred film loading. Its old full-file state must not overwrite the November implementation.

## Evidence

Local production build, TypeScript and content inventory guard passed. Lint has zero errors and two pre-existing React Refresh warnings. Production dependency audit reports zero vulnerabilities. The complete local suite with test concurrency limited to two passed 934 tests, failed zero and skipped one environment-specific test; full unmodified GitHub CI remains mandatory. Browser checks exposed first-visit mobile action overlap and an H2 override; corrections preserve the shared font sizes and minimum touch targets. Final CI and production evidence is recorded in PR 350 after actual completion.
