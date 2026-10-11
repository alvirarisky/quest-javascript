# JAVASCRIPT: THE LAST SHIFT

A playable Phaser 3 horror adventure for Module 6 — JavaScript & jQuery. Eight connected sectors, physical movement, locked passages, interactive terminals, psychological Watcher events, and a verified completion record. No database or accounts.

## Run locally

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. The development server runs Vite and the same private API logic used by Vercel. It generates a process-local signing secret if `SESSION_SECRET` is absent. Refresh recovery works while this server process is running. Set a stable secret in your shell if sessions must survive server restarts. `.env.example` documents the required production variable; never commit the real secret.

Controls: A/D or arrow keys to walk; E near a terminal/exit; Esc to close a terminal or pause. Touch buttons are available on smaller screens. Sound starts muted. There is no reading timer or failure ending.

## Deploy to Vercel

Import this folder as a Vite project. Build command: `npm run build`. Output: `dist`. The `api/[action].js` Node function handles `/api/session`, `/api/resume`, `/api/question`, `/api/answer`, and `/api/result`.

Set **SESSION_SECRET** in Vercel environment variables to a random value of at least 32 characters. Generate a value using `openssl rand -hex 32`. Do not use a `VITE_` prefix. Deploy after setting the variable. Preview and production should each have their own secrets. No database setup is needed. Changing the secret invalidates existing saved sessions.

`npm run preview` previews frontend files only; use `npm run dev` for a locally playable game with the API. This repository has not been published to a Vercel account.

## Learning and scoring

Source reviewed: `../WEBPRO IT GANJIL 2025-2026 (1).pdf`, Module 6, printed pages 41–50.

1. System Boot: `document.write`, demonstrated in section 6.5.
2. Variable Mutation: `var`, reassignment, simple arithmetic; sections 6.2.2 and 6.4.
3. CCTV Array: zero-based indexing; section 6.2.3.
4. Security Logic: `if/else` and `===`; section 6.2.4.
5. Object Experiment: object literals and explicitly requested dot notation; sections 6.3.1–6.3.2. Assessment remains limited to the requested property access.
6. Function Reactor: declaration and invocation; section 6.4.
7. jQuery Control: ID selector syntax demonstrated in section 6.6.1.
8. Final Escape: one scored selection containing `hide()`, `show()`, and `animate({height: "toggle"})`, matching sections 6.6.1–6.6.2. Actual jQuery effects demonstrate the repair.

Only the first committed answer per puzzle in the current signed token lineage contributes to the score. Correct / 8 × 100. Incorrect answers receive an explanation and an assisted repair; students always continue. The narrative clock advances from 03:00 to 06:00 independently of real elapsed time. Unlimited new sessions are intentional.

## Security model and limits

Private question generation, HMAC-SHA256 signatures, validation, and score calculation live in `server/`, outside the Vite entry graph. Option identifiers are session-specific opaque HMAC values, not stable correct-answer indices. Public question responses omit answer keys and explanations. After commitment, the explanation and repair are intentionally disclosed as feedback.

Signed tokens contain identity, session ID, progress, booleans for recorded outcomes, and timestamps, but no answer keys. Tokens are signed, not encrypted. Local storage is browser-local and readable by the user. API responses use `no-store`; token signatures and seven-day expiry are checked, inputs are bounded, puzzle order is enforced, incomplete result requests are rejected, and client-provided scores are ignored. Production source maps are disabled.

**Stateless limitation:** a client can replay an old valid token and enumerate alternatives in parallel. There is no global first-attempt enforcement, duplicate detection, server-side revocation, or per-student anti-cheat guarantee without persistent storage. This implementation prevents resubmission using the newly issued progress token; it does not claim to prevent old-token replay. Hosting-level rate limiting may reduce abuse but cannot solve this property. Scores are educational records, not tamper-proof identity certification.

A network interruption after server validation but before receiving the new token can leave the browser holding an earlier token. Stateless processing cannot provide exactly-once delivery. Retry behavior follows the documented old-token limitation.

## Verification

```sh
npm test
npm run build
node tests/browser.mjs
```

