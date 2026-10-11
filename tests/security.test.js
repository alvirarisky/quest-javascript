import test from "node:test";
import assert from "node:assert/strict";
import { dispatch } from "../server/core.js";
import { question } from "../server/questions.js";
process.env.SESSION_SECRET = "test-only-secret-at-least-thirty-two-characters";
const start = () =>
  dispatch("session", { name: "Test Operator", nim: "123", kelas: "TI-A" });
const state = (r) =>
  JSON.parse(Buffer.from(r.token.split(".")[0], "base64url").toString());
test("all eight variants, equally scored, no answer key before commitment", () => {
  for (let trial = 0; trial < 30; trial++) {
    let r = start();
    for (let i = 0; i < 8; i++) {
      const q = dispatch("question", { token: r.token, puzzle: i });
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options.map((o) => o.label)).size, 4);
      assert.ok(!("answer" in q));
      assert.ok(!("explanation" in q));
      const privateQ = question(state(r), process.env.SESSION_SECRET);
      r = dispatch("answer", {
        token: r.token,
        puzzle: i,
        option: privateQ.options.find(
          (o) => o.label === privateQ.choices[privateQ.answer],
        ).id,
      });
      assert.equal(r.correct, true);
    }
    const result = dispatch("result", { token: r.token, score: 0 });
    assert.equal(result.score, 100);
    assert.equal(result.total, 8);
  }
});
test("wrong answers repair and score only first answer", () => {
  let r = start();
  for (let i = 0; i < 8; i++) {
    const q = question(state(r), process.env.SESSION_SECRET);
    r = dispatch("answer", {
      token: r.token,
      puzzle: i,
      option: q.options.find((o) => o.label === q.choices[(q.answer + 1) % 4])
        .id,
    });
    assert.equal(r.correct, false);
    assert.ok(r.repair);
  }
  assert.equal(dispatch("result", { token: r.token, score: 100 }).score, 0);
  assert.throws(() =>
    dispatch("answer", { token: r.token, puzzle: 7, option: "0" }),
  );
});
test("tamper, malformed input, order, premature result rejected", () => {
  const r = start();
  assert.throws(() => dispatch("result", { token: r.token }));
  assert.throws(() => dispatch("question", { token: r.token, puzzle: 3 }));
  assert.throws(() =>
    dispatch("answer", { token: r.token, puzzle: 0, option: "8" }),
  );
  assert.throws(() => dispatch("resume", { token: r.token + "x" }));
  assert.throws(() => dispatch("session", { name: "", nim: "1", kelas: "A" }));
  assert.throws(() => dispatch("session", { name: "x".repeat(9000) }));
});
test("stateless old tokens can replay: documented limitation", () => {
  const r = start();
  const q = dispatch("question", { token: r.token, puzzle: 0 });
  const a = dispatch("answer", {
    token: r.token,
    puzzle: 0,
    option: q.options[0].id,
  });
  const b = dispatch("answer", {
    token: r.token,
    puzzle: 0,
    option: q.options[1].id,
  });
  assert.equal(a.progress, 1);
  assert.equal(b.progress, 1);
});
test("reflection is signed, unscored, preserved on resume and result; titles follow grade", () => {
  const reflection =
    "Menurut saya JavaScript merespons klik pengguna dan mengubah tampilan.";
  for (const target of [0, 4, 6, 8]) {
    let r = dispatch("session", {
      name: "Test",
      nim: "1",
      kelas: "A",
      reflection,
    });
    assert.equal(dispatch("resume", { token: r.token }).reflection, reflection);
    for (let i = 0; i < 8; i++) {
      const q = question(state(r), process.env.SESSION_SECRET);
      const answer = i < target ? q.answer : (q.answer + 1) % 4;
      r = dispatch("answer", {
        token: r.token,
        puzzle: i,
        option: q.options.find((o) => o.label === q.choices[answer]).id,
      });
    }
    const result = dispatch("result", { token: r.token, reflection: "forged" });
    assert.equal(result.reflection, reflection);
    assert.equal(result.score, (target / 8) * 100);
    assert.equal(result.outcomes.length, 8);
    assert.equal(
      result.rank,
      {
        0: "PENYINTAS PEMULA",
        4: "OPERATOR MALAM",
        6: "PEMULIH SISTEM",
        8: "PENJAGA NULL-07",
      }[target],
    );
    assert.ok(result.rankDescription);
  }
  for (const reflection of [42, "short", "x".repeat(601)])
    assert.throws(() =>
      dispatch("session", { name: "Test", nim: "1", kelas: "A", reflection }),
    );
});
