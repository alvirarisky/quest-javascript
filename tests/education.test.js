import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { question } from "../server/questions.js";
const key = "independent-education-test-signing-secret";
test("module examples evaluate to their stated correct answers", () => {
  for (let n = 0; n < 100; n++)
    for (let progress = 0; progress < 8; progress++) {
      const q = question({ id: "education-" + n, progress }, key);
      const choice = q.choices[q.answer];
      const out = [];
      if (progress === 0) {
        vm.runInNewContext(choice, { document: { write: (s) => out.push(s) } });
        assert.deepEqual(out, ["System online"]);
      }
      if (progress === 1) {
        const value = vm.runInNewContext(q.code + "\npower;");
        assert.equal(String(value), choice);
      }
      if (progress === 2) {
        const list = vm.runInNewContext(q.code + "\ncameras;");
        assert.ok(q.instruction.includes(list[Number(choice)]));
      }
      if (progress === 3) {
        vm.runInNewContext(q.code, { document: { write: (s) => out.push(s) } });
        assert.equal(out[0], choice);
      }
      if (progress === 4) {
        const value = vm.runInNewContext(q.code + "\n" + choice);
        assert.ok(["NULL", "stable"].includes(value));
      }
      if (progress === 5) {
        assert.equal(
          vm.runInNewContext(q.code + "\n" + choice),
          "ROBOT ONLINE",
        );
      }
      if (progress === 6) {
        vm.runInNewContext(choice, { $: (s) => out.push(s) });
        assert.deepEqual(out, ["#surveillance"]);
      }
      if (progress === 7) {
        vm.runInNewContext(choice, {
          $: (s) => ({
            hide: () => out.push(s + ":hide"),
            show: () => out.push(s + ":show"),
            animate: (p) => out.push(s + ":" + p.height),
          }),
        });
        assert.deepEqual(out, [
          "#corruption:hide",
          "#exit:show",
          "#signal:toggle",
        ]);
      }
    }
});
