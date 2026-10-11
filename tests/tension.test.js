import test from "node:test";
import assert from "node:assert/strict";
import { patrolState, stepPatrol, scannerActive } from "../src/game/tension.js";
const player = (overrides) => ({
  x: 850,
  light: true,
  crouching: false,
  hidden: false,
  running: false,
  ...overrides,
});
const tick = (state, p, seconds) => {
  let caught = false;
  for (let n = 0; n < seconds * 60; n++)
    caught ||= stepPatrol(state, p, 1000 / 60);
  return caught;
};
test("Watcher reacts to sight and sprint noise, not just an interaction button", () => {
  const sight = patrolState();
  tick(sight, player({}), 1.3);
  assert.equal(sight.mode, "chase");
  const quiet = patrolState();
  tick(quiet, player({ light: false, crouching: true }), 1.3);
  assert.equal(quiet.mode, "patrol");
  assert.equal(quiet.suspicion, 0);
  const noise = patrolState();
  tick(noise, player({ light: false, crouching: false, running: true }), 1.3);
  assert.equal(noise.mode, "chase");
});
test("cover breaks pursuit; searching expires and patrol resumes without damage to progress", () => {
  const state = patrolState();
  tick(state, player({}), 1.3);
  assert.equal(tick(state, player({ hidden: true }), 2), false);
  assert.equal(state.mode, "search");
  assert.equal(tick(state, player({ hidden: true }), 4), false);
  assert.equal(state.mode, "patrol");
  const exposed = patrolState();
  assert.equal(tick(exposed, player({}), 5), true);
});
test("security scan offers a repeatable safe crossing window", () => {
  assert.equal(scannerActive(0), true);
  assert.equal(scannerActive(2.7), false);
  assert.equal(scannerActive(4.5), true);
});
