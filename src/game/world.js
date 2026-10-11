import Phaser from "phaser";
import { rooms } from "./metadata.js";
import { sectors, worldWidth, sectorAt } from "./layout.js";
import { illustrations } from "./assets/illustrations.js";
import { props } from "./assets/props.js";
import {
  tasks,
  nextTask,
  terminalReady,
  passageReady,
  completeTask,
  channels,
} from "./missions.js";
import {
  refugeOffsets,
  scannerActive,
  patrolState,
  stepPatrol,
} from "./tension.js";
const FLOOR = 618;
export class Facility extends Phaser.Scene {
  constructor(bridge) {
    super("Facility");
    Object.assign(this, {
      bridge,
      room: -1,
      step: 0,
      touch: 0,
      blocked: true,
      ending: false,
    });
    this.seen = new Set();
    this.applied = 0;
  }
  preload() {
    this.load.image("scare-closeup", "/assets/watcher-scare-v2.png");
    this.load.image("facility", "/assets/facility.png");
    this.load.image("rooms", "/assets/rooms-atlas.png");
    for (const character of ["female", "male"]) {
      this.load.spritesheet(
        `operator-${character}`,
        `/assets/characters/${character}-sprite.png`,
        {
          frameWidth: 512,
          frameHeight: 512,
        },
      );
    }
    Object.entries({ ...illustrations, ...props }).forEach(([key, svg]) =>
      this.load.svg(key, "data:image/svg+xml;base64," + btoa(svg)),
    );
    this.load.on("progress", (n) => this.bridge.loading?.(n));
  }
  create() {
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
    this.cameras.main.setBounds(0, 0, worldWidth, 720);
    this.physics.world.setBounds(0, 0, worldWidth, 720);
    this.gates = [];
    this.terminals = [];
    this.lights = [];
    this.backdrops = [];
    this.decor = [];
    this.feeds = [];
    this.recoveryFx = [];
    this.nextAmbientAt = 0;
    this.taskState = this.bridge.worldState();
    this.taskObjects = new Map();
    this.holding = null;
    this.robotMoving = false;
    sectors.forEach((s, i) => this.buildRoom(s, i));
    this.buildTasks();
    const floor = this.add.rectangle(
      worldWidth / 2,
      FLOOR + 35,
      worldWidth,
      70,
      0,
      0,
    );
    this.physics.add.existing(floor, true);
    this.player = this.physics.add
      .sprite(
        170,
        530,
        `operator-${this.bridge.character?.() === "female" ? "female" : "male"}`,
        0,
      )
      .setDepth(20)
      .setScale(0.41);
    this.player.body.setSize(95, 425).setOffset(207, 45);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, floor);
    this.gates.forEach((g) =>
      this.physics.add.collider(this.player, g.collider),
    );
    this.cameras.main.startFollow(this.player, true, 0.075, 0.075);
    this.cameras.main.setDeadzone(160, 100);
    this.keys = this.input.keyboard.addKeys(
      "A,D,E,F,SHIFT,SPACE,LEFT,RIGHT,ESC",
    );
    this.input.keyboard.on("keydown-E", () => this.interact());
    this.input.keyboard.on("keydown-F", () => this.toggleLight());
    this.input.keyboard.on("keydown-ESC", () => this.bridge.escape());
    this.prompt = this.add
      .text(0, 0, "", {
        font: "13px monospace",
        color: "#d2ded1",
        backgroundColor: "#0a151ccc",
        padding: { x: 9, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.watcher = this.add
      .image(0, 0, "watcher")
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setAlpha(0.7)
      .setVisible(false);
    this.beam = this.add.graphics().setDepth(19);
    this.holdBar = this.add.graphics().setDepth(35);
    this.scareVeil = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(99)
      .setVisible(false);
    this.jumpImage = this.add
      .image(640, 360, "scare-closeup")
      .setDisplaySize(1280, 854)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);
    this.scareTimers = [];
    this.createTension();
    this.applied = this.bridge.progress();
    this.applyProgress(false);
    this.bridge.ready(this);
  }
  selectCharacter() {
    const character =
      this.bridge.character?.() === "female" ? "female" : "male";
    this.player.setTexture(`operator-${character}`, 0);
    this.player.body.setSize(95, 425).setOffset(207, 45);
  }
  createTension() {
    this.refuges = refugeOffsets.map((offset) =>
      this.add
        .image(sectors[6].start + offset, FLOOR, "locker")
        .setOrigin(0.5, 1)
        .setScale(0.82)
        .setDepth(16),
    );
    this.hunter = this.add
      .image(0, FLOOR, "watcher")
      .setOrigin(0.5, 1)
      .setDisplaySize(90, 315)
      .setDepth(21)
      .setVisible(false);
    this.scanner = this.add.graphics().setDepth(25);
    this.darkness = this.add
      .rectangle(640, 360, 1280, 720, 0x02070c, 0)
      .setScrollFactor(0)
      .setDepth(18);
    this.threatVeil = this.add
      .rectangle(640, 360, 1280, 720, 0x300808, 0)
      .setScrollFactor(0)
      .setDepth(30);
    this.resetTension();
  }
  resetTension() {
    this.patrol = patrolState();
    this.escapePressure = this.taskState.done.includes("exit")
      ? { x: sectors[7].start + 850, delay: 1.5 }
      : null;
    this.scanElapsed = 0;
    this.recovering = 0;
    this.stamina = 1;
    this.exhausted = false;
    this.encounterElapsed = 0;
    this.threatBeat = 0;
    this.lightOn = true;
    this.hidden = false;
    this.touchHide = false;
    this.touchRun = false;
    this.tensionHint = "";
    this.retreatMessage = "";
    this.lastThreatMode = "";
    this.hunter?.setVisible(false);
    this.scanner?.clear();
    this.threatVeil?.setAlpha(0);
    this.player?.setVisible(true);
    this.darkness?.setAlpha(0);
  }
  toggleLight() {
    if (!this.blocked && !this.ending) this.lightOn = !this.lightOn;
  }
  retreat(reason) {
    const room = this.room;
    this.player
      .setPosition(
        sectors[room].start + (room === 3 ? 1090 : room === 7 ? 1080 : 145),
        510,
      )
      .setVelocity(0);
    this.patrol = patrolState();
    this.recovering = 1.5;
    if (room === 7)
      this.escapePressure = { x: sectors[7].start + 850, delay: 2.5 };
    this.holding = null;
    this.holdBar.clear();
    this.taskState.retreats = (this.taskState.retreats || 0) + 1;
    this.checkpoint();
    this.bridge.position(this.player.x);
    this.retreatMessage =
      reason + " Kamu mundur ke tempat aman. Progress tetap tersimpan.";
    this.bridge.notice(this.retreatMessage);
    this.bridge.sound("haunt");
    if (this.bridge.scary()) {
      this.playScare("capture");
    }
  }
  updateTension(delta, dir) {
    const dt = Math.min(delta / 1000, 0.05);
    this.recovering = Math.max(0, this.recovering - dt);
    this.scanElapsed += dt;
    this.tensionHint = "";
    this.scanner.clear();
    const scannerEnabled =
      this.room === 3 &&
      this.bridge.progress() > 3 &&
      this.taskState.done.includes("release");
    if (scannerEnabled) {
      const x = sectors[3].start + 1184;
      const active = scannerActive(this.scanElapsed);
      this.scanner
        .fillStyle(active ? 0xc66650 : 0x7da88b, 0.65)
        .fillRect(x - 3, 202, 6, FLOOR - 202);
      this.scanner
        .fillStyle(active ? 0xc66650 : 0x7da88b, 0.08)
        .fillRect(x - 28, 202, 56, FLOOR - 202);
      if (this.player.x > sectors[3].start + 1030)
        this.tensionHint = active
          ? "PEMINDAI AKTIF · tunggu lampu hijau."
          : "CELAH TERBUKA · lewat sekarang.";
      if (active && Math.abs(this.player.x - x) < 29 && !this.recovering)
        this.retreat("Pemindai mendeteksi gerakan.");
    }
    const patrolEnabled = this.room === 6;
    const localX = this.player.x - sectors[6].start;
    const cover = this.refuges.find((r) => Math.abs(r.x - this.player.x) < 58);
    const crouching = this.keys.SPACE.isDown || this.touchHide;
    this.hidden = patrolEnabled && Boolean(cover) && crouching;
    this.player.setVisible(!this.hidden);
    this.darkness.setAlpha(this.lightOn ? 0 : 0.16);
    if (this.stamina <= 0.08) this.exhausted = true;
    if (this.stamina >= 0.35) this.exhausted = false;
    const running = Boolean(
      dir &&
      !crouching &&
      (this.keys.SHIFT.isDown || this.touchRun) &&
      !this.exhausted &&
      !this.holding &&
      !this.recovering,
    );
    this.stamina = Phaser.Math.Clamp(
      this.stamina + dt * (running ? -0.3 : 0.19),
      0,
      1,
    );
    if (patrolEnabled && !this.recovering) {
      this.encounterElapsed += dt;
      this.threatBeat += dt;
      const caught = stepPatrol(
        this.patrol,
        {
          x: localX,
          light: this.lightOn,
          running,
          crouching,
          hidden: this.hidden,
        },
        delta,
      );
      this.hunter
        .setVisible(true)
        .setPosition(sectors[6].start + this.patrol.x, FLOOR)
        .setFlipX(this.patrol.direction > 0);
      const mode = this.hidden
        ? "hidden"
        : this.patrol.mode === "chase"
          ? "chase"
          : this.patrol.mode === "search"
            ? "search"
            : this.patrol.suspicion > 0.1
              ? "alert"
              : "patrol";
      this.tensionHint = {
        hidden: "SEMBUNYI · tahan SPACE sampai langkahnya menjauh.",
        chase: "DIA MELIHATMU · matikan senter, cari loker!",
        search: "DIA MENCARI · jangan keluar dulu.",
        alert: "DIA MENDENGAR SESUATU · jangan lari.",
        patrol:
          this.encounterElapsed < 8
            ? "F · senter    SPACE · merunduk / sembunyi di loker    SHIFT · lari"
            : "",
      }[mode];
      if (
        mode !== this.lastThreatMode &&
        ["alert", "chase", "search"].includes(mode)
      )
        this.bridge.sound("haunt");
      this.lastThreatMode = mode;
      if (
        this.threatBeat > (mode === "chase" ? 0.85 : 1.5) &&
        Math.abs(this.patrol.x - localX) < 430
      ) {
        this.threatBeat = 0;
        this.bridge.sound(mode === "chase" ? "haunt" : "step");
      }
      if (caught) this.retreat("Watcher menemukanmu.");
    } else if (this.room === 7 && this.escapePressure && !this.recovering) {
      this.escapePressure.delay = Math.max(0, this.escapePressure.delay - dt);
      if (!this.escapePressure.delay) this.escapePressure.x += 320 * dt;
      this.hunter
        .setVisible(true)
        .setPosition(this.escapePressure.x, FLOOR)
        .setFlipX(true);
      this.tensionHint = "EXIT TERBUKA · tahan SHIFT / LARI, menuju pintu!";
      if (this.player.x - this.escapePressure.x < 48)
        this.retreat("Watcher menyusul di koridor EXIT.");
    } else this.hunter.setVisible(false);
    this.threatVeil.setAlpha(patrolEnabled ? this.patrol.suspicion * 0.13 : 0);
    if (this.recovering) this.tensionHint = this.retreatMessage;
    this.bridge.tension?.({
      mode: this.recovering
        ? "retreat"
        : patrolEnabled
          ? this.lastThreatMode
          : this.room === 7 && this.escapePressure
            ? "escape"
            : scannerEnabled
              ? "scanner"
              : "safe",
      stamina: this.stamina,
      light: this.lightOn,
    });
    return this.recovering || this.hidden
      ? 0
      : running
        ? 340
        : crouching
          ? 105
          : 235;
  }
  buildRoom(s, i) {
    const x = s.start,
      w = s.width;
    const bg =
      s.frame === null
        ? this.add.image(x + w / 2, 350, "facility")
        : this.add.image(x + w / 2, 350, "rooms", "room" + s.frame);
    bg.setDisplaySize(w, 720).setAlpha(0.83);
    this.backdrops.push(bg);
    const shade = this.add.graphics();
    shade.fillStyle(0x030b10, 0.18);
    shade.fillRect(x, 0, w, 720);
    shade.fillStyle(0x051016, 0.6);
    shade.fillRect(x + w - 26, 0, 26, FLOOR);
    shade.fillRect(x, 0, 18, FLOOR);
    // Physical room plates replace duplicate screen headings and wall logs.
    const plate = this.add.text(
      x + 85,
      160,
      String(i + 1).padStart(2, "0") + " / " + rooms[i],
      { font: "13px monospace", color: "#9aafa7" },
    );
    plate.setAlpha(0.65);
    const terminal = this.add
      .image(x + s.terminal, FLOOR, "terminal")
      .setOrigin(0.5, 1)
      .setDepth(13)
      .setScale(0.8);
    const led = this.add
      .circle(terminal.x + 31, FLOOR - 117, 2, 0xbc7765)
      .setDepth(14);
    this.terminals.push({ x: terminal.x, image: terminal, led });
    const door = this.add
      .image(x + s.gate, FLOOR, "door")
      .setOrigin(0.5, 1)
      .setDepth(14)
      .setDisplaySize(112, 310);
    const collider = this.add.rectangle(x + s.gate, FLOOR - 151, 40, 302, 0, 0);
    this.physics.add.existing(collider, true);
    this.gates.push({ image: door, collider });
    const glow = this.add
      .rectangle(x + s.terminal, 390, 165, 5, 0xa3bca6)
      .setAlpha(0.08);
    this.lights.push(glow);
    if (i === 1) {
      const rotor = this.add.graphics().setPosition(x + 530, 325);
      rotor.lineStyle(3, 0x668779, 0.35);
      rotor.strokeCircle(0, 0, 57);
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4;
        rotor.lineBetween(
          Math.cos(a) * 20,
          Math.sin(a) * 20,
          Math.cos(a) * 55,
          Math.sin(a) * 55,
        );
      }
      this.rotor = rotor;
    }
    if (i === 2 || i === 6) {
      for (let j = 0; j < (i === 2 ? 3 : 2); j++) {
        const mx = x + 180 + j * 125,
          my = 245;
        const crt = this.add.graphics();
        crt.fillStyle(0x16252a);
        crt.fillRoundedRect(mx - 5, my - 5, 110, 79, 3);
        crt.lineStyle(2, 0x4b5d5c);
        crt.strokeRoundedRect(mx - 5, my - 5, 110, 79, 3);
        const screen = this.add
          .image(mx + 50, my + 31, "facility")
          .setDisplaySize(95, 60)
          .setTint(0x5e978d)
          .setAlpha(0.08);
        const noise = this.add.graphics();
        noise.lineStyle(1, 0xa3b6a7, 0.12);
        for (let y = 0; y < 60; y += 4)
          noise.lineBetween(mx + 3, my + y, mx + 96, my + y);
        this.feeds.push({ screen, noise, room: i, index: j, x: screen.x });
        if (i === 2)
          this.add
            .text(screen.x, 335, ["CONTROL", "UNKNOWN", "EXIT"][j], {
              font: "10px monospace",
              color: "#78968c",
            })
            .setOrigin(0.5);
      }
    }
    if (i === 4) {
      this.labLight = this.add.ellipse(x + 520, 320, 170, 260, 0x85bcb0, 0.025);
    }
    if (i === 5) {
      this.robot = this.add
        .image(x + 400, FLOOR, "robot")
        .setOrigin(0.5, 1)
        .setDepth(15)
        .setScale(0.83)
        .setTint(0x5e6b6d);
    }
    if (i === 7) {
      this.exitGlow = this.add
        .rectangle(x + s.gate, 430, 114, 376, 0xcbd2b2, 0.02)
        .setDepth(5);
    }
    this.buildRecoveryFX(s, i);
  }
  buildRecoveryFX(s, room) {
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x90c2b1, 0.6);
    graphics.fillStyle(0x90c2b1, 0.25);
    const x = s.start;
    // Each restored system leaves a distinct, persistent visual trace.
    if (room === 0) {
      for (let i = 0; i < 5; i++)
        graphics.fillRect(
          x + s.terminal - 25 + i * 11,
          FLOOR - 110 - i * 3,
          6,
          15 + i * 3,
        );
    } else if (room === 1) {
      graphics.strokeCircle(x + 530, 325, 65);
      graphics.fillCircle(x + 530, 325, 10);
    } else if (room === 2) {
      for (let i = 0; i < 3; i++)
        graphics.fillCircle(x + 230 + i * 125, 235, 4);
    } else if (room === 3) {
      for (let i = 0; i < 5; i++) {
        const ax = x + 850 + i * 45;
        graphics.lineBetween(ax, FLOOR - 14, ax + 18, FLOOR - 14);
        graphics.lineBetween(ax + 12, FLOOR - 20, ax + 18, FLOOR - 14);
      }
    } else if (room === 4) {
      for (let i = 0; i < 7; i++)
        graphics.strokeCircle(
          x + 460 + i * 19,
          390 - (i % 3) * 30,
          4 + (i % 3),
        );
    } else if (room === 5) {
      graphics.fillTriangle(x + 500, 270, x + 410, FLOOR, x + 630, FLOOR);
    } else if (room === 6) {
      graphics.strokeCircle(x + 950, 285, 32);
      graphics.strokeCircle(x + 950, 285, 55);
      graphics.lineBetween(x + 895, 285, x + 1005, 285);
    } else {
      graphics.fillTriangle(
        x + s.gate,
        300,
        x + s.gate - 190,
        FLOOR,
        x + s.gate + 30,
        FLOOR,
      );
    }
    const label = this.add.text(x + s.terminal - 35, FLOOR - 155, "ONLINE", {
      font: "10px monospace",
      color: "#b9d6c5",
    });
    this.recoveryFx.push(
      this.add.container(0, 0, [graphics, label]).setDepth(12).setAlpha(0),
    );
  }
  reactToRecovery(room) {
    const fx = this.recoveryFx[room];
    if (fx && !this.bridge.reduced())
      this.tweens.add({
        targets: fx,
        alpha: 0.7,
        duration: 900,
        yoyo: true,
        ease: "Sine.InOut",
      });
    const sound = [
      "scan",
      "machine",
      "radio",
      "door",
      "steam",
      "robot",
      "radio",
      "door",
    ][room];
    this.bridge.sound(sound);
    this.bridge.recovered?.(room);
  }
  setEndingStyle(ending) {
    this.backdrops.forEach((bg) => bg.setTint(ending.tint));
    this.exitGlow
      .setFillStyle(
        ending.tier >= 2 ? 0xb9d6c5 : ending.tier === 1 ? 0xdca766 : 0xc17c72,
      )
      .setAlpha(0.35);
  }
  ambientBeat(time) {
    if (!this.nextAmbientAt) this.nextAmbientAt = time + 9500;
    if (time < this.nextAmbientAt || this.bridge.progress() === 8) return;
    this.nextAmbientAt = time + Phaser.Math.Between(11000, 18000);
    const sounds = [
      "pipe",
      "machine",
      "radio",
      "knock",
      "steam",
      "robot",
      "whisper",
      "pipe",
    ];
    const sound = sounds[this.room] || "pipe";
    this.bridge.sound(
      sound === "whisper" && !this.bridge.scary() ? "pipe" : sound,
    );
  }
  applyProgress(animate = true) {
    const p = this.bridge.progress(),
      old = this.applied;
    this.gates.forEach((g, i) => {
      const open = passageReady(i, p, this.taskState);
      const wasOpen = g.open;
      g.open = open;
      if (animate && open && !wasOpen) this.bridge.sound("door");
      g.collider.body.enable = !open;
      if (open) {
        if (animate && !wasOpen && !this.bridge.reduced()) {
          g.image.setVisible(true);
          this.tweens.add({
            targets: g.image,
            y: FLOOR - 280,
            alpha: 0,
            duration: 900,
            onComplete: () => g.image.setVisible(false),
          });
        } else g.image.setVisible(false);
      } else
        g.image
          .setVisible(true)
          .setPosition(sectors[i].start + sectors[i].gate, FLOOR)
          .setAlpha(1);
      this.terminals[i].led.setFillStyle(i < p ? 0xacc2a1 : 0xbc7765);
      this.lights[i].setAlpha(i < p ? 0.45 : 0.08);
      this.recoveryFx[i]?.setAlpha(i < p ? 0.32 : 0);
    });
    this.feeds.forEach((f) => {
      f.screen.setAlpha(f.room < p ? 0.7 : 0.08);
      f.noise.setAlpha(f.room < p ? 0.2 : 1);
    });
    if (this.robot) {
      this.robot.setTint(p > 5 ? 0xb8c6af : 0x5e6b6d);
      if (!this.robotMoving)
        this.robot.x =
          sectors[5].start +
          (this.taskState.done.includes("route") ? sectors[5].gate - 180 : 400);
    }
    this.labLight?.setAlpha(p > 4 ? 0.2 : 0.025);
    this.exitGlow?.setAlpha(p === 8 ? 0.22 : 0.02);
    this.backdrops.forEach((b, room) =>
      b.setTint(room < p ? 0xaabbb2 : 0x80969a),
    );
    if (p === 8) this.watcher?.setVisible(false);
    this.applied = p;
    this.refreshTasks();
    if (animate && p > old) {
      this.bridge.sound("unlock");
      for (let room = old; room < p; room++) this.reactToRecovery(room);
      if (p === 3 || p === 5)
        this.time.delayedCall(650, () => this.haunt(p - 1));
    }
  }
  restore(x) {
    const cap = sectors[Math.min(this.bridge.progress(), 7)];
    this.player
      .setPosition(
        Math.max(120, Math.min(Number(x) || 170, cap.start + cap.gate - 55)),
        500,
      )
      .setVelocity(0);
    this.applied = this.bridge.progress();
    this.reactionUntil = 0;
    this.watcher.setVisible(false);
    this.seen.clear();
    this.holding = null;
    this.touchInteract = false;
    this.holdBar?.clear();
    this.taskState = this.bridge.worldState();
    this.robotMoving = false;
    this.tweens.killTweensOf(this.robot);
    this.cancelScare();
    this.resetTension();
    this.applyProgress(false);
  }
  haunt(i = this.room) {
    if (
      this.bridge.progress() === 8 ||
      this.bridge.reduced() ||
      this.blocked ||
      i < 0
    )
      return;
    const s = sectors[i];
    this.watcher
      .setPosition(s.start + (i === 4 ? 490 : 330), i === 4 ? 495 : 515)
      .setDisplaySize(76, 260)
      .setVisible(true)
      .setAlpha(0.4);
    this.reactionUntil = this.time.now + 1300;
    this.tweens.add({
      targets: this.watcher,
      alpha: 0,
      duration: 1700,
      delay: 700,
      onComplete: () => this.watcher.setVisible(false),
    });
    this.bridge.sound("haunt");
  }
  buildTasks() {
    for (const task of tasks) {
      const x = sectors[task.room].start + task.x;
      let image =
        task.kind === "robot"
          ? this.robot
          : task.kind === "camera"
            ? null
            : this.add
                .image(x, FLOOR, task.texture)
                .setOrigin(0.5, 1)
                .setScale(0.82)
                .setDepth(15);
      const ring = this.add
        .circle(x, FLOOR - 175, 4, 0xacc3aa, 0.25)
        .setStrokeStyle(1, 0x9eb69c)
        .setDepth(16);
      this.taskObjects.set(task.id, { task, x, image, ring });
      if (task.kind === "dial")
        this.dialText = this.add
          .text(x, FLOOR - 93, "13", {
            font: "15px monospace",
            color: "#c1d4b3",
          })
          .setOrigin(0.5)
          .setDepth(17);
      if (task.id === "seal") {
        this.steam = this.add
          .graphics()
          .setPosition(x + 70, FLOOR - 90)
          .setDepth(16);
        this.steam.fillStyle(0x96b3ac, 0.14);
        for (let j = 0; j < 5; j++)
          this.steam.fillEllipse(j * 12, -j * 16, 28 + j * 8, 32 + j * 6);
      }
    }
  }
  refreshTasks() {
    const active = nextTask(this.room, this.bridge.progress(), this.taskState);
    this.taskObjects.forEach((o) => {
      o.ring.setVisible(active?.id === o.task.id);
      if (o.task.id === "badge" || o.task.id === "fuse")
        o.image?.setTint(
          this.taskState.done.includes(o.task.id) ? 0x6e8d7b : 0xffffff,
        );
    });
    this.dialText?.setText(channels[this.taskState.dial]);
    this.steam?.setVisible(!this.taskState.done.includes("seal"));
    this.bridge.inventory?.(this.taskState.inventory);
  }
  checkpoint() {
    this.bridge.checkpoint(this.taskState);
    this.refreshTasks();
  }
  finishTask(id) {
    completeTask(this.taskState, id);
    this.checkpoint();
    this.applyProgress();
    this.bridge.sound(
      {
        power: "machine",
        seal: "steam",
        route: "robot",
        signal: "radio",
        release: "door",
        badge: "scan",
        exit: "door",
      }[id] || "unlock",
    );
    this.bridge.taskDone?.(id);
  }
  candidates() {
    const i = sectorAt(this.player.x),
      p = this.bridge.progress();
    const list = [];
    for (const o of this.taskObjects.values())
      if (
        o.task.room === i &&
        !this.taskState.done.includes(o.task.id) &&
        (o.task.phase === "before" || p > i)
      ) {
        if (o.task.kind === "camera") {
          for (const feed of this.feeds.filter((f) => f.room === 2))
            list.push({
              x: feed.x,
              prompt: "Periksa kamera " + (feed.index + 1),
              task: o.task,
              feed,
            });
        } else
          list.push({
            x: o.task.kind === "robot" ? this.robot.x : o.x,
            prompt: o.task.prompt,
            task: o.task,
            object: o,
          });
      }
    list.push({
      x: this.terminals[i].x,
      prompt: i < p ? "Sistem online" : "Akses terminal",
      terminal: i,
    });
    if (i === 7 && passageReady(7, p, this.taskState))
      list.push({
        x: sectors[7].start + sectors[7].gate - 85,
        prompt: "Keluar",
        exit: true,
      });
    return list
      .map((o) => ({ ...o, distance: Math.abs(o.x - this.player.x) }))
      .filter((o) => o.distance < 82)
      .sort((a, b) => a.distance - b.distance);
  }
  interact() {
    if (
      this.blocked ||
      this.ending ||
      this.holding ||
      this.robotMoving ||
      this.hidden ||
      this.recovering
    )
      return;
    const target = this.candidates()[0];
    if (!target) return;
    if (target.exit) return this.escapeEnding();
    if (target.terminal !== undefined) {
      if (!terminalReady(target.terminal, this.taskState))
        return this.bridge.notice(
          nextTask(target.terminal, this.bridge.progress(), this.taskState)
            ?.goal,
        );
      this.player.setFrame(3);
      return this.bridge.terminal(target.terminal);
    }
    const { task } = target;
    if (task.kind === "hold") {
      this.holding = { id: task.id, elapsed: 0, x: target.x };
      return;
    }
    if (task.kind === "camera") {
      if (target.feed.index === 2) {
        this.finishTask("camera");
        this.bridge.notice("Kamera EXIT terhubung. Jalur aman.");
      } else if (target.feed.index === 1) {
        this.triggerFear("camera");
        target.feed.screen.setTint(0xa26861);
        this.bridge.notice("Sinyal asing. Cari kamera EXIT.");
      } else this.bridge.notice("Ruang kontrol kosong. Cari kamera EXIT.");
      return;
    }
    if (task.id === "power" && !this.taskState.inventory.includes("fuse"))
      return this.bridge.notice("Ambil sekring dari kabinet dahulu.");
    if (task.id === "fuse") {
      this.taskState.inventory.push("fuse");
      this.finishTask(task.id);
      return;
    }
    if (task.id === "power") {
      this.taskState.inventory = [];
      this.finishTask(task.id);
      return;
    }
    if (task.kind === "dial") {
      this.taskState.dial = (this.taskState.dial + 1) % channels.length;
      this.checkpoint();
      this.bridge.sound("terminal");
      if (channels[this.taskState.dial] === "07") this.finishTask(task.id);
      return;
    }
    if (task.kind === "robot") {
      this.robotMoving = true;
      this.bridge.notice("Ikuti robot menuju gerbang.");
      this.tweens.add({
        targets: this.robot,
        x: sectors[5].start + sectors[5].gate - 180,
        duration: this.bridge.reduced() ? 600 : 2400,
        onComplete: () => {
          this.robotMoving = false;
          this.finishTask("route");
        },
      });
      return;
    }
    if (task.kind === "lever" && target.object.image)
      this.tweens.add({
        targets: target.object.image,
        angle: -12,
        duration: 250,
        yoyo: true,
      });
    this.finishTask(task.id);
  }
  triggerFear(id) {
    if (
      this.blocked ||
      this.ending ||
      this.taskState.scares.includes(id) ||
      this.bridge.progress() === 8
    )
      return;
    this.taskState.scares.push(id);
    this.checkpoint();
    if (id === "glass" || !this.bridge.scary()) {
      this.haunt(this.room);
      return;
    }
    this.reactionUntil = this.time.now + 1500;
    this.playScare(id);
  }
  cancelScare() {
    this.scareTimers?.forEach((timer) => timer.remove(false));
    this.scareTimers = [];
    this.scareTween?.stop();
    this.jumpImage?.setVisible(false);
    this.scareVeil?.setVisible(false);
    this.scareActive = false;
  }
  playScare(kind) {
    this.cancelScare();
    if (!this.bridge.scary()) return;
    this.scareActive = true;
    this.player.setVelocityX(0);
    this.scareVeil.setVisible(true).setAlpha(0.9);
    this.bridge.sound("haunt");
    const wait = kind === "capture" ? 100 : kind === "camera" ? 450 : 280;
    this.scareTimers.push(
      this.time.delayedCall(wait, () => {
        this.jumpImage
          .setVisible(true)
          .setAlpha(1)
          .setDisplaySize(1170, 780)
          .setAngle(kind === "camera" ? -3 : 2);
        this.bridge.sound("scare");
        this.cameras.main.shake(210, 0.006);
        this.scareTween = this.tweens.add({
          targets: this.jumpImage,
          scaleX: this.jumpImage.scaleX * 1.2,
          scaleY: this.jumpImage.scaleY * 1.2,
          duration: 160,
          ease: "Cubic.Out",
        });
      }),
    );
    this.scareTimers.push(
      this.time.delayedCall(wait + 480, () => {
        this.jumpImage.setVisible(false);
      }),
    );
    this.scareTimers.push(
      this.time.delayedCall(wait + 800, () => this.cancelScare()),
    );
  }
  escapeEnding() {
    this.ending = true;
    this.escapePressure = null;
    this.hunter.setVisible(false);
    this.watcher.setVisible(false);
    this.player.setFlipX(false).setVelocityX(100);
    this.bridge.ending?.();
    this.time.delayedCall(2600, () => {
      this.player.setVelocity(0);
      this.bridge.finish();
    });
  }
  update(time, delta) {
    if (!this.player) return;
    const i = sectorAt(this.player.x);
    if (i !== this.room) {
      this.room = i;
      this.bridge.room(i);
      this.refreshTasks();
      if (!this.seen.has(i)) {
        this.seen.add(i);
        if (i === 2 && this.bridge.progress() < 3)
          this.time.delayedCall(700, () => this.haunt(i));
      }
    }
    this.beam.clear();
    if (this.blocked || this.scareActive) {
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
    this.ambientBeat(time);
    const speed = this.updateTension(delta, dir);
    this.player.setVelocityX(dir * speed);
    if (dir) {
      this.player.setFlipX(dir < 0);
      this.step += delta;
      if (this.step > 440) {
        this.bridge.sound("step");
        this.step = 0;
      }
    }
    this.player.setFrame(
      this.time.now < (this.reactionUntil || 0)
        ? 4
        : dir
          ? (Math.floor(time / 210) % 2) + 1
          : 0,
    );
    if (this.bridge.progress() > 1 && this.rotor && !this.bridge.reduced())
      this.rotor.rotation += delta * 0.00035;
    const direction = this.player.flipX ? -1 : 1;
    for (let j = 0; this.lightOn && !this.hidden && j < 3; j++) {
      this.beam.fillStyle(0xc1d3b6, 0.035);
      this.beam.fillTriangle(
        this.player.x + direction * 25,
        this.player.y + 35,
        this.player.x + direction * (170 + j * 20),
        this.player.y + 5 - j * 12,
        this.player.x + direction * (170 + j * 20),
        this.player.y + 100 + j * 8,
      );
    }
    if (this.holding) {
      this.player.setVelocityX(0).setFrame(3);
      if (!this.keys.E.isDown && !this.touchInteract) {
        this.holding = null;
        this.holdBar.clear();
      } else {
        this.holding.elapsed += delta;
        const ratio = Math.min(1, this.holding.elapsed / 1400);
        this.holdBar
          .clear()
          .fillStyle(0x172d2d)
          .fillRect(this.holding.x - 35, FLOOR - 180, 70, 5)
          .fillStyle(0xb5ceb0)
          .fillRect(this.holding.x - 35, FLOOR - 180, 70 * ratio, 5);
        if (ratio === 1) {
          const id = this.holding.id;
          this.holding = null;
          this.holdBar.clear();
          this.finishTask(id);
          if (id === "exit") {
            this.escapePressure = { x: sectors[7].start + 850, delay: 0.25 };
            this.stamina = 1;
            this.exhausted = false;
            this.bridge.sound("haunt");
          }
          if (id === "seal") this.triggerFear("glass");
        }
      }
    }
    if (i === 7 && this.player.x > sectors[7].start + 350)
      this.triggerFear("exit");
    const target = this.candidates()[0];
    this.prompt
      .setVisible(Boolean(target))
      .setPosition(this.player.x, this.player.y - 125)
      .setText(
        this.hidden
          ? "SPACE · tetap sembunyi"
          : target
            ? "E · " + target.prompt
            : "",
      );
    const task = nextTask(i, this.bridge.progress(), this.taskState);
    const objective =
      this.tensionHint ||
      (this.robotMoving
        ? "Ikuti robot menuju gerbang."
        : task
          ? task.goal
          : i >= this.bridge.progress()
            ? "Akses terminal untuk memulihkan sistem."
            : i === 7
              ? "EXIT terbuka. Dekati pintu."
              : "Jalur terbuka. Lanjut ke kanan.");
    if (objective !== this.lastObjective) {
      this.lastObjective = objective;
      this.bridge.objective(objective);
    }
    this.bridge.position(this.player.x);
  }
}
