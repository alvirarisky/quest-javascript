import { operator, endingFor } from "./story.js";
import { lessons, reflectionPrompt } from "./learning.js";
function wrap(ctx, text, width) {
  const lines = [];
  for (const paragraph of String(text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (ctx.measureText(word).width > width) {
        if (line) lines.push(line);
        line = "";
        for (const char of word) {
          if (line && ctx.measureText(line + char).width > width) {
            lines.push(line);
            line = "";
          }
          line += char;
        }
      } else {
        const next = line ? line + " " + word : word;
        if (line && ctx.measureText(next).width > width) {
          lines.push(line);
          line = word;
        } else line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}
export async function reportImage(result, character) {
  await document.fonts.ready;
  const mc = operator(character),
    end = endingFor(result.correct, character);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  let ctx = canvas.getContext("2d");
  ctx.font = '26px "Source Sans 3"';
  const essay = wrap(
    ctx,
    result.reflection || "Sesi lama ini belum memiliki esai awal.",
    1056,
  );
  ctx.font = '22px "Source Sans 3"';
  const notes = lessons.map(([title, text], i) => ({
    title,
    pass: result.outcomes?.[i],
    lines: wrap(ctx, text, 1056),
  }));
  ctx.font = '24px "Source Sans 3"';
  const identityLines = [
    `NAMA  ${result.identity.name}`,
    `NIM  ${result.identity.nim}`,
    `KELAS  ${result.identity.kelas}`,
  ].flatMap((value) => wrap(ctx, value, 1056));
  canvas.height =
    1250 +
    identityLines.length * 34 +
    essay.length * 36 +
    notes.reduce((height, n) => height + 60 + n.lines.length * 30, 0);
  ctx = canvas.getContext("2d");
  ctx.fillStyle = "#141a1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#dca766";
  ctx.fillRect(0, 0, canvas.width, 8);
  const text = (
    value,
    x,
    y,
    font = '24px "Source Sans 3"',
    color = "#e5eaed",
  ) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(String(value), x, y);
  };
  const rule = (y) => {
    ctx.fillStyle = "#39444c";
    ctx.fillRect(72, y, 1056, 1);
  };
  text("NULL—07 / LAPORAN SHIFT", 72, 65, '20px "Source Sans 3"', "#aebbc3");
  text("06:00 AM", 1010, 65, '20px "Source Sans 3"', "#aebbc3");
  rule(90);
  text("KAMU BERHASIL KELUAR.", 72, 165, '52px "Oswald"');
  const img = new Image();
  img.src = `/assets/characters/${character === "female" ? "female" : "male"}-sprite.png`;
  await img.decode();
  ctx.fillStyle = "#28343d";
  ctx.fillRect(72, 202, 120, 150);
  ctx.drawImage(
    img,
    character === "female" ? 160 : 200,
    0,
    256,
    320,
    72,
    202,
    120,
    150,
  );
  text(mc.name, 215, 244, '34px "Oswald"');
  text(mc.role, 215, 279, '22px "Source Sans 3"', "#aebbc3");
  text(`ID ${mc.number}`, 215, 316, '22px "Source Sans 3"', "#aebbc3");
  let y = 397;
  for (const line of identityLines) {
    text(line, 72, y, '24px "Source Sans 3"');
    y += 34;
  }
  const elapsed = Math.max(
    0,
    Math.floor((result.completed - result.started) / 1000),
  );
  text(
    `COMPLETE    /    ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`,
    72,
    y + 7,
    '22px "Source Sans 3"',
    "#aebbc3",
  );
  text(`${result.score}/100`, 820, 277, '62px "Oswald"', "#e6b770");
  text(
    `${result.correct} / 8 JAWABAN PERTAMA TEPAT`,
    720,
    322,
    '21px "Source Sans 3"',
  );
  y += 48;
  rule(y);
  y += 48;
  text(result.rank, 72, y, '28px "Oswald"', "#e6b770");
  ctx.font = '22px "Source Sans 3"';
  const description = wrap(ctx, result.rankDescription || "", 1056);
  y += 37;
  for (const line of description) {
    text(line, 72, y, '22px "Source Sans 3"', "#aebbc3");
    y += 30;
  }
  y += 28;
  text(end.title.toUpperCase(), 72, y, '30px "Oswald"');
  y += 36;
  ctx.font = '24px "Source Sans 3"';
  for (const line of wrap(ctx, `${mc.name}: ${end.copy}`, 1056)) {
    text(line, 72, y);
    y += 32;
  }
  y += 14;
  text(end.facility, 72, y, '18px "Source Sans 3"', "#dca766");
  y += 30;
  rule(y);
  y += 45;
  text("01 / CATATAN SEBELUM SHIFT", 72, y, '22px "Oswald"', "#dca766");
  y += 44;
  for (const line of essay) {
    text(line, 72, y, '26px "Source Sans 3"');
    y += 36;
  }
  ctx.font = '20px "Source Sans 3"';
  y += 20;
  for (const line of wrap(ctx, reflectionPrompt, 1056)) {
    text(line, 72, y, '20px "Source Sans 3"', "#aebbc3");
    y += 28;
  }
  y += 24;
  rule(y);
  y += 44;
  text("02 / CATATAN BELAJAR", 72, y, '22px "Oswald"', "#dca766");
  y += 40;
  for (const note of notes) {
    text(
      `${note.title}  /  ${note.pass ? "TEPAT" : "TINJAU"}`,
      72,
      y,
      '24px "Oswald"',
    );
    y += 34;
    for (const line of note.lines) {
      text(line, 72, y, '22px "Source Sans 3"', "#aebbc3");
      y += 30;
    }
    y += 26;
  }
  rule(y);
  text(
    "THE LAST SHIFT / QUEST-JAVASCRIPT.VERCEL.APP",
    72,
    y + 40,
    '18px "Source Sans 3"',
    "#aebbc3",
  );
  // Trim spare layout space after the complete record has been drawn.
  const output = document.createElement("canvas");
  output.width = 1200;
  output.height = y + 75;
  output.getContext("2d").drawImage(canvas, 0, 0);
  return new Promise((resolve, reject) =>
    output.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Gambar hasil gagal dibuat.")),
      "image/png",
    ),
  );
}
export function reportFilename(identity) {
  const safe = (value) =>
    String(value)
      .replace(/[^\p{L}\p{N}_-]/gu, "")
      .slice(0, 80) || "Operator";
  return `QJS_${safe(identity.nim)}_${safe(identity.name)}.png`;
}
export async function downloadReport(result, character) {
  const blob = await reportImage(result, character);
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = reportFilename(result.identity);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
