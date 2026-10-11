import test from "node:test";
import assert from "node:assert/strict";
import {
  tasks,
  worldState,
  nextTask,
  terminalReady,
  passageReady,
  completeTask,
} from "../src/game/missions.js";
test("eight assessments remain separate from before/after environmental tasks", () => {
  const state = worldState(null);
  assert.equal(terminalReady(0, state), false);
  completeTask(state, "badge");
  assert.equal(terminalReady(0, state), true);
  assert.equal(passageReady(0, 0, state), false);
  assert.equal(passageReady(0, 1, state), true);
  for (let room = 1; room < 8; room++) {
    for (const t of tasks.filter(
      (t) => t.room === room && t.phase === "before",
    ))
      completeTask(state, t.id);
    assert.equal(terminalReady(room, state), true);
    assert.equal(passageReady(room, room, state), false);
    const post = tasks.filter((t) => t.room === room && t.phase === "after");
    if (post.length) assert.equal(passageReady(room, room + 1, state), false);
    for (const t of post) completeTask(state, t.id);
    assert.equal(passageReady(room, room + 1, state), true);
  }
  assert.equal(state.done.length, tasks.length);
});
test("saved fuse, dial, tasks and scares recover without increasing score", () => {
  const s = worldState(null);
  completeTask(s, "badge");
  completeTask(s, "fuse");
  s.inventory = ["fuse"];
  s.dial = 1;
  s.scares = ["camera"];
  const restored = worldState(JSON.parse(JSON.stringify(s)), 1);
  assert.deepEqual(restored, s);
  assert.equal(nextTask(1, 1, restored).id, "power");
  assert.ok(!("score" in restored));
});
test("legacy runs migrate completed sectors; damaged optional state is bounded", () => {
  const legacy = worldState(null, 4);
  assert.equal(passageReady(3, 4, legacy), true);
  assert.equal(terminalReady(4, legacy), false);
  const corrupt = worldState({
    version: 1,
    done: "invalid",
    inventory: 42,
    scares: {},
    dial: 999,
  });
  assert.deepEqual(corrupt.done, []);
  assert.equal(corrupt.dial, 2);
  assert.throws(() => completeTask(corrupt, "arbitrary"));
});
