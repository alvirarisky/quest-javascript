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

## Quiet UI revision — 11 October 2026

- Full eight-sector keyboard playthrough, refresh/resume, pause and replay registration passed with zero JavaScript errors on the isolated port-5174 preview. Two correct first submissions produced the expected 25/100 result.
- All six Node test groups, production build and bundle audit passed.
- Final puzzle fits the 1366×768 desktop viewport without internal scrolling (609px content height).
- Touch controls are visible at 390×844. Portrait mode retains a letterboxed game view; desktop or landscape is recommended.
- The local secret fallback was corrected: absent environment values no longer become the literal string `undefined` in `process.env`.
- Physics, scene timers and animations all pause during puzzle interaction. Context-triggered Watcher events and repaired-world animations replace the repeated timer/toast pattern.
- Updated revision screenshots are stored in `docs/screenshots/revision/`.
- Background crops retain their original resolution and remain a visual-quality limit. No remote commit, push or deployment was performed for this revision.

## Variasi mekanik — 11 October 2026

- Full playthrough dengan kartu akses, sekring, CCTV, tuas, katup, robot, antena dan segel EXIT passed tanpa browser errors. Jawaban pertama 2/8 menghasilkan 25/100 sesuai feedback.
- Task sebelum terminal dan setelah perbaikan diuji melalui interaksi keyboard fisik, termasuk hold E, pilihan kanal dan waktu perjalanan robot. Refresh setelah task pertama memulihkan statusnya.
- Sembilan kelompok Node tests passed, termasuk gating sebelum/sesudah soal, pemulihan inventori/kanal/kejutan, dan migrasi save lama. Production build dan audit bundle passed.
- Task tidak menambah soal atau memodifikasi perhitungan nilai server. Save yang selesai menjawab delapan soal tetap bisa melanjutkan segel EXIT sebelum hasil ditampilkan.
- Hold task tidak selesai saat menu jeda terbuka; resume dapat menyelesaikannya. Status task dan opsi Kurangi jumpscare bertahan setelah reload (`tests/environment.mjs`).
- Final terminal desktop fit 589px tanpa internal scroll; touch controls mobile terlihat. Screenshot mekanik tersimpan di `docs/screenshots/mechanics/`.

## Horror experience QA — 11 October 2026

Experience findings from the preceding version:

- High: Watcher appearances had no relationship to player behavior or consequence. Continuing to walk was always safe.
- High: Task names changed, but most required the same approach-and-E action. No need to read enemy movement, manage visibility, or choose a safe moment.
- High: Completing the final answer removed tension; the exit task remained another held interaction.
- Medium: Limited synthesized sound and static room scenery weakened the sense of a living facility. Higher-quality art/animation and a richer soundscape remain areas for improvement.

Implemented changes: scanner timing at Security Gate, light/noise/contact-sensitive Watcher patrol at Surveillance, locker cover, crouching, sprint/stamina, safe checkpoint retreats, and a final pursuit after opening the EXIT seal. This introduces decisions during exploration while preserving paused educational assessment and server grading.

Automated QA deliberately covers failure as well as success. A caught player must retain the exact signed token and completed tasks. Cover must break pursuit. The scanner must reject an active crossing and allow a safe crossing. The final pursuit must allow recovery and escape. These behavioral checks live in `tests/horror.mjs`; pure threat behavior is covered in `tests/tension.test.js`.

This is a mechanics improvement, not a claim of finished horror polish. Atmosphere, animation fidelity, and whether the pacing feels frightening still need human playtesting with sound enabled. Browser automation verifies behavior and completion; it cannot establish emotional impact.

Validated revision results:

