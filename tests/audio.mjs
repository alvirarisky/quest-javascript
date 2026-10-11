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
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "warning") console.log(m.text());
});
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => {
  window.__soundSources = [];
  const make = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function (...args) {
    const node = make.apply(this, args);
    window.__soundSources.push(node);
    return node;
  };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (...args) {
    this.__output = args[0];
    return connect.apply(this, args);
  };
});
const response = await page.request.post(base + "/api/session", {
  data: { name: "Audio QA", nim: "1", kelas: "A" },
});
assert.ok(response.ok());
const r = await response.json();
await page.goto(base);
await page.evaluate((r) => {
  localStorage.setItem(
    "null07-run",
    JSON.stringify({
      ...r,
      x: 760,
      introSeen: true,
      world: {
        ...r.world,
        version: 1,
        done: ["badge"],
        inventory: [],
        scares: [],
        dial: 0,
      },
    }),
  );
  localStorage.setItem(
    "null07-settings",
    JSON.stringify({ soundOn: true, volume: 0.5 }),
  );
}, r);
await page.reload();
await page.click("#start");
await page.waitForSelector(".hud");
try {
  await page.waitForFunction(
    () =>
      window.__soundSources.some(
        (s) => s.loop && Math.abs(s.buffer?.duration - 48) < 0.01,
      ),
    null,
    { timeout: 5000 },
  );
} catch (e) {
  console.log(
    await page.evaluate(() => ({
      sound: document.querySelector("#audio")?.textContent,
      sources: window.__soundSources.map((s) => ({
        loop: s.loop,
        duration: s.buffer?.duration,
        state: s.context.state,
      })),
      resources: performance
        .getEntriesByType("resource")
        .filter((r) => r.name.includes("ambience"))
        .map((r) => ({ name: r.name, size: r.transferSize })),
      settings: localStorage.getItem("null07-settings"),
    })),
  );
  console.log({ errors });
  await browser.close();
  throw e;
}
await page.waitForTimeout(1000);
const sound = () =>
  page.evaluate(() => {
    const s = window.__soundSources.find((s) => s.loop);
    return {
      context: s.context.state,
      gain: s.__output.__output.gain.value,
      duration: s.buffer.duration,
    };
  });
assert.equal((await sound()).context, "running");
assert.ok((await sound()).gain > 0.1, "Ambience is silent during exploration");
await page.evaluate(() => document.fonts.ready);
assert.ok(
  await page.evaluate(
    () =>
      document.fonts.check('16px "Oswald"') &&
      document.fonts.check('16px "Source Sans 3"'),
  ),
);
await page.keyboard.press("e");
await page.waitForSelector(".terminal");
await page.waitForTimeout(1100);
assert.ok((await sound()).gain < 0.001, "Ambience did not fade during puzzle");
await page.locator(".option").filter({ hasText: "document.print" }).click();
await page.click("#answer button[type=submit]");
await page.waitForFunction(() =>
  window.__soundSources.some(
    (s) => !s.loop && s.buffer?.duration > 1.2 && s.buffer.duration < 1.4,
  ),
);
const impact = await page.evaluate(() => {
  const s = window.__soundSources.find((s) => !s.loop);
  return { gain: s.__output.gain.value, state: s.context.state };
});
assert.equal(impact.state, "running");
assert.ok(
  Math.abs(impact.gain - 0.325) < 0.001,
  "Impact did not respect chosen volume",
);
await page.click("#continue");
await page.waitForSelector(".hud");
await page.waitForTimeout(1000);
assert.ok((await sound()).gain > 0.1);
await page.click("#audio");
await page.waitForTimeout(1100);
assert.ok((await sound()).gain < 0.001, "Mute failed");
await page.keyboard.press("Escape");
await page.waitForSelector("#volume");
await page.locator("#volume").evaluate((el) => {
  el.value = "25";
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.click("#resume");
await page.reload();
await page.click("#start");
await page.waitForSelector(".hud");
assert.match(await page.locator("#audio").innerText(), /OFF/);
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("null07-settings")).volume,
  ),
  0.25,
);
console.log({
  errors,
  loopDecoded: true,
  playsDuringExploration: true,
  puzzleFade: true,
  mute: true,
  volumePersistence: true,
  localFonts: true,
  impactDecodedAndVolumeApplied: true,
});
await browser.close();
assert.equal(errors.length, 0);
