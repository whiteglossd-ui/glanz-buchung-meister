# Spec review — revised 15.11.2026

Axis: requirements only; standards reviewed independently. Website fixed base `38996d2ba9adfd54bde1dd22949b60c7afb9d0fd` → committed head `e9f49b7778f023763a15fe19c90b52a3dca89971`. Panel fixed base `372864f4eeaae8dba3da34580a0b9f40e5e27888` → final reviewed commit `168bfd7d1c22704dd45bcbc0320d20480cdb9364` (draft PR100). Website CI follow-up `e9bd77ff7926c0bca23693ae8fa81d5203e86eb6` retains the reviewed feature; final upstream integration remains separately verifiable.

## Initial findings resolved in source

- **R2:** `src/components/scroll-film-hero.tsx` now presents a compact Rundum description and exact request CTA in the initial hero, preserving the existing package/booking entries. `scripts/qa/rundum-ui.mjs:verifyInitialRundumHero` checks first-screen visibility, touch size and header/consent overlap. Actual browser results remain pending.
- **R6/R9:** `server/portal.mjs:rundumInquiryView/portalOrder` safely projects request kind, all selected services, collection wish and vehicle details; `public/kunde.js:inquiryHTML` renders readable Rundum-Service information, individual-offer notice and unconfirmed requested date. Operator and customer views retain the request details.
- **R12/R13:** `server/website-receipts.mjs:83-84` treats malformed successful provider replies as `unknown`; `tests/website-intake-http.test.mjs:110-115` asserts no unproven rejection claim and identical payload/idempotency key on recovery.
- **R7:** `src/components/city-landing.tsx` uses generic WhatsApp consultation and later protected-panel photo guidance. No public customer file control remains; the editorial Studio file picker is preserved.

Additional R10 review: new offer/document/portal/chat/invoice emails use `customerAccountAccess` and permanent password authentication, while existing legacy PIN links remain redeemable. This avoids making recurring PIN access the regular future route without invalidating historical links.

Literal R10 follow-up: expired-link renewal now explicitly sends a fresh 24-hour one-use link via the existing protected outbox. Setup-link requests remain neutral for unknown/existing-password accounts, never reset credentials, and cannot be redeemed through code verification. Reviewer-executed renewal/backend/UI checks: 6/6 passed. Receipt expiry guidance now points directly to `/auth/customer?step=renew`.

No further material requirement implementation gap identified in the reviewed source. Required seven selections, optional phone/date, full no-photo intake, exact WhatsApp message, bounded single-use setup grant, credential preservation and separated storage/provider/delivery statuses remain present.

## Evidence still required before completion

Successful GitHub browser jobs and visually inspected desktop/mobile screenshots; final website upstream-integration diff confirmation; final test/type/build statuses and PR/artifact links. Edge Function typecheck must complete in CI or remain an explicit network blocker. No real device or production-email inbox test is implied by emulation or captured-provider tests. No production release is authorized by this review.
