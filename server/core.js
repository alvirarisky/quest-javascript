import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { question, publicQuestion } from "./questions.js";
const MAX_AGE = 7 * 24 * 3600 * 1000;
export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32)
    throw new ApiError("Server belum dikonfigurasi.", 503);
  return s;
}
function sign(state) {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return (
    payload +
    "." +
    createHmac("sha256", secret()).update(payload).digest("base64url")
  );
}
function verify(token) {
  if (typeof token !== "string" || token.length > 6000)
    throw new ApiError("Session tidak valid.", 401);
  const [payload, sig, ...extra] = token.split(".");
  if (!payload || !sig || extra.length)
    throw new ApiError("Session tidak valid.", 401);
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const actual = Buffer.from(sig, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new ApiError("Session tidak valid.", 401);
  let s;
  try {
    s = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    throw new ApiError("Session tidak valid.", 401);
  }
  if (
    s.v !== 1 ||
    !Number.isInteger(s.progress) ||
    s.progress < 0 ||
    s.progress > 8 ||
    !Array.isArray(s.answers) ||
    s.answers.length !== s.progress ||
    Date.now() - s.started > MAX_AGE
  )
    throw new ApiError("Session kedaluwarsa atau tidak valid.", 401);
  return s;
}
function packageState(s) {
  return {
    token: sign(s),
    progress: s.progress,
    identity: s.identity,
    reflection: s.reflection || "",
    started: s.started,
    complete: s.progress === 8,
  };
}
export function dispatch(action, body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Buffer.byteLength(JSON.stringify(body)) > 8192
  )
    throw new ApiError("Payload tidak valid.");
  if (action === "session") {
    const identity = {};
    for (const key of ["name", "nim", "kelas"]) {
      if (
        typeof body[key] !== "string" ||
        !body[key].trim() ||
        body[key].length > 80
      )
        throw new ApiError(
          "Lengkapi Nama, NIM, dan Kelas (maksimal 80 karakter).",
        );
      identity[key] = body[key].trim();
    }
    const reflection = body.reflection === undefined ? "" : body.reflection;
    if (
      typeof reflection !== "string" ||
      (reflection !== "" &&
        (reflection.trim().length < 20 || reflection.length > 600))
    )
      throw new ApiError("Tulis refleksi pribadi sepanjang 20–600 karakter.");
    return packageState({
      v: 1,
      id: randomUUID(),
      identity,
      reflection: reflection.trim(),
      progress: 0,
      answers: [],
      started: Date.now(),
    });
  }
  const s = verify(body.token);
  if (action === "resume") return packageState(s);
  if (action === "question") {
    if (body.puzzle !== s.progress || s.progress === 8)
      throw new ApiError("Urutan sistem tidak valid.", 409);
    return { puzzle: s.progress, ...publicQuestion(question(s, secret())) };
  }
  if (action === "answer") {
    if (body.puzzle !== s.progress || s.progress === 8)
      throw new ApiError("Urutan sistem tidak valid.", 409);
    if (typeof body.option !== "string" || !/^[a-f0-9]{16}$/.test(body.option))
      throw new ApiError("Jawaban tidak valid.");
    const q = question(s, secret());
    const chosen = q.options.find((o) => o.id === body.option);
    if (!chosen) throw new ApiError("Pilihan tidak valid.");
    const correct = chosen.label === q.choices[q.answer];
    s.answers.push(correct);
    s.progress++;
    if (s.progress === 8) s.completed = Date.now();
    // A failed first submission still repairs the system after feedback acknowledgement.
    return {
      ...packageState(s),
      correct,
      explanation: q.explanation,
      repair: q.choices[q.answer],
    };
  }
  if (action === "result") {
    if (s.progress !== 8)
      throw new ApiError("Selesaikan delapan sistem terlebih dahulu.", 409);
    const correct = s.answers.filter(Boolean).length;
    return {
      identity: s.identity,
      reflection: s.reflection || "",
      outcomes: s.answers,
      correct,
      total: 8,
      score: (correct / 8) * 100,
      status: "COMPLETE",
      started: s.started,
      completed: s.completed,
      rank:
        correct === 8
          ? "PENJAGA NULL-07"
          : correct >= 6
            ? "PEMULIH SISTEM"
            : correct >= 4
              ? "OPERATOR MALAM"
              : "PENYINTAS PEMULA",
      rankDescription:
        correct === 8
          ? "Delapan sistem pulih pada percobaan pertama. Kamu membaca kode dengan cermat."
          : correct >= 6
            ? "Sebagian besar sistem pulih pada percobaan pertama. Tinjau kembali bagian yang sempat terganggu."
            : correct >= 4
              ? "Kamu menemukan jalan keluar sambil belajar dari perbaikan. Beberapa konsep masih perlu dilatih."
              : "Kamu menyelesaikan shift dengan bantuan perbaikan. Gunakan catatan belajar untuk percobaan berikutnya.",
    };
  }
  throw new ApiError("Endpoint tidak ditemukan.", 404);
}
