import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
let correct = 0;
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log("PAGE ERROR", e.message);
});
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});
await page.goto("http://127.0.0.1:5173");
await page.screenshot({ path: "/tmp/null07-landing.png" });
await page.click("#start");
await page.screenshot({ path: "/tmp/null07-identity.png" });
await page.fill("[name=name]", "Alvira Test");
await page.fill("[name=nim]", "123456");
await page.fill("[name=kelas]", "TI-2A");
await page.click("button[type=submit]");
await page.waitForTimeout(5000);
await page.screenshot({ path: "/tmp/null07-debug.png" });
await page.waitForSelector(".hud");
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/null07-room.png" });
await page.keyboard.down("d");
await page.waitForTimeout(3100);
await page.keyboard.up("d");
await page.keyboard.press("e");
await page.waitForSelector(".terminal");
await page.screenshot({ path: "/tmp/null07-terminal.png" });
await page.click("#hint");
await page.locator(".option").first().click();
await page.click("button[type=submit]");
await page.waitForSelector("#continue");
if ((await page.locator(".feedback h2").innerText()).startsWith("Correct."))
  correct++;
await page.click("#continue");
await page.reload();
await page.click("#start");
await page.waitForSelector(".hud");
await page.keyboard.press("Escape");
await page.waitForSelector("#resume");
await page.click("#resume");
for (let i = 1; i < 8; i++) {
  // Drive through actual keyboard movement to the next terminal. Previous session x is near terminal 1.
  await page.keyboard.down("d");
  await page.waitForTimeout(5450);
  await page.keyboard.up("d");
  await page.keyboard.press("e");
  await page.waitForSelector(".terminal", { timeout: 3000 });
  await page.locator(".option").first().click();
  await page.click("button[type=submit]");
  await page.waitForSelector("#continue");
  if ((await page.locator(".feedback h2").innerText()).startsWith("Correct."))
    correct++;
  await page.click("#continue");
  if ([1, 2, 4, 7].includes(i))
    await page.screenshot({ path: `/tmp/null07-room${i + 1}.png` });
}
await page.keyboard.down("d");
await page.waitForTimeout(1000);
await page.keyboard.up("d");
await page.keyboard.press("e");
await page.waitForSelector(".result", { timeout: 10000 });
await page.screenshot({ path: "/tmp/null07-result.png" });
for (const [width, height] of [
  [1366, 768],
  [1440, 900],
  [1536, 960],
]) {
  await page.setViewportSize({ width, height });
  const box = await page.locator(".result").boundingBox();
  if (box.y < 0 || box.y + box.height > height)
    throw new Error("Result clips at " + width);
  await page.screenshot({ path: `/tmp/null07-result-${width}.png` });
}
if (!(await page.locator(".score p").innerText()).startsWith(correct + " / 8"))
  throw new Error("UI score mismatch");
console.log({
  errors,
  correct,
  result: await page.locator(".result").innerText(),
});
await page.click("#again");
await page.waitForSelector("#identity");
await browser.close();
if (errors.length) process.exit(1);
