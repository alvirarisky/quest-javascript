import { chromium } from "@playwright/test";
import { sectors } from "../src/game/layout.js";
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
  const r = await page.request.post(base + "/api/" + action, { data: body });
  if (!r.ok()) throw new Error(action + " " + r.status());
  return r.json();
}
let run = await api("session", {
  name: "Visual QA",
  nim: "123",
  kelas: "TI-A",
});
for (let i = 0; i < 7; i++) {
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
  x: sectors[7].start + sectors[7].terminal,
  tutorialSeen: true,
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
await page.keyboard.press("e");
await page.waitForSelector(".final-terminal");
const fit = await page
  .locator(".terminal")
  .evaluate((el) => ({ height: el.clientHeight, scroll: el.scrollHeight }));
if (fit.scroll > fit.height + 2)
  throw new Error("Desktop final puzzle needs scrolling");
await page.screenshot({ path: "/tmp/null07-final-terminal.png" });
await page.keyboard.press("Escape");
await page.waitForSelector(".hud");
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "/tmp/null07-mobile.png" });
if (!(await page.locator(".touch").isVisible()))
  throw new Error("Touch controls missing");
await page.keyboard.press("e");
await page.waitForSelector(".terminal");
await page.screenshot({ path: "/tmp/null07-mobile-terminal.png" });
console.log({ errors, desktopFinalPuzzle: fit, mobileControls: true });
await browser.close();
if (errors.length) process.exit(1);
