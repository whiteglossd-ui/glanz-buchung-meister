# Standards/security recheck: selection-order compatibility

Reviewed working changes in `src/lib/rundum-workflow.ts` and `src/lib/booking-workflow.ts` against website commit `78d9f5aef051c119b415580083e22cf51ae2b181`, with the two added integration regressions. No repository edits or test execution by this review.

No blocking finding identified:

- Both flows validate raw selections before normalization, preserving unknown-value and duplicate rejection. New requests normalize set order using the established service/extra catalog before hashing, storage and durable handoff.
- Legacy replay compatibility requires the stored array to be an array of unique strings with exactly the same membership and cardinality as the validated incoming selection. Membership equality alone never grants replay: the complete incoming payload, with only the stored array order substituted, must hash exactly to the original stored fingerprint.
- Consequently changed customer/contact data, description, vehicle, requested date, pickup wish or other fingerprinted fields still conflict. Manual request keys remain scoped to the authenticated actor, and their notification option remains part of the fingerprint.
- A successful replay returns the existing row without modifying stored data, fingerprint, events or outbox payload. The existing transaction/lock and unique request key remain in place. `editBooking` is unchanged.
- Tests cover reordered new and legacy requests, duplicate/changed-field rejection, and exact preservation of stored rows, events and outbox bytes. Their runtime result belongs to the implementation agent's verification, not this source review.

The external upstream pricing-notice removal is separate from this delta and not attributed to the task.
