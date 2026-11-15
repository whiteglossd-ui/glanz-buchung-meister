# Targeted standards/security review: native anchor / Lenis synchronization

Reviewed the uncommitted delta against website HEAD `05c36a69c760b50269cd524431652e9f8be8b20a`: `src/lib/booking-anchor-focus.ts`, `src/lib/smooth-scroll.ts` and `src/lib/smooth-scroll.test.ts`. No repository edits or test execution by this review.

No blocking runtime, security or semantic finding identified.

The existing same-URL `#buchung` branch still performs one native instant jump and preserves destination focus, URL, scroll margins and form state. Modifier clicks, downloads, other targets, already-prevented events and ordinary router navigation retain their existing behavior. Synchronization is called only after that already-authorized native jump.

`syncSmoothScrollPosition` uses only the installed Lenis1.3.27 public `isStopped`, `stop()` and `start()` surface. Reviewing that installed library confirms stop/start reset obsolete animation, velocity and target to actual native position. A missing or already stopped instance is skipped; existing menu/dialog stops are not restarted. Touch/reduced-motion selection and lazy Lenis loading remain unchanged. No data, authentication, storage or external-request surface changes.

The controlled failure artifact `/workspace/website-05c36a6-wheel.json` shows three trusted root-path wheel events, all prevented, while the page remained at the booking anchor. This substantiates the failure seam; it does not itself prove the fix.

The added offline tests use the real installed Lenis with EventTarget/geometry doubles. They assert resulting native/target positions and subsequent wheel behavior rather than mirroring stop/start calls. Coverage includes the coalesced final native event, a mid-animation jump, preservation of an existing stop until explicit unlock, and absence of an active smoother. Global doubles and instance lifetime are restored in teardown. These are controlled regressions, not real-browser/device tests. Their executed result and renewed genuine-CI root-wheel checks remain separate implementation/QA evidence.