- Full registration-to-result playthrough with scanner timing, the two-locker hiding route, and final sprint passed with zero browser errors. All eight incorrect first answers still allowed escape and correctly displayed 0/100.
- Deliberate capture, cover escape, active scanner failure, safe scanner crossing, pause, final pursuit recovery and final escape passed in Chrome. Signed grading tokens survived both capture checks unchanged.
- Twelve Node test groups, production build, and private-bundle audit passed. The existing Phaser chunk advisory remains.
- Reviewed hiding and final pursuit screenshots are stored in `docs/screenshots/horror/`.
- Final terminal desktop fit: 576px without internal scrolling. Mobile touch controls remained visible. Hold-task pause/resume, task refresh, and reduced-scare preference passed on an isolated rerun. One combined browser run timed out selecting the pause checkbox; it was not reproduced on rerun and remains an observation rather than a diagnosed product defect.

## Opening and learning report QA

- Horror warning and keyboard guide precede registration; optional sound and reduced jumpscares are selectable before play.
- Required frontend reflection (20–600 characters) survives opening refresh, resume, answers and the result. Server ignores forged result-time reflection; signing protects the submitted session text. The essay has no correctness grade.
- Wrong-answer Watcher overlays and reduced-scare static feedback passed browser checks. The continue action waits for the short overlay to finish; world simulation remains paused.
- All three result tabs fit 1366×768, 1440×900, and 1536×960. Essay HTML is displayed as text and does not execute. Eight learning notes render with per-topic review flags.
- Thirteen Node tests passed, including four title thresholds and essay validation. Production build and private-bundle audit passed.
- Local API was restarted to load the new signed state fields. Development sessions created with the previous random secret require a new shift.
- Full new-shift playthrough through warning, essay, both opening beats, eight puzzles, scanner, stealth, final sprint, result and replay passed with zero browser errors. Three correct first answers displayed 37.5/100. A test selector was updated to distinguish the answer count from the new title description.

## Combined archive and ambience QA

- Result and initial essay share one visible record; separate result/essay tabs have been removed. Learning notes expand below the record.
- Locally loaded IM Fell English and Courier Prime replace the previous Google Fonts typography. Their font loading passed the browser check; licenses are bundled.
- Real audio test confirms the 48-second loop decodes, plays during exploration, fades when a terminal opens, resumes after closing, and mutes correctly. Volume and mute survive reload. The first audio test exposed a Fetch status check bug; it was corrected and the test passed.
- Reviewed the new archive result and corrected low-contrast score explanation text. Combined result and reflection passed desktop viewport checks and HTML escaping checks.
- An initial timing-based full playthrough stopped short of the fuse pickup. The walking helper now checks the achieved player position and continues physical movement until it reaches the interaction range, rather than assuming wall-clock time equals distance.
- Final full playthrough with the new fonts, ambience and combined report passed with zero browser errors; 1/8 first answers correctly produced 12.5/100. Result fit all three target desktop sizes. Reviewed screenshot: `docs/screenshots/archive/combined-result.png`.

## Industrial horror revision

- Reference direction: Alien: Isolation's industrial atmosphere, anticipation and sound. NULL-07 uses original artwork and original synthesized audio.
- Replaced archive-era typography with locally hosted variable Oswald and Source Sans 3. Reviewed landing and combined result screenshots under `docs/screenshots/industrial/`.
- Replaced the silhouette popup with a detailed close-up Watcher asset. Terminal mistakes now have signal failure, impact/lunge and blackout phases. CCTV/corridor/capture use different timing; world movement and threat updates stop during the scare. UI overlays cancel world scare timers.
- Browser checks passed for the hidden anticipation image, disabled continue button during the scare, automatic recovery, reduced-scare path, signed/escaped essay and result together at three desktop sizes.
- Audio QA passed for impact decoding/playback and selected volume, alongside ambience fade, mute, reload persistence and font loading.
- Horror QA passed for hiding, captured-player progress preservation, scanner failure/safe crossing, pause and final pursuit recovery/escape, without browser errors.
- A full-run assertion initially failed because CSS uppercase changed `innerText` of the success heading. The test now reads the underlying text content to count correct answers independently of heading presentation. Visual review also exposed an obsolete image animation that could reveal the face during anticipation; it was removed and an explicit opacity check now covers the blackout.
- 13 automated test groups, production build and private bundle audit passed. Vite still reports the existing Phaser chunk size warning.
- Final full browser playthrough passed through all eight assessments, environmental tasks and EXIT with zero browser errors. 2/8 correct first answers produced 25/100; the result fit 1366×768, 1440×900 and 1536×960, and starting another shift worked.

