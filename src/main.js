import $ from "jquery";
import { rooms } from "./game/metadata.js";
import { api } from "./services/api.js";
import { reflectionPrompt, lessons } from "./game/learning.js";
import { worldState } from "./game/missions.js";
import { Soundscape } from "./game/soundscape.js";
import {
  operators,
  operator,
  entryLines,
  recoveryLine,
  taskLine,
  endingFor,
} from "./game/story.js";
import { downloadReport } from "./game/report.js";
import "./style.css";
const ui = document.querySelector("#ui");
const KEY = "null07-run";
let run = null,
  scene = null,
  overlay = true,
  currentRoom = 0,
  soundOn = true,
  ctx = null,
  lastSave = 0,
  pending = null;
try {
  run = JSON.parse(localStorage.getItem(KEY));
} catch {}
let reduceScares = false;
try {
  reduceScares =
    JSON.parse(localStorage.getItem("null07-settings"))?.reduceScares === true;
} catch {}
let volume = 0.45;
try {
  const settings = JSON.parse(localStorage.getItem("null07-settings"));
  if (typeof settings?.soundOn === "boolean") soundOn = settings.soundOn;
  if (Number.isFinite(settings?.volume))
    volume = Math.max(0, Math.min(1, settings.volume));
} catch {}
const ambience = new Soundscape(() => (ctx ||= new AudioContext()));
function saveSettings() {
  try {
    localStorage.setItem(
      "null07-settings",
      JSON.stringify({ reduceScares, soundOn, volume }),
    );
  } catch {}
}
function syncAmbience(danger = 0) {
  ambience.set(
    soundOn,
    !overlay || Boolean(document.querySelector(".opening")),
    volume,
    danger,
  );
}
let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function save() {
  if (run)
    try {
      localStorage.setItem(KEY, JSON.stringify(run));
    } catch {}
}
let dialogueTimer = null,
  activeDialogue = null;
const dialogueQueue = [];
let recordPromise = null,
  recordToken = null;
