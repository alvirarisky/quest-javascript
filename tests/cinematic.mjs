import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { worldState } from "../src/game/missions.js";
import { endingFor } from "../src/game/story.js";
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
async function api(action, data) {
  const r = await page.request.post(base + "/api/" + action, { data });
  assert.ok(r.ok());
  return r.json();
}
async function instrument() {
  await page.evaluate(async () => {
    const source = await fetch("/src/main.js").then((r) => r.text());
    const url = source.match(
      /import\(["']([^"']*game\/world\.js[^"']*)["']\)/,
    )[1];
    const { Facility } = await import(url);
    const create = Facility.prototype.create;
    Facility.prototype.create = function () {
      create.call(this);
      window.__qaScene = this;
    };
  });
}
try {
  await page.goto(base);
  await instrument();
  await page.click("#start");
  await page.click("#brief-next");
  await page.fill("[name=name]", "Cinematic QA");
  await page.fill("[name=nim]", "123");
  await page.fill("[name=kelas]", "TI-A");
  await page.check("[name=character][value=female]");
  assert.match(
    await page.locator(".character-card").first().innerText(),
    /20050730/,
  );
  await page.click("#identity button[type=submit]");
  await page.fill(
    "#essay",
    "JavaScript membantu halaman merespons interaksi pengguna dan memperbarui tampilan.",
  );
  await page.click("#reflection button[type=submit]");
  await page.waitForSelector(".scanner-card");
  assert.match(await page.locator(".scanner-card").innerText(), /Allie/);
  assert.match(await page.locator(".scanner-card").innerText(), /20050730/);
  await page.waitForTimeout(1450);
  await page.screenshot({ path: "/tmp/null07-scanner-opening.png" });
  await page.click("#intro-next");
  await page.waitForSelector(".door-authorized");
  await page.click("#intro-next");
  await page.waitForSelector(".hud");
  await page.waitForSelector(".radio-caption");
  assert.match(await page.locator(".radio-caption").innerText(), /RADIO/);
  await page.screenshot({ path: "/tmp/null07-radio-story.png" });
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".radio-caption").count(), 0);
  await page.waitForTimeout(800);
  await page.click("#resume");
  await page.waitForSelector(".radio-caption");
  let run = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("null07-run")),
  );
  const q = await api("question", { token: run.token, puzzle: 0 });
  const a = await api("answer", {
    token: run.token,
    puzzle: 0,
    option: q.options[0].id,
  });
  await page.evaluate((a) => {
    const scene = window.__qaScene;
    scene.bridge.progress = () => a.progress;
    scene.applyProgress();
  }, a);
  const recovered = await page.evaluate(() => ({
    active: window.__qaScene.recoveryFx[0].alpha,
    other: window.__qaScene.recoveryFx[1].alpha,
    led: window.__qaScene.terminals[0].led.fillColor,
  }));
  assert.ok(recovered.active > 0);
  assert.equal(recovered.other, 0);
  assert.equal(recovered.led, 0xacc2a1);
  await page.screenshot({ path: "/tmp/null07-recovery-story.png" });
  let state = await api("session", {
    name: "Cinematic QA",
    nim: "123",
    kelas: "TI-A",
    reflection:
      "JavaScript membantu halaman merespons interaksi pengguna dan memperbarui tampilan.",
  });
  for (let i = 0; i < 8; i++) {
    const q = await api("question", { token: state.token, puzzle: i });
    state = await api("answer", {
      token: state.token,
      puzzle: i,
      option: q.options[0].id,
    });
  }
  const result = await api("result", { token: state.token });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const resultPage = await context.newPage();
  resultPage.on("pageerror", (e) => errors.push(e.message));
  await resultPage.goto(base);
  await resultPage.evaluate(
    (r) => localStorage.setItem("null07-run", JSON.stringify(r)),
    {
      ...state,
      character: "female",
      world: worldState(null, 8),
      escaped: true,
      introSeen: true,
    },
  );
  await resultPage.reload();
  await resultPage.click("#start");
  await resultPage.waitForSelector(".result");
  assert.equal(
    await resultPage.locator(".record-ending").getAttribute("data-ending"),
    String(endingFor(result.correct, "female").tier),
  );
  assert.match(
    await resultPage.locator(".record-header").innerText(),
    /20050730/,
  );
  const downloadPromise = resultPage.waitForEvent("download");
  await resultPage.click("#download");
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "QJS_123_CinematicQA.png");
  await download.saveAs("/tmp/null07-download-report.png");
  const bytes = await readFile("/tmp/null07-download-report.png");
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.ok(bytes.readUInt32BE(20) > 1300);
  assert.equal(bytes.toString("hex", 0, 8), "89504e470d0a1a0a");
  // Maximum essay/identity lengths must fit the exported record, including its final learning note/footer.
  const exportBounds = await resultPage.evaluate(async (result) => {
    const texts = [];
    const fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (
      text,
      x,
      y,
      ...args
    ) {
      texts.push({ text, x, y, right: x + this.measureText(text).width });
      return fill.call(this, text, x, y, ...args);
    };
    try {
      const { reportImage } = await import("/src/game/report.js");
      const long = {
        ...result,
        identity: {
          name: "A".repeat(80),
          nim: "9".repeat(80),
          kelas: "T".repeat(80),
        },
        reflection: "B".repeat(600),
      };
      const blob = await reportImage(long, "male");
      const img = await createImageBitmap(blob);
      const resultBounds = {
        height: img.height,
        maxY: Math.max(...texts.map((t) => t.y)),
        maxRight: Math.max(...texts.map((t) => t.right)),
        hasNoah: texts.some((t) => t.text === "Noah"),
        hasId: texts.some((t) => t.text.includes("20041108")),
        hasFooter: texts.some((t) => t.text.includes("QUEST-JAVASCRIPT")),
      };
      img.close();
      return resultBounds;
    } finally {
      CanvasRenderingContext2D.prototype.fillText = fill;
    }
  }, result);
  assert.ok(exportBounds.height > exportBounds.maxY + 20);
  assert.ok(exportBounds.maxRight < 1135);
  assert.ok(
    exportBounds.hasNoah && exportBounds.hasId && exportBounds.hasFooter,
  );
  await resultPage.screenshot({ path: "/tmp/null07-story-result.png" });
  assert.deepEqual(errors, []);
  console.log({
    openingScanner: true,
    radioPauses: true,
    roomRecovery: true,
    verifiedEnding: true,
    pngDownload: true,
    longReportFits: true,
    errors,
  });
} finally {
  await browser.close();
}
