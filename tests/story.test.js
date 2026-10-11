import test from "node:test";
import assert from "node:assert/strict";
import {
  operator,
  entryLines,
  recoveryLine,
  taskLine,
  endingFor,
} from "../src/game/story.js";
import { reportFilename } from "../src/game/report.js";
test("verified correct counts select the four ending boundaries for either MC", () => {
  for (const id of ["female", "male"])
    for (const [count, tier] of [
      [0, 0],
      [3, 0],
      [4, 1],
      [5, 1],
      [6, 2],
      [7, 2],
      [8, 3],
    ]) {
      const ending = endingFor(count, id);
      assert.equal(ending.tier, tier);
      assert.equal(ending.speaker, operator(id).name);
    }
  assert.notEqual(endingFor(8, "female").copy, endingFor(8, "male").copy);
  assert.equal(operator("female").number, "20050730");
  assert.equal(operator("male").number, "20041108");
});
test("both MCs have distinct room/task reactions, dubious radio is answered with safe guidance", () => {
  for (const id of ["female", "male"])
    for (let room = 0; room < 8; room++) {
      assert.equal(entryLines(room, id).length, 2);
      assert.ok(recoveryLine(room, id).text);
    }
  assert.notEqual(
    entryLines(0, "female")[1].text,
    entryLines(0, "male")[1].text,
  );
  assert.ok(entryLines(3, "female")[0].suspicious);
  assert.match(entryLines(3, "female")[1].text, /padam/);
  assert.match(entryLines(6, "male")[1].text, /Matikan senter/);
  assert.ok(taskLine("exit", "female"));
  assert.equal(taskLine("invalid", "male"), null);
  assert.equal(
    reportFilename({ nim: "123", name: "Allie QA" }),
    "QJS_123_AllieQA.png",
  );
  assert.ok(
    !reportFilename({ nim: "../../123", name: "<script>/X" }).includes("/"),
  );
});