function verifiedResult() {
  if (recordToken !== run.token || !recordPromise) {
    recordToken = run.token;
    recordPromise = api("result", { token: run.token }).catch((error) => {
      recordPromise = null;
      throw error;
    });
  }
  return recordPromise;
}
function stopDialogue() {
  clearTimeout(dialogueTimer);
  document.querySelector(".radio-caption")?.remove();
  if (activeDialogue) dialogueQueue.unshift(activeDialogue);
  activeDialogue = null;
}
function playDialogue() {
  if (overlay || activeDialogue || !dialogueQueue.length || scene?.ending)
    return;
  activeDialogue = dialogueQueue.shift();
  const line = activeDialogue;
  const el = document.createElement("aside");
  el.className = "radio-caption" + (line.suspicious ? " suspicious" : "");
  el.setAttribute("role", "status");
  el.innerHTML = `<span>${esc(line.speaker)}</span><p>${esc(line.text)}</p>`;
  ui.append(el);
  if (line.sound) tone(line.sound);
  dialogueTimer = setTimeout(
    () => {
      el.remove();
      activeDialogue = null;
      playDialogue();
    },
    line.sound ? 5600 : 4300,
  );
}
function storyEvent(key, lines) {
  if (!run) return;
  const heard = Array.isArray(run.storyHeard)
    ? run.storyHeard.filter((x) => typeof x === "string").slice(0, 40)
    : [];
  if (heard.includes(key)) return;
  run.storyHeard = [...heard, key];
  save();
  dialogueQueue.push(...lines.filter(Boolean));
  // Keep recent story beats close to their actual room instead of accumulating stale radio calls.
  if (dialogueQueue.length > 4)
    dialogueQueue.splice(0, dialogueQueue.length - 4);
  playDialogue();
}
function tone(kind) {
  if (!soundOn) return;
  if (kind === "whisper" && (reduceScares || reduced)) return;
  if (ambience.play(kind)) return;
  try {
    ctx ||= new AudioContext();
    ctx.resume();
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type =
      kind === "step" ? "triangle" : kind === "scare" ? "sawtooth" : "sine";
    o.frequency.value =
      kind === "scare"
        ? 85
        : kind === "step"
          ? 65
          : kind === "unlock"
            ? 330
            : kind === "haunt"
              ? 38
              : 180;
    g.gain.setValueAtTime(
      (kind === "scare" ? 0.025 : kind === "step" ? 0.035 : 0.055) * volume,
      ctx.currentTime,
    );
    if (kind === "scare")
      o.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  } catch {}
}
function shell(content, cls = "") {
  document.querySelector(".toast")?.remove();
  stopDialogue();
  ambience.stopEffects(true);
  overlay = true;
  if (scene) {
    scene.cancelScare?.();
    scene.blocked = true;
    scene.physics.pause();
    scene.tweens.pauseAll();
    scene.time.paused = true;
  }
  ui.innerHTML = `<div class="veil ${cls}">${content}</div>`;
  ui.querySelector("button,input")?.focus();
  syncAmbience();
}
function alertError(e) {
  const el = document.querySelector("#error");
  if (el) el.textContent = e.message;
  else toast(e.message);
}
function toast(message) {
  document.querySelector(".toast")?.remove();
  const d = document.createElement("div");
  d.className = "toast";
  d.textContent = message;
  document.body.append(d);
  setTimeout(() => d.remove(), 6500);
}
function clock() {
  const mins = Math.round(((run?.progress || 0) * 180) / 8);
  return `${String(3 + Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")} AM`;
}
function hud() {
  overlay = false;
  ui.innerHTML = `<header class="hud"><div class="shift-status"><span id="clock">${clock()}</span><span class="progress-count">${run.progress} / 8</span></div><div class="hud-right"><button id="audio" aria-label="Suara ${soundOn ? "aktif" : "mati"}" title="Suara">${soundOn ? "SOUND ON" : "SOUND OFF"}</button><button id="pause" aria-label="Jeda">Ⅱ</button></div></header><div class="room-caption" id="room">${rooms[currentRoom]}</div>${!run.tutorialSeen ? '<div class="first-controls"><kbd>A</kbd><kbd>D</kbd> Berjalan <span>·</span> <kbd>E</kbd> Interaksi</div>' : ""}<div class="world-objective"><span id="inventory"></span><span id="objective" role="status" aria-live="polite"></span><span id="tension-status" class="tension-status" aria-live="off"></span></div><div class="touch"><button id="flashlight" aria-label="Senter">F</button><button id="hide" aria-label="Tahan untuk merunduk atau sembunyi">◒</button><button id="sprint" aria-label="Tahan untuk lari">LARI</button><button id="left" aria-label="Berjalan kiri">◀</button><button id="interact" aria-label="Interaksi">E</button><button id="right" aria-label="Berjalan kanan">▶</button></div>`;
  document.querySelector("#audio").onclick = () => {
    soundOn = !soundOn;
    if (soundOn) ambience.unlock();
    saveSettings();
    syncAmbience();
    tone("terminal");
    const button = document.querySelector("#audio");
    button.textContent = soundOn ? "SOUND ON" : "SOUND OFF";
    button.setAttribute("aria-label", "Suara " + (soundOn ? "aktif" : "mati"));
  };
  document.querySelector("#pause").onclick = pause;
  for (const [id, dir] of [
    ["left", -1],
    ["right", 1],
  ]) {
    const b = document.getElementById(id);
    b.onpointerdown = (e) => {
      b.setPointerCapture(e.pointerId);
      scene.touch = dir;
    };
    b.onpointerup = b.onpointercancel = () => (scene.touch = 0);
  }
  document.querySelector("#flashlight").onclick = () => scene.toggleLight();
  for (const [id, field] of [
    ["hide", "touchHide"],
    ["sprint", "touchRun"],
  ]) {
    const button = document.getElementById(id);
    button.onpointerdown = (e) => {
      button.setPointerCapture(e.pointerId);
      scene[field] = true;
    };
    button.onpointerup = button.onpointercancel = () => (scene[field] = false);
  }
  const interactButton = document.querySelector("#interact");
  interactButton.onpointerdown = (e) => {
    interactButton.setPointerCapture(e.pointerId);
    scene.touchInteract = true;
    scene.interact();
  };
  interactButton.onpointerup = interactButton.onpointercancel = () =>
    (scene.touchInteract = false);
  if (scene) {
    scene.blocked = false;
    scene.physics.resume();
    scene.tweens.resumeAll();
    scene.time.paused = false;
    Object.values(scene.keys).forEach((k) => k.reset());
    scene.touch = 0;
    scene.touchInteract = false;
    scene.touchHide = false;
    scene.touchRun = false;
    scene.lastObjective = null;
    scene.refreshTasks();
  }
  syncAmbience();
  playDialogue();
}
function landing() {
  shell(
    `<div class="title-mark">NULL—07</div><main class="landing"><p class="overline">JAVASCRIPT</p><h1>THE LAST<br><span>SHIFT</span></h1><p class="title-time">03:00 AM</p><div class="actions"><button class="primary" id="start">${run ? "LANJUTKAN" : "MULAI SHIFT"} <span>→</span></button>${run ? '<button class="text-button" id="new">SHIFT BARU</button>' : ""}</div></main>`,
    "landing-veil",
  );
  document.querySelector("#start").onclick = () => {
    if (soundOn) ambience.unlock();
    run ? resume() : briefing();
  };
  document.querySelector("#new")?.addEventListener("click", briefing);
}
function characterChoices() {
  return `<fieldset class="character-choices"><legend>PILIH MC</legend><div class="character-options">${Object.entries(
    operators,
  )
    .map(
      ([id, mc]) =>
        `<label class="character-card"><input type="radio" name="character" value="${id}" ${id === "male" ? "checked" : ""} required><div class="character-card-header">NULL—07 <span>PERSONNEL ID</span></div><div class="character-card-body"><div class="character-portrait" role="img" aria-label="Potret karakter ${mc.name}" style="--sprite: url('/assets/characters/${id}-sprite.png')"></div><div class="character-card-info"><small>ID ${mc.number}</small><strong>${mc.name}</strong><span>${mc.role}</span><div class="character-barcode" aria-hidden="true"></div></div></div><div class="character-card-footer"><span>ACCESS LEVEL 01</span><span class="character-state"></span></div></label>`,
    )
    .join("")}</div></fieldset>`;
}
function identity() {
  shell(
    `<div class="panel registration"><div class="panel-top"><span>PERSONNEL TERMINAL</span><span>NULL-07</span></div><h2>Data operator.</h2><form id="identity"><label>Nama Lengkap<input name="name" required maxlength="80" autocomplete="name" placeholder="Nama lengkap"></label><div class="form-row"><label>NIM<input name="nim" required maxlength="80" placeholder="Nomor induk mahasiswa"></label><label>Kelas<input name="kelas" required maxlength="80" placeholder="Contoh: TI-24-XX"></label></div>${characterChoices()}<p id="error" role="alert"></p><button class="primary" type="submit">MASUK <span>→</span></button></form><button class="text-button" id="back">← KEMBALI</button><div class="fine">Jawaban pertama dinilai. Jawaban salah tetap bisa diperbaiki.</div></div>`,
  );
  document.querySelector("#back").onclick = landing;
  document.querySelector("#identity").onsubmit = (e) => {
    e.preventDefault();
    reflection(Object.fromEntries(new FormData(e.target)));
  };
}
function modeChoices(prefix) {
  return `<fieldset class="mode-choices"><legend>MODE PERMAINAN</legend><div class="mode-options"><label class="mode-card"><input type="radio" name="scare-mode" id="${prefix}-horror" value="horror" ${!reduceScares ? "checked" : ""}><span><strong>HORROR</strong><small>Jumpscare, sergapan dekat & suara benturan.</small></span></label><label class="mode-card"><input type="radio" name="scare-mode" id="${prefix}-tenang" value="tenang" ${reduceScares ? "checked" : ""}><span><strong>TENANG</strong><small>Tanpa jumpscare. Eksplorasi & tantangan tetap ada.</small></span></label></div></fieldset>`;
}
function bindModeChoices() {
  document.querySelectorAll('[name="scare-mode"]').forEach((input) => {
    input.onchange = () => {
      reduceScares = input.value === "tenang";
      saveSettings();
    };
  });
}
function briefing() {
  shell(
    `<section class="panel briefing"><div class="panel-top"><span>SEBELUM SHIFT</span><span>NULL-07</span></div><h2>Ketahui risikonya.</h2><p class="horror-warning">Horror fiksi dengan jumpscare, suara mendadak, pengejaran, dan gerakan kamera.</p><div class="control-guide"><p><kbd>A / D</kbd> Berjalan</p><p><kbd>E</kbd> Interaksi</p><p><kbd>F</kbd> Senter</p><p><kbd>SPACE</kbd> Merunduk / sembunyi di loker</p><p><kbd>SHIFT</kbd> Lari · cepat tapi berisik</p><p><kbd>ESC</kbd> Jeda / tutup terminal</p></div><p class="fine">Pulihkan 8 terminal. Dunia berhenti saat soal terbuka. Jawaban pertama dinilai; kesalahan memicu gangguan, lalu kamu tetap belajar dan melanjutkan.</p>${modeChoices("brief")}<label class="check"><input id="brief-sound" type="checkbox" ${soundOn ? "checked" : ""}> Aktifkan suara</label><button class="primary" id="brief-next">SIAPKAN DATA OPERATOR →</button><button class="text-button" id="brief-back">KEMBALI</button></section>`,
  );
  bindModeChoices();
  document.querySelector("#brief-back").onclick = landing;
  document.querySelector("#brief-next").onclick = () => {
    soundOn = document.querySelector("#brief-sound").checked;
    if (soundOn) ambience.unlock();
    saveSettings();
    tone("terminal");
    identity();
  };
}
function reflection(data, value = "") {
  shell(
    `<section class="panel reflection"><div class="panel-top"><span>CATATAN SEBELUM SHIFT</span><span>01 / REFLEKSI</span></div><h2>Menurutmu sendiri.</h2><p>${esc(reflectionPrompt)}</p><form id="reflection"><label class="sr-only" for="essay">Pandangan awal tentang JavaScript</label><textarea id="essay" name="reflection" required minlength="20" maxlength="600" rows="5" placeholder="Tulis pandanganmu, bukan jawaban hafalan…">${esc(value)}</textarea><p class="fine">20–600 karakter. Tidak dinilai benar atau salah. Catatan ini akan muncul pada hasil akhir dan tersimpan dalam sesi browser ini.</p><p id="error" role="alert"></p><button class="primary" type="submit">MULAI SHIFT →</button></form></section>`,
  );
  document.querySelector("#reflection").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.submitter;
    button.disabled = true;
    try {
      run = {
        ...(await api("session", {
          ...data,
          reflection: document.querySelector("#essay").value.trim(),
        })),
        character: data.character === "female" ? "female" : "male",
        x: 180,
        world: worldState(null),
        escaped: false,
        introSeen: false,
      };
      pending = null;
      dialogueQueue.length = 0;
      save();
      opening();
    } catch (err) {
      alertError(err);
      button.disabled = false;
    }
  };
}
function opening(beat = 0) {
  const character = run.character === "female" ? "female" : "male",
    mc = operator(character);
  const quote =
    character === "female"
      ? "Satu shift lagi. Aku cuma perlu menjaga sistem tetap hidup."
      : "Cek pintu, cek radio. Seharusnya malam ini seperti biasa.";
  shell(
    `<section class="opening cinematic-opening ${beat ? "door-authorized" : ""}"><div class="scanner-rig"><div class="scanner-door"></div><div class="scanner-card"><span class="scanner-label">NULL—07 / PERSONNEL ID</span><div class="scanner-personnel"><div class="character-portrait" style="--sprite: url('/assets/characters/${character}-sprite.png'); --portrait-offset: ${character === "female" ? "142px" : "165px"}" role="img" aria-label="${mc.name}"></div><div><strong>${mc.name}</strong><small>${mc.role}</small><span>ID ${mc.number}</span></div></div><div class="scan-beam"></div></div><div class="scanner-status">${beat ? "AKSES DITERIMA / PINTU TERBUKA" : "MEMINDAI KARTU OPERATOR"}</div></div><span class="overline">${beat ? "TRANSMISI DARURAT" : "03:00 AM"}</span><h2>${beat ? "Ada yang ikut terbangun." : "Shift terakhir."}</h2><p>${beat ? "Delapan sistem terkunci. Radio memintamu masuk. Pulihkan terminal dan temukan EXIT-07." : `${mc.name}: “${quote}”`}</p><button class="primary" id="intro-next">${beat ? "MASUK FASILITAS" : "MASUKKAN KARTU"} →</button><button class="text-button" id="intro-skip">LEWATI OPENING</button></section>`,
    "opening-veil",
  );
  tone(beat ? "door" : "scan");
  const finish = () => {
    run.introSeen = true;
    save();
    enter();
  };
  document.querySelector("#intro-next").onclick = beat
    ? finish
    : () => opening(1);
  document.querySelector("#intro-skip").onclick = finish;
}

