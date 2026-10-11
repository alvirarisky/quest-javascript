// These environmental interactions are unscored. Assessment stays server-side.
export const tasks = [
  {
    id: "badge",
    room: 0,
    phase: "before",
    x: 340,
    kind: "pickup",
    texture: "drawer",
    prompt: "Ambil kartu akses",
    goal: "Cari kartu akses di laci operator.",
  },
  {
    id: "fuse",
    room: 1,
    phase: "before",
    x: 260,
    kind: "pickup",
    texture: "fusebox",
    prompt: "Ambil sekring",
    goal: "Ambil sekring cadangan dari kabinet.",
  },
  {
    id: "power",
    room: 1,
    phase: "before",
    x: 570,
    kind: "install",
    texture: "fusebox",
    prompt: "Pasang sekring",
    goal: "Pasang sekring pada generator.",
  },
  {
    id: "camera",
    room: 2,
    phase: "after",
    x: 480,
    kind: "camera",
    texture: "terminal",
    prompt: "Periksa kamera EXIT",
    goal: "Temukan jalur keluar melalui monitor CCTV.",
  },
  {
    id: "release",
    room: 3,
    phase: "after",
    x: 1110,
    kind: "lever",
    texture: "lever",
    prompt: "Tarik tuas darurat",
    goal: "Tarik tuas pelepas di dekat gerbang.",
  },
  {
    id: "seal",
    room: 4,
    phase: "before",
    x: 600,
    kind: "hold",
    texture: "valve",
    prompt: "Tahan E · tutup katup",
    goal: "Tutup kebocoran: tahan E pada katup.",
  },
  {
    id: "route",
    room: 5,
    phase: "after",
    x: 400,
    kind: "robot",
    texture: "robot",
    prompt: "Kirim robot ke gerbang",
    goal: "Aktifkan perjalanan robot untuk membuka jalur.",
  },
  {
    id: "signal",
    room: 6,
    phase: "before",
    x: 530,
    kind: "dial",
    texture: "dial",
    prompt: "Putar dial · kanal 07",
    goal: "Atur antena ke kanal 07 dengan E.",
  },
  {
    id: "exit",
    room: 7,
    phase: "after",
    x: 1080,
    kind: "hold",
    texture: "lever",
    prompt: "Tahan E · buka segel EXIT",
    goal: "Lepaskan segel EXIT: tahan E pada tuas.",
  },
];
const ids = new Set(tasks.map((t) => t.id));
export function worldState(saved, progress = 0) {
  const legacy = !saved || saved.version !== 1;
  return {
    version: 1,
    retreats: Math.max(
      0,
      Math.min(999, Math.floor(Number(saved?.retreats) || 0)),
    ),
    done: legacy
      ? tasks.filter((t) => t.room < progress).map((t) => t.id)
      : [
          ...new Set(
            (Array.isArray(saved.done) ? saved.done : []).filter((id) =>
              ids.has(id),
            ),
          ),
        ],
    inventory: legacy
      ? []
      : (Array.isArray(saved.inventory) ? saved.inventory : []).filter(
          (i) => i === "fuse",
        ),
    dial: legacy ? 0 : Math.max(0, Math.min(2, Number(saved.dial) || 0)),
    scares: legacy
      ? []
      : (Array.isArray(saved.scares) ? saved.scares : []).filter((i) =>
          ["camera", "glass", "exit"].includes(i),
        ),
  };
}
export function nextTask(room, progress, state) {
  return tasks.find(
    (t) =>
      t.room === room &&
      !state.done.includes(t.id) &&
      (t.phase === "before" || progress > room),
  );
}
export function terminalReady(room, state) {
  return tasks
    .filter((t) => t.room === room && t.phase === "before")
    .every((t) => state.done.includes(t.id));
}
export function passageReady(room, progress, state) {
  return (
    room < progress &&
    tasks.filter((t) => t.room === room).every((t) => state.done.includes(t.id))
  );
}
export function completeTask(state, id) {
  if (!ids.has(id)) throw new Error("Unknown environmental task");
  if (!state.done.includes(id)) state.done.push(id);
}
export const channels = ["13", "03", "07"];