The browser script uses Playwright with macOS Chrome by default. Set `CHROME_PATH` for a different executable. Tests exercise registration, physical walking, terminal selection, hints, wrong-answer repair, room progression, refresh, pause, Watcher appearances, all eight systems, ending, results, and replay. Backend tests cover many variants, equal scoring, correct/incorrect runs, malformed inputs, signature tampering, ordering, premature results, and the explicitly expected replay limitation.

Original bitmap art is in `public/assets/`, generated with the built-in imagegen tool. Environment images are scenery layers; collision, doors, lights, character, terminals, camera, interaction prompts, and progression remain actual game entities. Asset prompts are recorded in `docs/art-prompts.md`. Audio is synthesized locally through Web Audio. Google Fonts has system fallbacks if unavailable.

The game is optimized for desktop. Mobile controls are provided, but a laptop is recommended for reading code. Browser rendering and local handler compatibility can be tested here; an actual Vercel deployment must still be smoke-tested on its deployed URL.

## Visual revision

The title screen and HUD now show only essential information. Movement guidance disappears after the first walk, room names appear briefly, and terminal instructions are condensed around the mission, code, choices, and confirmation. Result identity and grading information remain complete.

Sector dimensions and terminal positions vary through `src/game/layout.js`. Original vector illustrations in `src/game/assets/illustrations.js` add textured terminals, doors, a maintenance robot, and an organic Watcher silhouette. Repairs animate doors, rotate the generator, restore actual camera images, and move the robot. Watcher events follow sector entry and selected repairs instead of a repeating timer. Puzzle/pause overlays freeze physics, scene timers, and tweens.

For a second local preview alongside an existing server: `PORT=5174 npm run dev`. Browser tests accept `BASE_URL=http://127.0.0.1:5174`. `tests/visual.mjs` checks final-puzzle desktop fit and mobile controls. `tests/environment.mjs` checks hold-task pause/resume, task recovery and jumpscare preference persistence.

Existing raster backgrounds are retained; some crops remain visibly softer than the character and vector props. Desktop/laptop remains the primary platform.

## Aktivitas fasilitas

Delapan puzzle tetap menjadi satu-satunya sumber nilai. Aktivitas dunia di antaranya mencakup mengambil kartu akses, membawa dan memasang sekring, memilih feed CCTV, menarik tuas, menahan E untuk menutup katup, mengirim robot, mengatur kanal antena, dan membuka segel EXIT. Aktivitas ini tersimpan bersama posisi pemain dan bisa dilanjutkan setelah refresh, termasuk sesudah soal terakhir sebelum keluar.

Kejutan mengikuti interaksi tertentu: feed kamera yang salah, gangguan di laboratorium, dan pendekatan ke EXIT. Tidak ada pengurangan nilai atau batas waktu pada task. Pilihan **Kurangi jumpscare** tersedia di menu jeda; preferensi reduced motion juga mengurangi kejutan. Terminal dan menu jeda menghentikan dunia, termasuk animasi dan timer.

## Horror gameplay QA revision

The earlier environmental tasks varied the props but still relied on approaching an object and pressing E. Exploration now has a security scan with a visible safe interval, plus a Watcher patrol in Surveillance. The Watcher notices flashlight exposure, nearby sprint noise and direct contact. Turning off the light reduces visibility; holding SPACE crouches, or hides when beside a locker. SHIFT sprints with limited stamina. Hiding breaks pursuit and lets the Watcher search before returning to patrol.

After opening the final seal, the player must sprint to EXIT through an extended corridor. Being caught returns the player to a safe room checkpoint; completed tasks, answers and grading tokens survive. These encounters never run while a terminal or pause menu is open. Reduced jumpscare settings suppress abrupt overlays and camera shake; they preserve the exploration rules. Touch controls also provide flashlight, hide and sprint inputs.

Run `node tests/horror.mjs` to verify hiding, pursuit, capture recovery, scanner failure/safe crossing, and the final escape. `tests/browser.mjs` now follows a physical hiding route and completes the last sprint as part of the full eight-sector run.

## Opening, reflection and learning report

New shifts begin with a horror warning and compact controls, including optional sound and reduced jumpscares. After operator registration, players write a 20–600-character personal reflection about JavaScript responding to user actions. This is unscored and included in signed session state, resume responses, the final report, and copied results. The short opening can be skipped and is recoverable after refresh.

