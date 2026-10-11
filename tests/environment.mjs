import { chromium } from "@playwright/test";
import { sectors } from "../src/game/layout.js";
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
page.on("pageerror", (e) => errors.push(e.message));
async function api(action, body) {
  const response = await page.request.post(base + "/api/" + action, {
    data: body,
  });
  if (!response.ok()) throw new Error(action + ": " + response.status());
  return response.json();
}
let run = await api("session", {
  name: "Environment QA",
  nim: "123",
  kelas: "TI-A",
});
for (let i = 0; i < 4; i++) {
  const q = await api("question", { token: run.token, puzzle: i });
  run = await api("answer", {
    token: run.token,
    puzzle: i,
    option: q.options[0].id,
  });
}
run = {
  token: run.token,
  progress: run.progress,
  identity: run.identity,
  started: run.started,
  x: sectors[4].start + 600,
  tutorialSeen: true,
  world: worldState(null, 4),
};
await page.goto(base);
await page.evaluate(
  (r) => localStorage.setItem("null07-run", JSON.stringify(r)),
  run,
);
await page.reload();
await page.click("#start");
await page.waitForSelector(".hud");
await page.waitForTimeout(1000);
await page.keyboard.down("e");
await page.waitForTimeout(400);
await page.keyboard.press("Escape");
await page.waitForSelector("#resume");
await page.keyboard.up("e");
await page.waitForTimeout(1700);
if (
  await page.evaluate(() =>
    JSON.parse(localStorage.getItem("null07-run")).world.done.includes("seal"),
  )
)
  throw new Error("Hold task completed while paused");
await page.check("#pause-tenang");
await page.click("#resume");
await page.waitForTimeout(100);
await page.keyboard.down("e");
await page.waitForTimeout(1600);
await page.keyboard.up("e");
await page.keyboard.press("Escape");
await page.waitForSelector("#resume");
if (
  !(await page.evaluate(() =>
    JSON.parse(localStorage.getItem("null07-run")).world.done.includes("seal"),
  ))
)
  throw new Error("Hold task failed after resume");
await page.reload();
await page.click("#start");
await page.waitForSelector(".hud");
await page.keyboard.press("Escape");
await page.waitForSelector("#resume");
if (!(await page.isChecked("#pause-tenang")))
  throw new Error("Reduced scare setting lost on refresh");
if (
  !(await page.evaluate(() =>
    JSON.parse(localStorage.getItem("null07-run")).world.done.includes("seal"),
  ))
)
  throw new Error("Task lost on refresh");
console.log({
  errors,
  holdPauseResume: true,
  taskRefresh: true,
  scarePreferenceRefresh: true,
});
await browser.close();
if (errors.length) process.exit(1);
