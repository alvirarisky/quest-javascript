# QA record

Validated locally on macOS Chrome, 1366×768 viewport, with result screens also checked at 1440×900 and 1536×960.

- Complete keyboard playthrough from personnel registration through all eight areas to the exit and verified result: passed, zero browser JavaScript errors.
- Movement, camera following, locked passages, terminal interaction, hints, selection/confirmation, assisted repair, sector progression, pause/resume, refresh recovery, Watcher events, ending and replay registration: exercised in `tests/browser.mjs`.
- Both correct and incorrect first answers occurred in the browser run. Final 2/8 score displayed 25/100, matching feedback counts. Backend all-correct and all-incorrect runs separately verified 100 and 0.
- Result panels fit within all three target desktop viewports, without scrolling or clipping.
- Six Node test groups passed. These include 100 independently executed variants per topic, 30 all-correct randomized runs, wrong-answer runs, invalid/modified tokens, invalid payloads, wrong puzzle order, forged submitted scores, premature results, and the Vercel Node request/response handler.
- Production build passed. Phaser engine emits a large-chunk advisory; the engine is loaded separately when entering the facility. Landing UI does not eagerly load Phaser.
- Production bundle audit passed: private question templates, signing environment-variable references, server HMAC code, and source maps are absent.
- Reviewed screenshots are preserved in `docs/screenshots/`.

Remaining limits: old valid signed tokens can be replayed in a stateless architecture; identity is self-entered; locally generated development secrets expire on process restart unless configured. No Vercel account deployment was performed, so deployed routing/environment behavior still requires a smoke test after publishing. Mobile touch controls exist but desktop remains the primary assessed platform. Synthesized audio is muted by default and has no licensed soundtrack.
