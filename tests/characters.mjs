import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
async function instrument() {
  await page.evaluate(async () => {
    const source = await fetch("/src/main.js").then((r) => r.text());
    const url = source.match(/import\(["']([^"']*game\/world\.js[^"']*)["']\)/)[1];
    const { Facility } = await import(url);
    const create = Facility.prototype.create;
    Facility.prototype.create = function () {
      create.call(this);
      window.__qaScene = this;
    };
  });
}
async function start(character) {
  await page.waitForSelector("#brief-next");
  await page.click("#brief-next");
  await page.fill("[name=name]", "Character QA");
  await page.fill("[name=nim]", "123");
  await page.fill("[name=kelas]", "TI-A");
  await page.check(`[name=character][value=${character}]`);
  assert.equal(await page.locator(".character-card img").count(), 0);
  assert.ok(
    await page
      .locator(".character-portrait")
      .first()
      .evaluate((el) =>
        getComputedStyle(el, "::before").backgroundImage.includes(
          "female-sprite.png",
        ),
      ),
  );
  await page.screenshot({ path: `/tmp/null07-select-${character}.png` });
  await page.click("#identity button[type=submit]");
  await page.fill(
    "#essay",
    "JavaScript merespons tindakan pengguna dan memperbarui tampilan halaman.",
  );
  await page.click("#reflection button[type=submit]");
  await page.waitForSelector("#intro-skip");
  await page.click("#intro-skip");
  await page.waitForSelector(".hud");
  await page.waitForFunction(() =>
    window.__qaScene?.player?.texture?.key.startsWith("operator-"),
  );
  assert.equal(
    await page.evaluate(() => window.__qaScene.player.texture.key),
    `operator-${character}`,
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("null07-run")).character,
    ),
    character,
  );
}
try {
  await page.goto(base);
  await instrument();
  await page.click("#start");
  await start("female");
  const x = await page.evaluate(() => window.__qaScene.player.x);
  await page.keyboard.down("d");
  await page.waitForTimeout(700);
  assert.ok(
    await page.evaluate(() =>
      [1, 2].includes(Number(window.__qaScene.player.frame.name)),
    ),
  );
  await page.keyboard.up("d");
  assert.ok((await page.evaluate(() => window.__qaScene.player.x)) > x + 70);
  await page.screenshot({ path: "/tmp/null07-female-gameplay.png" });
  for (const character of ["female", "male"]) {
    const alpha = await page.evaluate(async (character) => {
      const img = new Image();
      img.src = `/assets/characters/${character}-sprite.png`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const c = canvas.getContext("2d");
      c.drawImage(img, 0, 0);
      return {
        width: img.width,
        height: img.height,
        corner: c.getImageData(0, 0, 1, 1).data[3],
        frames: window.__qaScene.textures
          .get(`operator-${character}`)
          .getFrameNames().length,
      };
    }, character);
    assert.equal(alpha.width, 1536);
    assert.equal(alpha.height, 1024);
    assert.equal(alpha.frames, 6);
    assert.ok(alpha.corner <= 2, "Sprite background is opaque");
  }
  await page.reload();
  await instrument();
  await page.click("#start");
  await page.waitForSelector(".hud");
  assert.equal(
    await page.evaluate(() => window.__qaScene.player.texture.key),
    "operator-female",
  );
  await page.keyboard.press("Escape");
  await page.click("#restart");
  await start("male");
  await page.screenshot({ path: "/tmp/null07-male-gameplay.png" });
  await page.keyboard.press("Escape");
  await page.waitForSelector("#resume");
  await page.evaluate(() => {
    const run = JSON.parse(localStorage.getItem("null07-run"));
    delete run.character;
    localStorage.setItem("null07-run", JSON.stringify(run));
  });
  // Close without unloading an active run: a fresh context avoids beforeunload re-saving the original character.
  const legacy = await page.evaluate(() => localStorage.getItem("null07-run"));
  await page.close();
  const legacyPage = await browser.newPage();
  await legacyPage.goto(base);
  await legacyPage.evaluate(
    (v) => localStorage.setItem("null07-run", v),
    legacy,
  );
  await legacyPage.reload();
  await legacyPage.evaluate(async () => {
    const source = await fetch("/src/main.js").then((r) => r.text());
    const url = source.match(/import\(["']([^"']*game\/world\.js[^"']*)["']\)/)[1];
    const { Facility } = await import(url);
    const create = Facility.prototype.create;
    Facility.prototype.create = function () {
      create.call(this);
      window.__qaScene = this;
    };
  });
  await legacyPage.click("#start");
  await legacyPage.waitForSelector(".hud");
  assert.equal(
    await legacyPage.evaluate(() => window.__qaScene.player.texture.key),
    "operator-male",
  );
  assert.deepEqual(errors, []);
  console.log({
    selection: true,
    bothSprites: true,
    transparentSixFrameSheets: true,
    walking: true,
    resume: true,
    sameSceneSwitch: true,
    legacyFallback: true,
    errors,
  });
} finally {
  await browser.close();
}