Every incorrect first answer produces a brief terminal disturbance before the assisted repair. Reduced jumpscares or reduced motion use a static notice instead of an abrupt Watcher overlay. The game world remains paused throughout answer feedback.

The final report is a single facility shift record: score, title and the original essay appear together. Eight JavaScript/jQuery learning notes with first-answer review flags expand beneath the record. Titles are Penjaga NULL-07 (8 correct), Pemulih Sistem (6–7), Operator Malam (4–5), and Penyintas Pemula (0–3). They describe the run and do not grade the essay. Legacy sessions can omit reflection.

`node tests/onboarding.mjs` verifies warnings, opening recovery, reflection integrity/HTML escaping, normal/reduced wrong-answer reactions, and the combined desktop report.

## Archive typography and soundscape

Oswald headings and Source Sans 3 body text are bundled locally with their OFL licenses in `public/fonts/`; Google Fonts is not requested at runtime. Results use a dark industrial record, with the original essay directly under identity, score and title.

`public/audio/null07-ambience.wav` is an original 48-second procedural loop (low drones, ventilation noise, distant metallic echoes), reproducible with `python3 scripts/generate-ambience.py`. Sound starts after an explicit start/continue gesture and can be disabled before the shift or through the HUD/pause menu. Volume and mute settings persist locally. Ambience fades during puzzles, pause and results; threat proximity raises its intensity. `node tests/audio.mjs` verifies decoding, playback, fade, mute, volume persistence and local fonts in Chrome.


Horror direction uses Alien: Isolation as a reference for industrial atmosphere, anticipation and sound, with original NULL-07 artwork and characters. Reference: https://news.xbox.com/en-us/2014/10/07/games-aliens-isolation-interview/amp/

Wrong answers now interrupt the terminal with a short signal failure, close-range Watcher lunge and dark aftermath. CCTV, corridor and capture scares use different anticipation delays. Movement and threat updates stop during the world scare, and opening an overlay cancels it. Reduced scares or reduced motion use the quiet feedback path. The original impact/breath sting is reproducible with `python3 scripts/generate-scare.py`, respects mute/volume, and varies its pitch slightly between attacks.

Players choose Horror (full jumpscares) or Tenang (no jumpscares) in the opening guide and can change it from pause. Mode is remembered on this device; puzzles and scoring are identical in both modes.

Players can choose MC cewek or MC cowok in the operator registration form. The selector presents industrial personnel ID cards using portraits from the actual six-pose game sprites, which were derived from the supplied photographs. Choice is stored with the local run and restored after reload; older runs use the male protagonist. A new shift can select a different MC without restarting the browser. `node tests/characters.mjs` covers both selections, live sprite/animation, transparent frame layout, resume, same-scene switching and legacy compatibility.

## Story, facility audio and downloadable reports

The opening scans Allie's (20050730) or Noah's (20041108) personnel card and opens the facility door. It remains skippable and supports reduced motion. Each MC has distinct short room/task comments. Radio transmissions become suspicious deeper in the facility; the MC responds with safe environmental guidance. Captions pause with the world and are queued briefly rather than displayed as permanent HUD text.

Each restored terminal leaves a room-specific visual trace: control signal bars, generator core, CCTV indicators, security route lights, lab indicators, robot spotlight, surveillance carrier rings and EXIT lighting. The four ending presentations depend on the server-verified correct-answer count and include different MC closing lines and facility lighting.

Ten additional original facility sound effects (steps, door, generator, radio static, knocks, pipe resonance, steam, robot servo, scanner, breath-like whisper) are generated with `python3 scripts/generate-effects.py`. Sound obeys mute/volume, limits overlap, adds stereo direction to distant sounds and stops during overlays. Tenang suppresses close-up scares and the whisper cue; the established exploration/challenges remain.

The result's **UNDUH LAPORAN PNG** button exports a complete 1200px-wide image with character/ID, student identity, grade, completion time, ending, essay and all eight learning notes. Height grows to fit content, including long identities/essays; file naming follows `QJS_NIM_NamaLengkap.png`. `node tests/cinematic.mjs` verifies the actual browser download and report bounds.
