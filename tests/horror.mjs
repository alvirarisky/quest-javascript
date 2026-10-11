import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { sectors } from "../src/game/layout.js";
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
async function api(action, body) {
  const r = await page.request.post(base + "/api/" + action, { data: body });
  assert.ok(r.ok(), action + " " + r.status());
  return r.json();
}
async function stage(progress, offset) {
  await page.close();
  page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on("pageerror", (e) => errors.push(e.message));
  let run = await api("session", {
    name: "Horror QA",
    nim: "123",
    kelas: "TI-A",
  });
  for (let i = 0; i < progress; i++) {
    const q = await api("question", { token: run.token, puzzle: i });
    run = await api("answer", {
      token: run.token,
      puzzle: i,
      option: q.options[0].id,
    });
  }
  const room = progress === 4 ? 3 : progress === 8 ? 7 : 6;
  run = {
    token: run.token,
    progress,
    identity: run.identity,
    started: run.started,
    x: sectors[room].start + offset,
    tutorialSeen: true,
    world: worldState(null, progress),
  };
  if (room === 6) run.world.done.push("signal");
  await page.goto(base);
  await page.evaluate(
    (r) => localStorage.setItem("null07-run", JSON.stringify(r)),
    run,
  );
  await page.reload();
  await page.click("#start");
  await page.waitForSelector(".hud");
  return run;
}
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("null07-run")));
await stage(6, 590);
await page.waitForSelector("#tension-status[data-state=chase]", {
  timeout: 15000,
});
await page.keyboard.down("Space");
await page.keyboard.press("f");
await page.waitForSelector("#tension-status[data-state=hidden]");
await page.screenshot({ path: "/tmp/null07-hidden.png" });
await page.waitForTimeout(5200);
assert.equal((await state()).world.retreats, 0, "Hidden player was caught");
await page.keyboard.press("Escape");
await page.waitForSelector("#resume");
const pausedX = (await state()).x;
await page.keyboard.up("Space");
await page.waitForTimeout(1800);
assert.equal((await state()).x, pausedX, "Paused world moved");
await page.click("#resume");
const initial = await stage(6, 590);
await page.waitForFunction(
  () => JSON.parse(localStorage.getItem("null07-run")).world.retreats > 0,
  { timeout: 15000 },
);
await page.keyboard.press("Escape");
await page.waitForSelector("#resume");
const caught = await state();
assert.equal(caught.token, initial.token, "Capture altered grading token");
assert.ok(caught.world.done.includes("signal"), "Capture lost completed task");
assert.ok(
  Math.abs(caught.x - sectors[6].start - 145) < 5,
  "Capture did not return to safe checkpoint",
);
await stage(4, 1110);
await page.waitForTimeout(700);
await page.keyboard.down("d");
await page.waitForTimeout(700);
await page.keyboard.up("d");
assert.ok(
  (await state()).world.retreats > 0,
  "Active scanner allowed crossing",
);
await page.waitForFunction(
  () =>
    document.querySelector("#objective")?.textContent.includes("CELAH TERBUKA"),
  { timeout: 8000 },
);
await page.keyboard.down("d");
await page.waitForTimeout(900);
await page.keyboard.up("d");
await page.keyboard.press("Escape");
await page.waitForSelector("#resume");
assert.ok(
  (await state()).x > sectors[3].start + 1214,
  "Safe scan window blocked crossing",
);
const final = await stage(8, 1080);
await page.waitForFunction(
  () => JSON.parse(localStorage.getItem("null07-run")).world.retreats > 0,
  { timeout: 12000 },
);
await page.waitForSelector("#tension-status[data-state=escape]");
await page.keyboard.down("Shift");
await page.keyboard.down("d");
await page.waitForTimeout(1950);
await page.keyboard.up("d");
await page.keyboard.up("Shift");
await page.keyboard.press("e");
await page.waitForSelector(".result", { timeout: 10000 });
assert.equal(
  (await state()).token,
  final.token,
  "Final pursuit altered grading token",
);
assert.equal((await state()).escaped, true);
await page.screenshot({ path: "/tmp/null07-horror-result.png" });
console.log({
  errors,
  hideBreaksPursuit: true,
  capturePreservesProgress: true,
  scannerFailureAndSafeCrossing: true,
  pause: true,
  finalPursuitRecoveryAndEscape: true,
});
await browser.close();
assert.equal(errors.length, 0);
