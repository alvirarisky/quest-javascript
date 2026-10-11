import Phaser from "phaser";
import { rooms } from "./metadata.js";
const W = 1280,
  FLOOR = 618;
export class Facility extends Phaser.Scene {
  constructor(bridge) {
    super("Facility");
    this.bridge = bridge;
    this.room = -1;
    this.step = 0;
    this.touch = 0;
    this.blocked = true;
    this.ending = false;
  }
  preload() {
    const t = this.add
      .text(640, 340, "LOADING FACILITY  /  NULL-07", {
        font: "18px monospace",
        color: "#9bbcb4",
      })
      .setOrigin(0.5);
    this.loadingText = t;
    this.load.on("progress", (v) =>
      t.setText("LOADING FACILITY  /  " + Math.round(v * 100) + "%"),
    );
    this.load.image("facility", "/assets/facility.png");
    this.load.image("rooms", "/assets/rooms-atlas.png");
    this.load.spritesheet("operator", "/assets/operator.png", {
      frameWidth: 512,
      frameHeight: 512,
    });
  }
  create() {
    this.loadingText.destroy();
    const atlas = this.textures.get("rooms");
    [
      [400, 0],
      [410, 256],
      [490, 512],
      [200, 768],
      [20, 256],
      [1040, 512],
      [1040, 256],
    ].forEach(([x, y], i) => atlas.add("room" + i, 0, x, y, 455, 256));
    this.cameras.main.setBounds(0, 0, W * 8, 720);
    this.physics.world.setBounds(0, 0, W * 8, 720);
    this.gates = [];
    this.terminals = [];
    this.lights = [];
    this.monitors = [];
    this.cameraFeeds = [];
    this.backdrops = [];
    for (let i = 0; i < 8; i++) this.buildRoom(i);
    const floor = this.add.rectangle(W * 4, FLOOR + 30, W * 8, 60, 0x172326, 0);
    this.physics.add.existing(floor, true);
    this.player = this.physics.add
      .sprite(180, 540, "operator", 0)
      .setDepth(20)
      .setScale(0.34);
    this.player.body.setSize(100, 425).setOffset(205, 45);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, floor);
    this.gates.forEach((g) => this.physics.add.collider(this.player, g));
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(240, 100);
    this.keys = this.input.keyboard.addKeys("A,D,E,LEFT,RIGHT,ESC");
    this.input.keyboard.on("keydown-E", () => this.interact());
    this.input.keyboard.on("keydown-ESC", () => this.bridge.escape());
    this.prompt = this.add
      .text(0, 0, "", {
        font: "bold 15px monospace",
        color: "#c8eddf",
        backgroundColor: "#101c20",
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.watcher = this.add.container(0, 0).setDepth(12).setVisible(false);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x03090b, 0.96);
    shadow.fillEllipse(0, -100, 38, 50);
    shadow.fillTriangle(-18, -85, 18, -85, 40, 40);
    shadow.lineStyle(10, 0x03090b);
    shadow.lineBetween(-15, -75, -39, 15);
    shadow.lineBetween(15, -75, 48, 30);
    shadow.lineBetween(-8, 30, -14, 92);
    shadow.lineBetween(15, 30, 24, 92);
    const eyes = this.add.graphics();
    eyes.fillStyle(0xc3e3d6);
    eyes.fillRect(-9, -104, 4, 3);
    eyes.fillRect(4, -104, 4, 3);
    this.watcher.add([shadow, eyes]);
    this.time.addEvent({
      delay: 13000,
      loop: true,
      callback: () => {
        if (!this.blocked && !this.ending && !this.bridge.reduced())
          this.haunt();
      },
    });
    this.beam = this.add.graphics().setDepth(19);
    this.applyProgress();
    this.bridge.ready(this);
  }
  buildRoom(i) {
    const x = i * W;
    const tint = [
      0x9fb4b9, 0x7caaa0, 0x789ead, 0xa8998b, 0x82a7a8, 0xa7a290, 0x809dab,
      0x8db0a0,
    ][i];
    const frames = { 1: 0, 2: 4, 3: 1, 4: 2, 5: 3, 6: 5, 7: 6 };
    const backdrop =
      i in frames
        ? this.add.image(x + W / 2, 350, "rooms", "room" + frames[i])
        : this.add.image(x + W / 2, 360, "facility");
    backdrop.originalTint = tint;
    backdrop.setDisplaySize(W, 720).setTint(tint).setAlpha(0.8);
    this.backdrops.push(backdrop);
    const g = this.add.graphics();
    g.fillStyle(0x050e14, 0.25);
    g.fillRect(x, 0, W, 720);
    g.fillStyle(0x12202a, 0.9);
    g.fillRect(x + 110, 210, 280, 150);
    g.lineStyle(2, 0x314550);
    g.strokeRect(x + 110, 210, 280, 150);
    this.add.text(x + 74, 103, "SECTOR 0" + (i + 1) + "  /  " + rooms[i], {
      font: "17px monospace",
      color: "#7b979b",
    });
    this.add.text(
      x + 122,
      230,
      [
        "SHIFT LOG / 03:00\nAll personnel: evacuate.\nOperator access remains active.",
        "GENERATOR / CAPACITY LOW\nAuxiliary circuit disconnected.",
        "CCTV / SIGNAL LOST\nCamera 03: movement detected.",
        "ACCESS / DENIED\nManual override required.",
        "EXPERIMENT 07\nDo not approach observation glass.",
        "UNIT R-06 / OFFLINE\nMaintenance route sealed.",
        "SURVEILLANCE / CORRUPTED\nLast signal: EXIT-07",
        "EXIT ACCESS DENIED\nEight systems must be restored.",
      ][i],
      { font: "12px monospace", color: "#637f84", lineSpacing: 9 },
    );
    if (i === 2 || i === 6) {
      for (let j = 0; j < 6; j++) {
        g.fillStyle(0x061317);
        g.fillRect(
          x + 520 + (j % 3) * 115,
          180 + Math.floor(j / 3) * 105,
          103,
          85,
        );
        g.lineStyle(2, 0x426064);
        g.strokeRect(
          x + 520 + (j % 3) * 115,
          180 + Math.floor(j / 3) * 105,
          103,
          85,
        );
        const feed = this.add.text(
          x + 530 + (j % 3) * 115,
          190 + Math.floor(j / 3) * 105,
          "CAM 0" + (j + 1) + "\nNO SIGNAL",
          { font: "11px monospace", color: "#526e71" },
        );
        this.cameraFeeds.push({ feed, room: i, number: j + 1 });
      }
    }
    const lamp = this.add
      .rectangle(x + 850, 98, 210, 5, 0x89cac0)
      .setAlpha(0.12);
    this.lights.push(lamp);
    const terminal = this.add.container(x + 940, 480);
    const tg = this.add.graphics();
    tg.fillStyle(0x25333c);
    tg.fillRoundedRect(-45, -45, 90, 90, 5);
    tg.lineStyle(3, 0x65777b);
    tg.strokeRoundedRect(-45, -45, 90, 90, 5);
    tg.fillStyle(0x101e23);
    tg.fillRect(-35, -33, 70, 48);
    tg.fillStyle(0x44585c);
    tg.fillRect(-53, 40, 106, 15);
    tg.fillRect(-28, 55, 10, 76);
    tg.fillRect(20, 55, 10, 76);
    terminal.add(tg);
    const screen = this.add
      .text(x + 940, 465, "SYSTEM\nOFFLINE", {
        font: "11px monospace",
        color: "#b56354",
        align: "center",
      })
      .setOrigin(0.5);
    this.monitors.push(screen);
    this.terminals.push(terminal);
    const gate = this.add
      .rectangle(x + 1195, 460, 38, 310, 0x314149)
      .setStrokeStyle(2, 0x688182);
    this.physics.add.existing(gate, true);
    this.gates.push(gate);
    const doorArt = this.add.graphics().setDepth(3);
    doorArt.fillStyle(0x18282e);
    doorArt.fillRoundedRect(x + 1157, 306, 76, 310, 4);
    doorArt.lineStyle(2, 0x526b70);
    doorArt.strokeRoundedRect(x + 1157, 306, 76, 310, 4);
    for (let k = 0; k < 14; k++) {
      doorArt.lineStyle(1, 0x0b161d);
      doorArt.lineBetween(x + 1162, 323 + k * 19, x + 1228, 323 + k * 19);
    }
    doorArt.fillStyle(0xb27752);
    doorArt.fillRect(x + 1164, 557, 63, 7);
    doorArt.fillStyle(0xc39d69);
    for (let k = 0; k < 5; k++)
      doorArt.fillTriangle(
        x + 1164 + k * 13,
        557,
        x + 1173 + k * 13,
        557,
        x + 1164 + k * 13,
        564,
      );
    doorArt.fillStyle(0xbb7663);
    doorArt.fillCircle(x + 1218, 455, 3);
    gate.doorArt = doorArt;
    this.add.text(x + 1160, 280, i === 7 ? "EXIT" : "0" + (i + 2), {
      font: "22px monospace",
      color: "#adbeac",
    });
    g.lineStyle(4, 0x263c46);
    for (let j = 0; j < 5; j++)
      g.lineBetween(x + 50 + j * 250, 15, x + 55 + j * 250, 90 + (j % 2) * 65);
    g.lineStyle(2, 0x87907b, 0.3);
    for (let j = 0; j < 14; j++)
      g.lineBetween(x + j * 96, FLOOR, x + j * 96 - 100, 720);
  }
  applyProgress() {
    const p = this.bridge.progress();
    this.backdrops.forEach((b) =>
      b.setTint(p === 8 ? 0xb6ceba : b.originalTint),
    );
    this.gates.forEach((g, i) => {
      g.body.enable = i >= p;
      g.setVisible(false);
      g.doorArt.setVisible(i >= p);
      this.lights[i].setAlpha(i < p ? 0.9 : 0.12);
      this.monitors[i]
        .setText(i < p ? "SYSTEM\nONLINE" : "SYSTEM\nOFFLINE")
        .setColor(i < p ? "#a2dec5" : "#b56354");
    });
    this.cameraFeeds.forEach(({ feed, room, number }) =>
      feed
        .setText(
          "CAM 0" + number + "\n" + (room < p ? "LIVE / ONLINE" : "NO SIGNAL"),
        )
        .setColor(room < p ? "#97baae" : "#526e71"),
    );
    if (p === 8) {
      this.watcher?.setVisible(false);
      this.backdrops.forEach((b) => b.setTint(0xb6ceba));
    }
  }
  restore(x) {
    this.player.setPosition(
      Math.max(
        110,
        Math.min(
          Number(x) || 180,
          Math.min(this.bridge.progress(), 7) * W + 1100,
        ),
      ),
      530,
    );
    this.player.setVelocity(0);
  }
  haunt() {
    if (this.bridge.progress() === 8) return;
    const i = Math.floor(this.player.x / W);
    this.watcher.setPosition(i * W + 680, 455).setVisible(true);
    this.player.setFrame(4);
    this.time.delayedCall(1700, () => this.watcher.setVisible(false));
    this.bridge.sound("haunt");
  }
  interact() {
    if (this.blocked || this.ending) return;
    const i = Math.floor(this.player.x / W);
    if (Math.abs(this.player.x - this.terminals[i].x) < 115) {
      this.player.setFrame(3);
      this.bridge.terminal(i);
    } else if (
      i === 7 &&
      this.bridge.progress() === 8 &&
      this.player.x > 1080 + W * 7
    ) {
      this.escapeEnding();
    }
  }
  escapeEnding() {
    this.ending = true;
    this.watcher.setVisible(false);
    this.prompt.setText("06:00 AM  /  SHIFT COMPLETED");
    this.player.setVelocityX(90);
    this.bridge.sound("unlock");
    this.time.delayedCall(2600, () => {
      this.player.setVelocity(0);
      this.bridge.finish();
    });
  }
  update(time, delta) {
    if (!this.player) return;
    this.beam.clear();
    if (!this.blocked) {
      const direction = this.player.flipX ? -1 : 1;
      for (let b = 0; b < 4; b++) {
        this.beam.fillStyle(0xa7c8b5, 0.015);
        this.beam.fillTriangle(
          this.player.x + direction * 30,
          this.player.y + 10,
          this.player.x + direction * (190 + b * 18),
          this.player.y - 55 - b * 6,
          this.player.x + direction * (190 + b * 18),
          this.player.y + 70 + b * 6,
        );
      }
    }
    const i = Math.min(7, Math.floor(this.player.x / W));
    if (i !== this.room) {
      this.room = i;
      this.bridge.room(i);
    }
    if (this.blocked) {
      this.player.setVelocityX(0);
      this.prompt.setVisible(false);
      return;
    }
    if (this.ending) {
      this.player.setFrame(5);
      return;
    }
    const dir =
      this.touch ||
      (this.keys.A.isDown || this.keys.LEFT.isDown
        ? -1
        : this.keys.D.isDown || this.keys.RIGHT.isDown
          ? 1
          : 0);
    this.player.setVelocityX(dir * 235);
    if (dir) {
      this.player.setFlipX(dir < 0);
      this.step += delta;
      this.player.setFrame((Math.floor(time / 170) % 2) + 1);
      if (this.step > 390) {
        this.bridge.sound("step");
        this.step = 0;
      }
    } else this.player.setFrame(0);
    const near = Math.abs(this.player.x - this.terminals[i].x) < 115;
    const exit =
      i === 7 && this.bridge.progress() === 8 && this.player.x > W * 7 + 1080;
    this.prompt
      .setVisible(near || exit)
      .setPosition(this.player.x, 410)
      .setText(
        exit
          ? "[ E ]  LEAVE NULL-07"
          : i < this.bridge.progress()
            ? "[ E ]  SYSTEM RESTORED"
            : "[ E ]  ACCESS TERMINAL",
      );
    this.bridge.position(this.player.x);
  }
}
