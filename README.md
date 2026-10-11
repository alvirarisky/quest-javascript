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
5. Object Experiment: object literals and explicitly requested dot notation; sections 6.3.1–6.3.2. Optional unscored prototype field note follows section 6.3.3.
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
