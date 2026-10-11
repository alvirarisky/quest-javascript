import $ from "jquery";
import { rooms, effects } from "./game/metadata.js";
import { api } from "./services/api.js";
import "./style.css";
const ui = document.querySelector("#ui");
const KEY = "null07-run";
let run = null,
  scene = null,
  overlay = true,
  currentRoom = 0,
  soundOn = false,
  ctx = null,
  lastSave = 0,
  pending = null;
try {
  run = JSON.parse(localStorage.getItem(KEY));
} catch {}
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
function tone(kind) {
  if (!soundOn) return;
  try {
    ctx ||= new AudioContext();
    ctx.resume();
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = kind === "step" ? "triangle" : "sine";
    o.frequency.value =
      kind === "step"
        ? 65
        : kind === "unlock"
          ? 330
          : kind === "haunt"
            ? 38
            : 180;
    g.gain.setValueAtTime(kind === "step" ? 0.035 : 0.055, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  } catch {}
}
function shell(content, cls = "") {
  document.querySelector(".toast")?.remove();
  overlay = true;
  if (scene) {
    scene.blocked = true;
    scene.physics.pause();
    scene.time.paused = true;
  }
  ui.innerHTML = `<div class="veil ${cls}">${content}</div>`;
  ui.querySelector("button,input")?.focus();
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
  ui.innerHTML = `<header class="hud"><div class="brand">N<span>∅</span>LL–07 <small>RESEARCH FACILITY</small></div><div class="location"><span id="sector">SECTOR 0${currentRoom + 1}</span><strong id="room">${rooms[currentRoom]}</strong></div><div class="hud-right"><span id="clock">${clock()}</span><button id="audio" aria-label="Toggle sound">SOUND ${soundOn ? "ON" : "OFF"}</button><button id="pause">Ⅱ PAUSE</button></div></header><div class="mission"><span class="status-dot"></span><div><small>EMERGENCY PROTOCOL</small><p>${run.progress === 8 ? "EXIT-07 unlocked. Walk right to the exit." : "Restore the corrupted systems."}</p></div><b>${run.progress}<span> / 8</span></b></div><div class="map" aria-label="Facility progress">${rooms.map((r, i) => `<span class="${i < run.progress ? "done" : i === currentRoom ? "active" : ""}" title="${r}">${String(i + 1).padStart(2, "0")}</span>`).join("")}<small>FACILITY SYSTEMS</small></div><footer class="controls"><span><kbd>A</kbd><kbd>D</kbd> MOVE</span><span><kbd>E</kbd> INTERACT</span><span><kbd>ESC</kbd> PAUSE</span><em>Nothing moves while a terminal is open.</em></footer><div class="touch"><button id="left">◀</button><button id="interact">E</button><button id="right">▶</button></div>`;
  document.querySelector("#audio").onclick = () => {
    soundOn = !soundOn;
    tone("terminal");
    document.querySelector("#audio").textContent =
      "SOUND " + (soundOn ? "ON" : "OFF");
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
  document.querySelector("#interact").onclick = () => scene.interact();
  if (scene) {
    scene.blocked = false;
    scene.physics.resume();
    scene.time.paused = false;
    scene.keys && Object.values(scene.keys).forEach((k) => k.reset());
    scene.touch = 0;
  }
}
function landing() {
  shell(
    `<div class="topline"><span>NULL-07 / RESTRICTED ACCESS</span><span>WEB PROGRAMMING · MODULE 06</span></div><main class="landing"><div class="eyebrow"><span class="status-dot"></span> AN EDUCATIONAL HORROR EXPERIENCE</div><p class="overline">JAVASCRIPT</p><h1>THE LAST<br><span>SHIFT</span><i>07</i></h1><div class="subtitle"><span></span> ESCAPE FROM NULL-07</div><p class="intro">03:00 AM. The power is gone. The doors are locked.<br>Eight corrupted systems. One way out.<br><b>You’re the only operator still here.</b></p><div class="actions"><button class="primary" id="start">${run ? "CONTINUE SHIFT" : "BEGIN YOUR SHIFT"} <span>→</span></button>${run ? '<button id="new">NEW SHIFT</button>' : ""}</div><p class="landing-controls"><kbd>A</kbd><kbd>D</kbd> MOVE <span> / </span><kbd>E</kbd> INTERACT <span> / </span> HEADPHONES RECOMMENDED</p></main><div class="landing-note"><span class="red">● SYSTEM FAILURE</span><p>EXIT ACCESS DENIED<br>RESTORE 8 CORRUPTED SYSTEMS</p><small>NO TIME LIMIT. KEEP YOUR COMPOSURE.</small></div><footer class="landing-footer"><span>JAVASCRIPT & JQUERY / PRACTICUM QUEST</span><span>03:00 — 06:00</span></footer>`,
    "landing-veil",
  );
  document.querySelector("#start").onclick = () =>
    run ? resume() : identity();
  document.querySelector("#new")?.addEventListener("click", identity);
}
function identity() {
  shell(
    `<div class="panel registration"><div class="panel-top"><span>PERSONNEL TERMINAL</span><span>NULL-07</span></div><small class="eyebrow">NIGHT SHIFT / OPERATOR REGISTRATION</small><h2>Identify yourself.</h2><p>Your shift record will appear on the completion screen.</p><form id="identity"><label>Nama Lengkap<input name="name" required maxlength="80" autocomplete="name" placeholder="Nama lengkap"></label><div class="form-row"><label>NIM<input name="nim" required maxlength="80" placeholder="Nomor induk mahasiswa"></label><label>Kelas<input name="kelas" required maxlength="80" placeholder="Contoh: TI-2A"></label></div><p id="error" role="alert"></p><button class="primary" type="submit">ENTER THE FACILITY <span>→</span></button></form><button class="text-button" id="back">← BACK</button><div class="fine">8 systems · Unlimited replay · No time limit</div></div>`,
  );
  document.querySelector("#back").onclick = landing;
  document.querySelector("#identity").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.submitter;
    button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(e.target));
      run = { ...(await api("session", data)), x: 180 };
      pending = null;
      save();
      await enter();
    } catch (err) {
      alertError(err);
      button.disabled = false;
    }
  };
}
async function resume() {
  try {
    const state = await api("resume", { token: run.token });
    run = { ...run, ...state };
    save();
    if (run.complete) return results();
    await enter();
  } catch (e) {
    shell(
      `<div class="panel"><h2>Session unavailable.</h2><p>${esc(e.message)}</p><button class="primary" id="restart">START A NEW SHIFT</button></div>`,
    );
    document.querySelector("#restart").onclick = identity;
  }
}
async function enter() {
  if (scene) {
    scene.applyProgress();
    scene.restore(run.x);
    scene.ending = false;
    hud();
    toast("A / D untuk berjalan. Dekati terminal, lalu tekan E.");
    return;
  }
  shell(
    '<div class="panel"><p class="eyebrow">FACILITY BOOT SEQUENCE</p><h2>Entering NULL-07…</h2><p>Loading environment and operator.</p></div>',
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
        toast("A / D untuk berjalan. Dekati terminal, lalu tekan E.");
      },
      progress: () => run?.progress || 0,
      reduced: () => reduced,
      sound: tone,
      room: (i) => {
        currentRoom = i;
        if (!overlay) {
          document.querySelector("#sector").textContent = "SECTOR 0" + (i + 1);
          document.querySelector("#room").textContent = rooms[i];
          document
            .querySelectorAll(".map>span")
            .forEach((el, j) => el.classList.toggle("active", j === i));
        }
      },
      position: (x) => {
        if (run) {
          run.x = x;
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
      finish: results,
    }),
  });
}
function pause() {
  save();
  shell(
    `<div class="panel pause-panel"><small class="eyebrow">SHIFT SUSPENDED</small><h2>Take a breath.</h2><p>The facility waits. Your progress is saved.</p><button class="primary" id="resume">RESUME SHIFT <span>→</span></button><label class="check"><input type="checkbox" id="motion" ${reduced ? "checked" : ""}> Reduce environmental motion</label><button id="restart">RESTART GAME</button><button class="text-button" id="menu">MAIN MENU</button><div class="fine">Restart opens registration for a new session.</div></div>`,
  );
  document.querySelector("#resume").onclick = hud;
  document.querySelector("#motion").onchange = (e) =>
    (reduced = e.target.checked);
  document.querySelector("#restart").onclick = identity;
  document.querySelector("#menu").onclick = landing;
}
async function terminal(i) {
  if (i < run.progress) {
    toast("SYSTEM ONLINE / " + effects[i]);
    return;
  }
  if (i !== run.progress) {
    toast("Pulihkan sistem sebelumnya terlebih dahulu.");
    return;
  }
  tone("terminal");
  shell('<div class="panel"><p>ESTABLISHING SECURE CONNECTION…</p></div>');
  try {
    const q = await api("question", { token: run.token, puzzle: i });
    shell(
      `<section class="panel terminal"><div class="panel-top"><span>NULL-07 / SECURE TERMINAL</span><button id="close" aria-label="Close terminal">✕</button></div><div class="terminal-heading"><div><small class="eyebrow">SYSTEM ${String(i + 1).padStart(2, "0")} / ${rooms[i]}</small><h2>${esc(q.title)}</h2></div><span class="offline">● CORRUPTED</span></div><div class="mission-copy"><b>MISSION</b> ${esc(q.mission)}</div><p class="instruction"><b>CARA MAIN</b> ${esc(q.instruction)} Klik jawaban, lalu VALIDATE.</p><pre><code>${esc(q.code)}</code></pre>${i === 7 ? '<div class="effect-demo"><span id="corruption">CORRUPTION</span><span id="exit" style="display:none">EXIT ONLINE</span><span id="signal" style="height:20px;overflow:hidden">● SIGNAL</span></div>' : ""}<form id="answer"><fieldset><legend class="sr-only">Pilih jawaban</legend>${q.options.map((o, j) => `<label class="option"><input type="radio" name="option" value="${esc(o.id)}" required><span class="option-letter">${String.fromCharCode(65 + j)}</span><code>${esc(o.label)}</code></label>`).join("")}</fieldset><p id="error" role="alert"></p><div class="terminal-actions"><button type="button" id="hint">? SHOW HINT</button><button class="primary" type="submit">VALIDATE <span>↵</span></button></div></form><p id="hint-copy" class="hint" hidden>${esc(q.hint)}</p><div class="fine">Only your first submitted answer is scored. A wrong answer never blocks escape.</div></section>`,
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
    `<section class="panel terminal feedback"><div class="panel-top"><span>SYSTEM ${String(i + 1).padStart(2, "0")} / DIAGNOSTIC REPORT</span><span>${a.correct ? "VERIFIED" : "REPAIR ASSIST"}</span></div><span class="feedback-symbol">${a.correct ? "✓" : "↻"}</span><h2>${a.correct ? "Correct. System restored." : "Answer recorded. Let’s repair it."}</h2><p>${esc(a.explanation)}</p><pre><code>${esc(a.repair)}</code></pre><p class="world-effect">${effects[i]}</p>${i === 4 ? '<details class="prototype-note"><summary>FIELD NOTE / PROTOTYPE BASICS (not scored)</summary><pre><code>var original = { status: &quot;stable&quot; };\nvar clone = Object.create(original);\nclone.status; // &quot;stable&quot;</code></pre><p>Object.create(original) membuat objek baru yang mewarisi property dari original, seperti contoh mobil dan truk pada Modul 6.3.3.</p></details>' : ""}${i === 7 ? '<div class="effect-demo"><span id="corruption">CORRUPTION</span><span id="exit" style="display:none">EXIT ONLINE</span><span id="signal" style="height:20px;overflow:hidden">● SIGNAL</span></div>' : ""}<button class="primary" id="continue">${i === 7 ? "UNLOCK EXIT-07" : "RESTORE & CONTINUE"} <span>→</span></button><div class="fine">${a.correct ? "First answer: correct." : "First answer: incorrect. Repair assistance does not change your score."}</div></section>`,
  );
  if (i === 7) {
    $("#corruption").hide(reduced ? 0 : 700);
    $("#exit").show(reduced ? 0 : 700);
    $("#signal").animate({ height: "toggle" }, reduced ? 0 : 1000);
  }
  document.querySelector("#continue").onclick = () => {
    scene.applyProgress();
    hud();
    tone("unlock");
    toast(effects[i]);
    if (i === 2 || i === 4) scene.haunt();
  };
}
async function results() {
  save();
  shell('<div class="panel"><h2>Verifying shift record…</h2></div>');
  try {
    const r = await api("result", { token: run.token });
    const mins = Math.floor((r.completed - r.started) / 60000),
      seconds = Math.floor((r.completed - r.started) / 1000) % 60;
    const info = `Nama: ${r.identity.name}\nNIM: ${r.identity.nim}\nKelas: ${r.identity.kelas}\nCorrect: ${r.correct}/8\nNilai: ${r.score}\nStatus: COMPLETE\nCompletion: ${mins}m ${seconds}s`;
    shell(
      `<section class="panel result"><div class="panel-top"><span>NULL-07 / VERIFIED SHIFT RECORD</span><span>06:00 AM</span></div><small class="eyebrow">JAVASCRIPT & JQUERY QUEST COMPLETE</small><h2>YOU SURVIVED<br><span>THE LAST SHIFT.</span></h2><div class="result-body"><div class="identity-result"><label>NAMA<strong>${esc(r.identity.name)}</strong></label><div class="form-row"><label>NIM<strong>${esc(r.identity.nim)}</strong></label><label>KELAS<strong>${esc(r.identity.kelas)}</strong></label></div><label>STATUS<strong class="green">● COMPLETE</strong></label><label>COMPLETION TIME<strong>${mins}m ${seconds}s</strong></label></div><div class="score"><small>FINAL SCORE</small><strong>${r.score}<span>/100</span></strong><p>${r.correct} / 8 FIRST ANSWERS CORRECT</p><div class="rank">${r.rank}</div></div></div><div class="result-note">Capture this screen for your Google Forms submission.</div><div class="actions"><button class="primary" id="again">PLAY AGAIN <span>↻</span></button><button id="copy">COPY RESULT</button></div><p id="error" role="status"></p></section>`,
    );
    document.querySelector("#again").onclick = identity;
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