async function resume() {
  try {
    const state = await api("resume", { token: run.token });
    run = { ...run, ...state };
    save();
    if (run.complete && (!run.world || run.escaped)) return results();
    if (run.introSeen === false) opening();
    else await enter();
  } catch (e) {
    shell(
      `<div class="panel"><h2>Session unavailable.</h2><p>${esc(e.message)}</p><button class="primary" id="restart">START A NEW SHIFT</button></div>`,
    );
    document.querySelector("#restart").onclick = briefing;
  }
}
async function enter() {
  run.world = worldState(run.world, run.progress);
  save();
  if (scene) {
    scene.selectCharacter();
    scene.applyProgress();
    scene.restore(run.x);
    scene.ending = false;
    hud();

    return;
  }
  shell(
    '<div class="loading-shift"><span>NULL—07</span><p id="load-progress">Menyiapkan fasilitas…</p></div>',
  );
  const [{ default: Phaser }, { Facility }] = await Promise.all([
    import("phaser"),
    import("./game/world.js"),
  ]);
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: 1280,
    height: 720,
    backgroundColor: "#081116",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 650 }, debug: false },
    },
    scene: new Facility({
      ready: (s) => {
        scene = s;
        s.restore(run.x);
        hud();
      },
      progress: () => run?.progress || 0,
      character: () => (run?.character === "female" ? "female" : "male"),
      reduced: () => reduced,
      scary: () => !reduceScares && !reduced,
      worldState: () => run.world,
      checkpoint: (state) => {
        run.world = state;
        save();
      },
      objective: (message) => {
        const el = document.querySelector("#objective");
        if (el) el.textContent = message;
      },
      notice: (message) => {
        const el = document.querySelector("#objective");
        if (el && message) el.textContent = message;
      },
      inventory: (items) => {
        const el = document.querySelector("#inventory");
        if (el) el.textContent = items.includes("fuse") ? "SEKRING · " : "";
      },
      tension: ({ mode, stamina, light }) => {
        syncAmbience(
          mode === "chase" || mode === "escape"
            ? 1
            : mode === "alert"
              ? 0.5
              : 0,
        );
        const el = document.querySelector("#tension-status");
        if (!el) return;
        el.dataset.state = mode;
        el.textContent =
          mode === "safe"
            ? ""
            : `SENTER ${light ? "ON" : "OFF"} · NAPAS ${Math.round(stamina * 100)}%`;
      },
      sound: tone,
      recovered: (room) =>
        storyEvent(`recovered:${room}`, [recoveryLine(room, run.character)]),
      taskDone: (id) => storyEvent(`task:${id}`, [taskLine(id, run.character)]),
      loading: (n) => {
        const el = document.querySelector("#load-progress");
        if (el) el.textContent = "Memuat " + Math.round(n * 100) + "%";
      },
      ending: () => {
        stopDialogue();
        dialogueQueue.length = 0;
        document.querySelector(".room-caption")?.remove();
        document.querySelector(".hud")?.remove();
        const el = document.createElement("div");
        el.className = "ending-caption";
        el.innerHTML = "<span>06:00 AM</span><p>EXIT VERIFIED</p>";
        ui.append(el);
        tone("door");
        verifiedResult()
          .then((result) => {
            if (!el.isConnected) return;
            const end = endingFor(result.correct, run.character);
            scene.setEndingStyle(end);
            el.innerHTML = `<span>06:00 AM / ${esc(end.facility)}</span><p>${esc(end.title)}</p><small>${esc(end.speaker)}: ${esc(end.copy)}</small>`;
          })
          .catch(() => {});
      },
      room: (i) => {
        currentRoom = i;
        storyEvent(`room:${i}`, entryLines(i, run.character));
        if (!overlay) {
          const label = document.querySelector("#room");
          label.textContent = rooms[i];
          label.style.animation = "none";
          void label.offsetWidth;
          label.style.animation = "";
        }
      },
      position: (x) => {
        if (run) {
          run.x = x;
          if (!run.tutorialSeen && (x > 310 || run.progress > 0)) {
            run.tutorialSeen = true;
            document.querySelector(".first-controls")?.remove();
          }
          if (Date.now() - lastSave > 1000) {
            save();
            lastSave = Date.now();
          }
        }
      },
      terminal,
      escape: () => {
        if (pending) return;
        if (overlay) {
          if (
            document.querySelector("#close") &&
            !document.querySelector("#close").disabled
          )
            hud();
          else if (document.querySelector("#resume")) hud();
        } else pause();
      },
      finish: () => {
        run.escaped = true;
        save();
        results();
      },
    }),
  });
}
function pause() {
  save();
  shell(
    `<div class="panel pause-panel"><h2>Jeda.</h2><button class="primary" id="resume">LANJUTKAN <span>→</span></button><label class="check"><input type="checkbox" id="motion" ${reduced ? "checked" : ""}> Kurangi gerakan lingkungan</label>${modeChoices("pause")}<label class="check"><input id="pause-sound" type="checkbox" ${soundOn ? "checked" : ""}> Suara & ambience</label><label class="volume-control">VOLUME <input id="volume" type="range" min="0" max="100" value="${Math.round(volume * 100)}"></label><button id="restart">MULAI ULANG</button><button class="text-button" id="menu">MENU UTAMA</button></div>`,
  );
  document.querySelector("#resume").onclick = hud;
  document.querySelector("#motion").onchange = (e) =>
    (reduced = e.target.checked);
  bindModeChoices();
  document.querySelector("#pause-sound").onchange = (e) => {
    soundOn = e.target.checked;
    if (soundOn) ambience.unlock();
    saveSettings();
    syncAmbience();
  };
  document.querySelector("#volume").oninput = (e) => {
    volume = Number(e.target.value) / 100;
    saveSettings();
    syncAmbience();
  };
  document.querySelector("#restart").onclick = briefing;
  document.querySelector("#menu").onclick = landing;
}
async function terminal(i) {
  if (i < run.progress) {
    toast("Sistem sudah aktif.");
    return;
  }
  if (i !== run.progress) {
    toast("Pulihkan sistem sebelumnya terlebih dahulu.");
    return;
  }
  tone("terminal");
  shell('<div class="loading-shift"><p>Menghubungkan terminal…</p></div>');
  try {
    const q = await api("question", { token: run.token, puzzle: i });
    shell(
      `<section class="panel terminal ${i === 7 ? "final-terminal" : ""}"><div class="panel-top"><span>${rooms[i]}</span><button id="close" aria-label="Tutup terminal">✕</button></div><h2>${esc(q.mission)}</h2><p class="instruction">${esc(q.instruction)}</p><pre><code>${esc(q.code)}</code></pre><form id="answer"><fieldset><legend class="sr-only">Pilih satu jawaban, lalu konfirmasi</legend>${q.options.map((o, j) => `<label class="option"><input type="radio" name="option" value="${esc(o.id)}" required><span class="option-letter">${String.fromCharCode(65 + j)}</span><code>${esc(o.label)}</code></label>`).join("")}</fieldset><p id="error" role="alert"></p><div class="terminal-actions"><button type="button" id="hint">Bantuan</button><button class="primary" type="submit">KONFIRMASI <span>↵</span></button></div></form><p id="hint-copy" class="hint" hidden>${esc(q.hint)}</p></section>`,
    );
    document.querySelector("#close").onclick = hud;
    document.querySelector("#hint").onclick = () => {
      document.querySelector("#hint-copy").hidden = false;
    };
    document.querySelector("#answer").onsubmit = async (e) => {
      e.preventDefault();
      const option = new FormData(e.target).get("option");
      const b = e.submitter;
      b.disabled = true;
      document.querySelector("#close").disabled = true;
      pending = { i };
      try {
        const a = await api("answer", { token: run.token, puzzle: i, option });
        run = { ...run, ...a };
        delete run.repair;
        delete run.explanation;
        delete run.correct;
        save();
        pending = null;
        feedback(i, a);
      } catch (err) {
        pending = null;
        alertError(err);
        b.disabled = false;
        document.querySelector("#close").disabled = false;
      }
    };
  } catch (e) {
    hud();
    toast(e.message);
  }
}
function feedback(i, a) {
  shell(
    `<section class="panel terminal feedback"><div class="panel-top"><span>${rooms[i]}</span><span>${a.correct ? "✓" : "↻"}</span></div><h2>${a.correct ? "Sistem pulih." : "Kita perbaiki bersama."}</h2><p>${esc(a.explanation)}</p>${!a.correct ? `<pre><code>${esc(a.repair)}</code></pre>` : ""}${i === 7 ? '<div class="effect-demo"><span id="corruption">GANGGUAN</span><span id="exit" style="display:none">EXIT ONLINE</span><span id="signal" style="height:20px;overflow:hidden">●</span></div>' : ""}<button class="primary" id="continue">${i === 7 ? "BUKA EXIT" : "KEMBALI"} <span>→</span></button></section>`,
  );
  if (i === 7) {
    $("#corruption").hide(reduced ? 0 : 700);
    $("#exit").show(reduced ? 0 : 700);
    $("#signal").animate({ height: "toggle" }, reduced ? 0 : 1000);
  }
  if (!a.correct) {
    const next = document.querySelector("#continue");
    const banner = document.createElement("p");
    banner.className = "fault-message";
    banner.textContent =
      "GANGGUAN TERDETEKSI · baca perbaikannya, lalu lanjutkan.";
    document.querySelector(".feedback h2").after(banner);
    if (!reduceScares && !reduced) {
      next.disabled = true;
      const shock = document.createElement("div");
      shock.className = "answer-disturbance";
      shock.setAttribute("role", "status");
      shock.dataset.phase = "signal";
      shock.style.setProperty("--approach", i % 2 ? "-4deg" : "3deg");
      shock.innerHTML = `<img alt="Watcher menyerang dari balik kaca terminal" src="/assets/watcher-scare-v2.png"><span>CONNECTION LOST</span>`;
      ui.append(shock);
      tone("haunt");
      setTimeout(
        () => {
          if (!shock.isConnected) return;
          shock.dataset.phase = "impact";
          tone("scare");
        },
        280 + (i % 3) * 70,
      );
      setTimeout(() => {
        shock.dataset.phase = "after";
      }, 850);
      setTimeout(() => {
        shock.remove();
        next.disabled = false;
        if (next.isConnected) next.focus();
      }, 1250);
    }
  }
  document.querySelector("#continue").onclick = () => {
    hud();
    scene.applyProgress();
  };
}
async function results() {
  save();
  shell('<div class="panel"><h2>Verifying shift record…</h2></div>');
  try {
    const r = await verifiedResult();
    const mc = operator(run.character),
      end = endingFor(r.correct, run.character);
    const mins = Math.floor((r.completed - r.started) / 60000),
      seconds = Math.floor((r.completed - r.started) / 1000) % 60;
    const info = `Nama: ${r.identity.name}\nNIM: ${r.identity.nim}\nKelas: ${r.identity.kelas}\nCorrect: ${r.correct}/8\nNilai: ${r.score}\nStatus: COMPLETE\nCompletion: ${mins}m ${seconds}s\nJulukan: ${r.rank}\nMC: ${mc.name} — ${mc.role}\nID MC: ${mc.number}\nEnding: ${end.title}\n\nRefleksi awal: ${r.reflection || "Tidak tersedia pada sesi lama."}\n\nCatatan belajar:\n${lessons.map(([title, copy], i) => `${title}: ${r.outcomes?.[i] ? "Jawaban pertama tepat" : "Tinjau kembali"}. ${copy}`).join("\n")}`;
    shell(
      `<section class="panel result shift-record"><div class="record-header"><span>NULL—07 / ${esc(mc.name)} / ID ${mc.number}</span><span>06:00 AM</span></div><div class="record-heading"><div><p class="overline">SHIFT SELESAI</p><h2>Kamu berhasil<br>keluar.</h2></div><div class="record-stamp">EXIT<br>VERIFIED</div></div><div class="result-body"><div class="identity-result"><label>NAMA<strong>${esc(r.identity.name)}</strong></label><div class="form-row"><label>NIM<strong>${esc(r.identity.nim)}</strong></label><label>KELAS<strong>${esc(r.identity.kelas)}</strong></label></div><div class="record-status"><span>COMPLETE</span><span>${mins}m ${seconds}s</span></div></div><div class="score"><small>NILAI AKHIR</small><strong>${r.score}<span>/100</span></strong><p class="answer-count">${r.correct} / 8 JAWABAN PERTAMA TEPAT</p><div class="rank">${esc(r.rank)}</div><p class="rank-description">${esc(r.rankDescription || "")}</p></div></div><section class="record-ending" data-ending="${end.tier}"><strong>${esc(end.title)}</strong><p>${esc(mc.name)}: ${esc(end.copy)}</p><span>${esc(end.facility)}</span></section><section class="record-reflection"><div class="record-section-label"><span>01 / CATATAN SEBELUM SHIFT</span></div><blockquote class="essay-result">${esc(r.reflection || "Sesi lama ini belum memiliki esai awal.")}</blockquote><p class="reflection-question">${esc(reflectionPrompt)}</p></section><details class="learning-record"><summary>02 / CATATAN BELAJAR · JAVASCRIPT & JQUERY</summary><div class="lesson-list">${lessons.map(([title, copy], i) => `<article><div class="lesson-title"><strong>${esc(title)}</strong><span>${r.outcomes?.[i] ? "✓ TEPAT" : "↻ TINJAU"}</span></div><p>${esc(copy)}</p></article>`).join("")}</div></details><div class="actions"><button class="primary" id="again">SHIFT BARU ↻</button><button id="copy">SALIN HASIL</button><button id="download">UNDUH LAPORAN PNG ↓</button></div><p id="error" role="status"></p></section>`,
      "record-veil",
    );
    document.querySelector("#again").onclick = briefing;
    document.querySelector("#download").onclick = async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await downloadReport(r, run.character);
        document.querySelector("#error").textContent =
          "Laporan berhasil diunduh.";
      } catch (error) {
        alertError(error);
      } finally {
        if (button.isConnected) button.disabled = false;
      }
    };
    document.querySelector("#copy").onclick = async () => {
      try {
        await navigator.clipboard.writeText(info);
        document.querySelector("#error").textContent = "Result copied.";
      } catch {
        document.querySelector("#error").textContent =
          "Clipboard unavailable. Capture this screen instead.";
      }
    };
  } catch (e) {
    shell(
      `<div class="panel"><h2>Verification unavailable.</h2><p>${esc(e.message)}</p><button id="retry">RETRY</button></div>`,
    );
    document.querySelector("#retry").onclick = results;
  }
}
window.addEventListener("blur", () => {
  if (scene && !overlay) pause();
});
window.addEventListener("beforeunload", save);
landing();
