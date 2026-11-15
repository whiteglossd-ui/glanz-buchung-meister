# Targeted standards review: form order and lazy start markers

The initial uncommitted review occurred at actual website HEAD `928d0a081dbc7e68f2e7a77090797996490e0d02`. The three reviewed source files were byte-identical there to earlier commit `b63d98cfb97e76aa367c54836998e437dc610105`; referring to that earlier commit as HEAD was historically inaccurate. The final committed diff `928d0a081dbc7e68f2e7a77090797996490e0d02...9ec458d8fda604620e90fcb3793aecd94421573f` has now been checked: `src/routes/index.tsx`, `src/components/lazy-rundum-inquiry.tsx` and `src/components/lazy-configurator.tsx`. This is a targeted layout recheck, not a new review of unchanged code.

No blocking functional, security or preservation finding identified.

The ordinary booking section now precedes the Rundum request section. Both existing anchor IDs and their heading associations remain intact; the prominent upper Rundum introduction and buttons are unchanged. Controllers, validation, selected package/city props, request IDs, payloads, persistence and authenticated access are untouched.

Both lazy components now observe a one-pixel, nonfocusable, aria-hidden marker at the form's beginning. This is symmetrical: jumping to the following section cannot trigger the preceding form merely because its large placeholder tail intersects the observer margin. Existing hash-triggered loading, ordinary booking's eager/search behavior, observer margin/disconnection, Suspense and noscript fallback are preserved. The marker is rendered identically during SSR and initial client render.

The `data-inquiry-start` attributes expose only fixed test labels, not customer data. They allow QA to measure genuine arrival at each form boundary. Tests should still establish both direct anchors and transitions between them after lazy content settles; passing offline source checks alone is not a rendered arrival proof. Those CI checks belong to the QA agent and remain separate from this source review.

No runtime source was changed by this review. Only this evidence report, its repository copies and a short standards-review addendum were updated.
