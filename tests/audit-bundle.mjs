import fs from "node:fs";
import assert from "node:assert/strict";
const files = fs.readdirSync("dist/assets");
const bundle = files
  .filter((f) => f.endsWith(".js"))
  .map((f) => fs.readFileSync("dist/assets/" + f, "utf8"))
  .join("\n");
for (const marker of [
  "SESSION_SECRET",
  "createHmac",
  "VARIABLE MUTATION",
  "FUNCTION REACTOR",
  "CCTV ARRAY",
  "privateQuestion",
  "test-only-secret",
])
  assert.ok(!bundle.includes(marker), "Private marker exposed: " + marker);
assert.ok(
  !files.some((f) => f.endsWith(".map")),
  "Production source map exposed",
);
console.log(
  "Production bundle audit passed: private templates, server signing code, and source maps absent.",
);
