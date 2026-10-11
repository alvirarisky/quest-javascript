import { chromium } from "@playwright/test";
import { sectors } from "../src/game/layout.js";
import { tasks } from "../src/game/missions.js";
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
await page.goto(process.env.BASE_URL || "http://127.0.0.1:5173");
await page.screenshot({ path: "/tmp/null07-landing.png" });
await page.click("#start");
await page.waitForSelector("#brief-next");
await page.click("#brief-next");
await page.screenshot({ path: "/tmp/null07-identity.png" });
await page.fill("[name=name]", "Alvira Test");
await page.fill("[name=nim]", "123456");
await page.fill("[name=kelas]", "TI-2A");
await page.click("button[type=submit]");
await page.fill(
  "#essay",
  "Menurut saya JavaScript membuat tombol merespons klik, misalnya mengubah warna halaman sesuai pilihan pengguna.",
);
await page.click("#reflection button[type=submit]");
await page.waitForSelector("#intro-next");
await page.screenshot({ path: "/tmp/null07-opening.png" });
await page.click("#intro-next");
await page.click("#intro-next");
await page.waitForTimeout(5000);
await page.screenshot({ path: "/tmp/null07-debug.png" });
await page.waitForSelector(".hud");
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/null07-room.png" });
async function walkTo(target, sprint = false) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.keyboard.press("Escape");
    await page.waitForSelector("#resume");
    const x = await page.evaluate(
      () => JSON.parse(localStorage.getItem("null07-run")).x,
    );
    await page.click("#resume");
    if (Math.abs(target - x) < 28) return;
    const key = target > x ? "d" : "a";
    if (sprint) await page.keyboard.down("Shift");
    await page.keyboard.down(key);
    await page.waitForTimeout(
      Math.max(50, (Math.abs(target - x) / (sprint ? 340 : 235)) * 1000),
    );
    await page.keyboard.up(key);
    if (sprint) await page.keyboard.up("Shift");
    await page.waitForTimeout(120);
  }
  throw new Error("Could not walk to " + target);
}
async function environmentTasks(room, phase) {
  for (const task of tasks.filter(
    (t) => t.room === room && t.phase === phase,
  )) {
    if (task.kind === "camera") {
      await walkTo(sectors[2].start + 355);
      await page.keyboard.press("e");
      await page.waitForTimeout(600);
    }
    const target = sectors[room].start + task.x;
    await walkTo(target);
    if (task.kind === "hold") {
      await page.keyboard.down("e");
      await page.waitForTimeout(1600);
      await page.keyboard.up("e");
    } else if (task.kind === "dial") {
      await page.keyboard.press("e");
      await page.keyboard.press("e");
    } else {
      await page.keyboard.press("e");
      if (task.kind === "robot") await page.waitForTimeout(2600);
    }
    await page.keyboard.press("Escape");
    await page.waitForSelector("#resume");
    const state = await page.evaluate(
      () => JSON.parse(localStorage.getItem("null07-run")).world,
    );
    if (!state.done.includes(task.id))
      throw new Error("Task did not complete: " + task.id);
    await page.click("#resume");
    if (task.id === "release") {
      await page.waitForFunction(
        () =>
          document
            .querySelector("#objective")
            ?.textContent.includes("CELAH TERBUKA"),
        { timeout: 8000 },
      );
      await page.keyboard.down("d");
      await page.waitForTimeout(850);
      await page.keyboard.up("d");
    }
  }
}
await environmentTasks(0, "before");
await walkTo(sectors[0].terminal + sectors[0].start);
await page.keyboard.press("e");
await page.waitForSelector(".terminal");
await page.screenshot({ path: "/tmp/null07-terminal.png" });
await page.click("#hint");
await page.locator(".option").first().click();
await page.click("button[type=submit]");
await page.waitForSelector("#continue");
if (
  (await page.locator(".feedback h2").textContent()).startsWith("Sistem pulih.")
)
  correct++;
await page.click("#continue");
await page.reload();
await page.click("#start");
await page.waitForSelector(".hud");
await page.keyboard.press("Escape");
await page.waitForSelector("#resume");
await page.click("#resume");
for (let i = 1; i < 8; i++) {
  if (i === 6) await page.keyboard.press("f");
  await environmentTasks(i, "before");
  if (i === 6) {
    await walkTo(sectors[6].start + 590);
    await page.keyboard.down("Space");
    await page.waitForTimeout(8000);
    await page.keyboard.up("Space");
    await walkTo(sectors[6].start + 890);
    await page.keyboard.down("Space");
    await page.waitForTimeout(4000);
    await page.keyboard.up("Space");
  }
  await walkTo(sectors[i].start + sectors[i].terminal);
  await page.keyboard.press("e");
  await page.waitForSelector(".terminal", { timeout: 3000 });
  await page.locator(".option").first().click();
  await page.click("button[type=submit]");
  await page.waitForSelector("#continue");
  if (
    (await page.locator(".feedback h2").textContent()).startsWith(
      "Sistem pulih.",
    )
  )
    correct++;
  await page.click("#continue");
  await environmentTasks(i, "after");
  await page.waitForTimeout(i === 7 ? 50 : 1000);
  if ([1, 2, 4, 7].includes(i))
    await page.screenshot({ path: `/tmp/null07-room${i + 1}.png` });
}
await walkTo(sectors[7].start + sectors[7].gate - 85, true);
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
if (
  !(await page.locator(".answer-count").innerText()).startsWith(
    correct + " / 8",
  )
)
  throw new Error("UI score mismatch");
console.log({
  errors,
  correct,
  result: await page.locator(".result").innerText(),
});
await page.click("#again");
await page.click("#brief-next");
await page.waitForSelector("#identity");
await browser.close();
if (errors.length) process.exit(1);
