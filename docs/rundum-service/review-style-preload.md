# Targeted integration review: existing homepage stylesheet preload

Reviewed committed four-file diff `b126633bda707955862408ac8411a1ff8c51c2c1...5646167edcbdbbf6092f40962219934d0bbccc4d`. No repository edits or test execution by this review.

No blocking client-strip, CSP, stylesheet-application or integration finding identified.

The installed Start generator exports the declared `tsrStartManifest` factory, and its prepared-router logic explicitly removes stylesheet links once their rules are inlined. The server-only isomorphic accessor therefore reads the real original homepage CSS asset rather than inventing a filename or restoring an applied stylesheet. The homepage-only hint is `rel=preload as=style`; this fetches bytes without applying CSS rules. Existing inline styles and cascade remain untouched. The type declaration matches the real virtual-module contract.

Independent inspection of the current build found62 client JavaScript files with no `tsrStartManifest`, virtual-manifest marker, internal homepage source path or `.scroll-film{` CSS payload. The server manifest accessor is stripped from the client; it introduces no manifest/CSS data leak. Bootstrap, fonts, consent, loaders and RPC source are unchanged by this diff.

The new Asset retains the request nonce. Cross-origin selection respects the existing stylesheet configuration, falls back to the manifest and otherwise uses anonymous mode, matching the inspected built Vite stylesheet-loader `crossOrigin=''`. The small script-hint cross-origin addition likewise uses the established script configuration. No CSP permission is broadened. Matching URL/mode is a reuse prerequisite, not proof of reuse.

SSR assertions check exact inline CSS and order, one home-only style hint, nonce and anonymous mode. Native Lighthouse captures the actual style request before assertions and requires parser discovery, one-request reuse, unchanged resource size and early timing; failures remain in the final hard gate. Actual stylesheet timing, visual cascade and performance effect still require the new CI result. Earlier EntryLowHint/dedup/extras changes were preserved as upstream integration context, not credited to this four-file delta.

## Späterer tatsächlicher Prüfnachweis

Die frühere Bewertung gilt für den jeweils oben gepinnten Diff. Der abschließende Quellstand `9ff2e377` besteht inzwischen den echten vollständigen CI-Lauf [43687237283](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43687237283): mobil 98/98/98, Desktop 100/100/100, CLS 0; native Asset-Gates und Browserabläufe grün. [Aktuelle Messungen und Evidenzgrenzen](website-ci-review.md). Dieser Nachtrag dokumentiert das spätere tatsächliche Ergebnis und ersetzt nicht die ursprüngliche unabhängige Quellprüfung.