## Selectable horror mode and quieter result copy

- Opening guide and pause menu now offer Horror (full jumpscares) or Tenang (no jumpscares), using accessible radio choices. Existing reduced-scare preferences migrate through the same stored setting. Switching mode retains the same assessment and progression.
- Removed the three requested result labels while preserving the initial essay beside the grade in the same record.
- Chrome QA verified mode selection in the guide, pause-menu switching, persistence through reload, scary/quiet wrong-answer behavior, result copy removal, essay integrity and the existing pause/hold task behavior. Production build and bundle audit passed.

## Selectable MCs from user photographs

- Operator registration now includes keyboard-accessible female/male MC choices with the two supplied photos. Selection changes the actual player sprite and persists with the local run.
- Both generated sprite sheets have six 512×512 frames. Verified walking motion/frame switching, alpha backgrounds, restoring a female run, selecting male in a subsequent shift in the same scene, and old sessions without the new field. Character changes preserve the existing collision body dimensions.
- Reviewed the selection screen at 1366×768 and both protagonists in the facility. Screenshots are in `docs/screenshots/characters/`.
- Character browser checks passed with zero browser errors. 13 automated groups, production build and private bundle audit passed; the existing Phaser chunk-size warning remains.
- Full browser playthrough with the new male MC passed all eight assessments, environmental tasks and EXIT, with zero browser errors. 3/8 first answers yielded 37.5/100; all three desktop result viewports and starting another shift passed.

## Character ID card selector

- Replaced uploaded-photo thumbnails with personnel ID cards using cropped idle-frame portraits from the actual game character sheets. Cards show operator number, night-shift assignment, barcode, access level and selected state.
- Removed unused original-photo files from public assets. Character selection, animation, resume, same-scene switching and legacy compatibility passed Chrome QA with zero browser errors.
- Reviewed final desktop portrait crops and verified the cards fit the 390px mobile viewport. Updated selection screenshots in `docs/screenshots/characters/`.
- Final production build and private bundle audit passed.
- Updated the ID cards with the user-selected names: Allie (Teknisi Sistem) and Noah (Operator Keamanan). Verified both names, roles and radio selections in Chrome, reviewed the desktop screenshot, and passed the production build.

## Cinematic opening, radio story and facility recovery

- Applied the final user-specified personnel IDs everywhere: Allie / Teknisi Sistem / 20050730 and Noah / Operator Keamanan / 20041108. Character portraits use generated game sprites.
- Opening animates the selected ID through a scanner and opens the facility door. Both protagonists have distinct short replies; radio instructions become suspicious as the shift progresses. Subtitles sit above the play area, disappear on pause, and resume afterward.
- Each recovered sector activates its own lights and visual equipment feedback. Four endings use the server-verified correct-answer count; environmental tasks and personal essays retain their previous scoring rules.
- Added ten original, reproducible sound effects: footsteps, door, machinery, radio, knocks, pipes, steam, robot, scanner and breath. Chrome decoded all twelve audio buffers (ten new clips, impact and ambience). Effects stop on pause; ambience fades, mute/volume persist, and impact uses the selected volume. Tenang suppresses jumpscares and breath cues.
- Actual PNG download passed in Chrome. The report includes student identity, selected MC and ID, grade, completion time, ending, full essay and all eight learning notes. Long 80-character identities and a 600-character unbroken essay wrap without clipping the footer. Reviewed images are under `docs/screenshots/story/`.
- Cinematic, character, onboarding and audio browser checks passed with zero page errors. The character/cinematic test hooks resolve Vite's active world-module URL, including HMR timestamps.
- Full browser playthrough passed all eight assessments, environmental tasks and EXIT. Three correct first answers produced 37.5/100 and the matching ending; the result fit 1366×768, 1440×900 and 1536×960. Starting a subsequent shift worked.
- Fifteen automated test groups, production build and private bundle audit passed. The existing Phaser chunk-size warning remains.
