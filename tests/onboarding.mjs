import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { worldState } from "../src/game/missions.js";
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
let page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base);
await page.click("#start");
await page.waitForSelector(".horror-warning");
assert.match(await page.locator(".control-guide").innerText(), /SPACE/);
await page.check("#brief-tenang");
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("null07-settings")).reduceScares,
  ),
  true,
);
await page.click("#brief-back");
await page.click("#start");
assert.equal(await page.isChecked("#brief-tenang"), true);
await page.check("#brief-horror");
await page.screenshot({ path: "/tmp/null07-briefing.png" });
await page.click("#brief-next");
await page.fill("[name=name]", "QA Refleksi");
await page.fill("[name=nim]", "123");
await page.fill("[name=kelas]", "TI-A");
await page.click("#identity button[type=submit]");
const essay =
  "Menurut saya JavaScript merespons klik pengguna, misalnya menampilkan informasi ketika tombol dipilih. <script>window.essayInjected=true</script>";
await page.fill("#essay", essay);
await page.click("#reflection button[type=submit]");
await page.waitForSelector("#intro-next");
await page.click("#intro-next");
assert.match(await page.locator(".opening").innerText(), /Delapan sistem/);
await page.reload();
await page.click("#start");
await page.waitForSelector("#intro-next");
await page.click("#intro-skip");
await page.waitForSelector(".hud");
let run = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("null07-run")),
);
assert.equal(run.reflection, essay);
await page.keyboard.press("Escape");
await page.waitForSelector("#pause-tenang");
await page.check("#pause-tenang");
await page.reload();
await page.click("#start");
await page.waitForSelector(".hud");
await page.keyboard.press("Escape");
await page.waitForSelector("#pause-tenang");
assert.equal(await page.isChecked("#pause-tenang"), true);
await page.check("#pause-horror");
await page.click("#resume");
async function seed(r, reduceScares = false) {
  await page.close();
  page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.evaluate(
    ({ r, reduceScares }) => {
      localStorage.setItem("null07-run", JSON.stringify(r));
      localStorage.setItem("null07-settings", JSON.stringify({ reduceScares }));
    },
    { r, reduceScares },
  );
  await page.reload();
  await page.click("#start");
}
run = { ...run, x: 760, world: { ...worldState(null), done: ["badge"] } };
for (const reduced of [false, true]) {
  await seed(run, reduced);
  await page.waitForSelector(".hud");
  await page.waitForTimeout(800);
  await page.keyboard.press("e");
  await page.waitForSelector(".terminal");
  await page.locator(".option").filter({ hasText: "document.print" }).click();
  await page.click("#answer button[type=submit]");
  await page.waitForSelector(".fault-message");
  if (!reduced) {
    await page.waitForSelector(".answer-disturbance");
    assert.equal(await page.locator("#continue").isEnabled(), false);
    assert.equal(
      await page
        .locator(".answer-disturbance img")
        .evaluate((img) => getComputedStyle(img).opacity),
      "0",
    );
    await page.waitForSelector('.answer-disturbance[data-phase="impact"]');
    await page.screenshot({ path: "/tmp/null07-answer-scare.png" });
    await page.waitForSelector(".answer-disturbance", { state: "detached" });
  } else assert.equal(await page.locator(".answer-disturbance").count(), 0);
  assert.equal(await page.locator("#continue").isEnabled(), true);
}
async function api(action, body) {
  const response = await page.request.post(base + "/api/" + action, {
    data: body,
  });
  assert.ok(response.ok());
  return response.json();
}
let r = await api("session", {
  name: "QA Refleksi",
  nim: "123",
  kelas: "TI-A",
  reflection: essay,
});
for (let i = 0; i < 8; i++) {
  const q = await api("question", { token: r.token, puzzle: i });
  r = await api("answer", {
    token: r.token,
    puzzle: i,
    option: q.options[0].id,
  });
}
await seed({
  ...r,
  world: worldState(null, 8),
  escaped: true,
  introSeen: true,
});
await page.waitForSelector(".result");
assert.equal(await page.locator(".essay-result").isVisible(), true);
assert.equal(await page.locator(".score").isVisible(), true);
assert.equal(await page.locator(".essay-result").innerText(), essay);
assert.equal(await page.evaluate(() => window.essayInjected), undefined);
assert.equal(await page.locator("#tab-reflection").count(), 0);
const resultText = await page.locator(".result").innerText();
for (const removed of [
  "REFLEKSI PRIBADI",
  "Esai pribadi tidak memengaruhi nilai",
  "Simpan hasil untuk pengumpulan",
])
  assert.ok(!resultText.includes(removed));
for (const [width, height] of [
  [1366, 768],
  [1440, 900],
  [1536, 960],
]) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => document.fonts.ready);
  const box = await page.locator(".result").boundingBox();
  assert.ok(
    box.y >= 0 && box.y + box.height <= height,
    "Combined result clips",
  );
  await page.screenshot({ path: `/tmp/null07-combined-result-${width}.png` });
}
await page.locator(".learning-record summary").click();
assert.equal(await page.locator(".lesson-list article").count(), 8);
await page.screenshot({ path: "/tmp/null07-record-learning.png" });
console.log({
  errors,
  warning: true,
  selectableModesAndPersistence: true,
  removedResultCopy: true,
  openingRefresh: true,
  reflectionPreservedAndEscaped: true,
  wrongAnswerScare: true,
  reducedScare: true,
  combinedResultAndEssay: true,
});
await browser.close();
assert.equal(errors.length, 0);
