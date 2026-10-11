import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/[action].js";
process.env.SESSION_SECRET = "vercel-handler-test-secret-at-least-32-chars";
function request(action, body, method = "POST", headers = {}) {
  const r = {
    code: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(c) {
      this.code = c;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };
  handler({ method, headers, query: { action }, body }, r);
  return r;
}
test("Vercel handler accepts Node req/res and rejects invalid requests", () => {
  const r = request("session", { name: "Operator", nim: "123", kelas: "A" });
  assert.equal(r.code, 200);
  assert.ok(r.data.token);
  assert.equal(r.headers["Cache-Control"], "no-store");
  assert.equal(request("session", {}, "GET").code, 405);
  assert.equal(
    request("session", {}, "POST", { "content-length": "9000" }).code,
    413,
  );
  assert.equal(request("resume", { token: "forged" }).code, 401);
  assert.equal(request("result", { token: r.data.token }).code, 409);
});
