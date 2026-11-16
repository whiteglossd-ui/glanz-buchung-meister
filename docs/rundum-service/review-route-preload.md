# Targeted standards/security review: homepage route hint

Reviewed committed four-file diff `6f8c4e11b447958ebe8ab17fbef5aabab628ae11...1e78fc9ff19dd5e3cba8fdf3ece9d931764ab4b1`. No repository edits or test execution by this review.

No blocking source, CSP or hydration finding identified.

On pathname `/` only, `PrioritizedHeadContent` allows the existing Start-managed tag matching `manifest.routes['/'].preloads[0]` into the server head at low priority. `DeferredScripts` filters exactly that same URL from its later preload list. Other paths retain prior behavior. Existing tag keys, nonce and cross-origin attributes remain intact. Bootstrap execution source and security-header source are byte-identical to the previous commit; the change prepares a module without adding an early executable script.

The inspected current build maps `/` to `src/routes/index.tsx` and its first preload to `routes-D-EuccIB.js` (33980 source bytes), distinct from root entry `index-rEoBSisQ.js`. The route module imports that root entry and other dependencies: browsers may fetch module dependencies while preparing the hint. Therefore one early route hint does not prove that only33980 bytes are fetched before paint. No performance improvement or unchanged network contention is inferred from source.

SSR tests now require one homepage hint, zero on other pages, valid asset paths, low priority, separation from executable entries and absence from the later hint list. Native Lighthouse QA resolves the current build manifest, records actual route requests before assertions, requires parser discovery and single-request reuse before root-entry completion, and retains failures in its final hard gate. Score/cache/throttle rules remain unchanged.

This is an incremental review of hint placement and evidence quality. The reported prior functional success/mobile97 remains historical; effectiveness of `1e78fc9` requires its actual CI measurements.

Follow-up review: committed diff `1e78fc9ff19dd5e3cba8fdf3ece9d931764ab4b1...5d1f9e9cb44a7740b4bf94cef1f343535b38f1a4` is confirmed. Only the selected server-rendered homepage module hint changes to high priority; other module hints remain low. Deferred execution, manifest selection, tag keys, cross-origin attributes and CSP nonce handling remain unchanged. Existing TanStack Asset link handling already suppresses managed-head hydration differences; this delta adds no hydration suppression. SSR and native Lighthouse assertions now require the intended high priority. No blocker identified. The earlier low-priority review remains historical: root reports its later native fetch/reuse proof passed6/6 while mobile remained97. That result does not establish any score benefit for `5d1f9e9`; its scheduling/dependency effects require its own native measurement. The earlier warning against claiming a34kB traffic bound remains applicable.

## Späterer tatsächlicher Prüfnachweis

Die frühere Bewertung gilt für den jeweils oben gepinnten Diff. Der abschließende Quellstand `9ff2e377` besteht inzwischen den echten vollständigen CI-Lauf [43687237283](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43687237283): mobil 98/98/98, Desktop 100/100/100, CLS 0; native Asset-Gates und Browserabläufe grün. [Aktuelle Messungen und Evidenzgrenzen](website-ci-review.md). Dieser Nachtrag dokumentiert das spätere tatsächliche Ergebnis und ersetzt nicht die ursprüngliche unabhängige Quellprüfung.
