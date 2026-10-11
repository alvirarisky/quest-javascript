import { createHmac } from "node:crypto";
export function question(state, secret) {
  const i = state.progress,
    hash = createHmac("sha256", secret)
      .update(state.id + ":" + i)
      .digest();
  const n = 10 + (hash[0] % 31),
    m = 45 + (hash[1] % 26);
  const cameras = ["CONTROL", "POWER", "LAB", "EXIT"];
  const target = hash[2] % 4;
  const prop = hash[3] % 2 ? "status" : "name";
  const fn = hash[4] % 2 ? "activateRobot" : "startRobot";
  const templates = [
    {
      title: "SYSTEM BOOT",
      mission: "Nyalakan terminal kontrol fasilitas.",
      instruction:
        "Pilih sintaks JavaScript untuk menulis pesan ke dokumen HTML.",
      code: "// Tampilkan pesan: System online",
      choices: [
        'document.write("System online");',
        'document.print("System online");',
        'message("System online");',
        'alert = "System online";',
      ],
      answer: 0,
      explanation:
        'document.write("System online"); menulis teks ke dokumen HTML.',
      hint: "Fungsi dipanggil dengan nama, tanda kurung, dan argumen.",
    },
    {
      title: "VARIABLE MUTATION",
      mission: "Pulihkan daya generator.",
      instruction: "Klik hasil akhir variabel power.",
      code: `var power = ${n};\npower = power + ${m};\n// Berapa nilai power sekarang?`,
      choices: [String(n + m), String(n), String(m), String(n * m)],
      answer: 0,
      explanation: `Nilai awal ${n} ditambah ${m}, sehingga power menjadi ${n + m}.`,
      hint: "Assignment kedua memakai nilai power sebelumnya.",
    },
    {
      title: "CCTV ARRAY",
      mission: "Hubungkan kamera ke lokasi yang diminta.",
      instruction: `Pilih indeks untuk kamera ${cameras[target]}.`,
      code: `var cameras = ["CONTROL", "POWER", "LAB", "EXIT"];\n// cameras[?] → "${cameras[target]}"`,
      choices: ["0", "1", "2", "3"],
      answer: target,
      explanation: `Indeks array dimulai dari 0. ${cameras[target]} berada di indeks ${target}.`,
      hint: "Elemen pertama memiliki indeks 0.",
    },
    {
      title: "SECURITY LOGIC",
      mission: "Evaluasi izin akses gerbang.",
      instruction: "Pilih teks yang ditampilkan oleh kode berikut.",
      code: `var access = "${n % 2 ? "operator" : "guest"}";\nif (access === "operator") {\n  document.write("OPEN");\n} else {\n  document.write("LOCKED");\n}`,
      choices: ["OPEN", "LOCKED", "25", "Tidak ada pesan"],
      answer: n % 2 ? 0 : 1,
      explanation: `access adalah ${n % 2 ? "operator" : "guest"}. Perbandingan === dengan operator bernilai ${n % 2 ? "true" : "false"}, sehingga hasilnya ${n % 2 ? "OPEN" : "LOCKED"}.`,
      hint: "Operator === membandingkan nilai dan tipe data.",
    },
    {
      title: "OBJECT EXPERIMENT",
      mission: "Baca property objek eksperimen.",
      instruction: `Pilih akses property ${prop} menggunakan notasi titik.`,
      code: 'var experiment = {\n  name: "NULL",\n  status: "stable"\n};',
      choices: [
        `experiment.${prop}`,
        `experiment(${prop})`,
        `experiment->${prop}`,
        `${prop}.experiment`,
      ],
      answer: 0,
      explanation: `experiment.${prop} mengakses property ${prop} melalui notasi titik.`,
      hint: "Notasi titik: namaObjek.namaProperty.",
    },
    {
      title: "FUNCTION REACTOR",
      mission: "Aktifkan robot perawatan.",
      instruction: "Pilih pemanggilan fungsi tanpa argumen.",
      code: `function ${fn}() {\n  return "ROBOT ONLINE";\n}`,
      choices: [`${fn}();`, `function ${fn};`, `${fn};`, `call.${fn};`],
      answer: 0,
      explanation: `${fn}(); memanggil fungsi. Nama fungsi tanpa tanda kurung hanya merujuk fungsi tersebut.`,
      hint: "Pemanggilan memerlukan tanda kurung, meskipun tanpa argumen.",
    },
    {
      title: "JQUERY CONTROL",
      mission: "Pilih panel surveillance berdasarkan ID.",
      instruction:
        'Pilih ekspresi jQuery untuk elemen dengan id="surveillance".',
      code: '<div id="surveillance">OFFLINE</div>',
      choices: [
        '$("#surveillance")',
        '$(".surveillance")',
        '$("surveillance")',
        '$("@surveillance")',
      ],
      answer: 0,
      explanation:
        "Selector # memilih ID. Selector . memilih class, sedangkan nama tanpa awalan memilih tag.",
      hint: "ID memakai awalan # pada selector CSS/jQuery.",
    },
    {
      title: "FINAL ESCAPE",
      mission: "Hilangkan gangguan, tampilkan pintu, lalu animasikan sinyal.",
      instruction:
        "Pilih satu rangkaian perintah. Seluruh rangkaian adalah satu jawaban bernilai.",
      code: "// #corruption: terlihat\n// #exit: tersembunyi\n// #signal: height 20px",
      choices: [
        '$("#corruption").hide();\n$("#exit").show();\n$("#signal").animate({height: "toggle"});',
        '$("#corruption").show();\n$("#exit").hide();\n$("#signal").animate({height: "toggle"});',
        '$("#corruption").hide;\n$("#exit").show;\n$("#signal").animate;',
        '$("#corruption").hide();\n$("#exit").show();\n$("#signal").hide();',
      ],
      answer: 0,
      explanation:
        'hide() menyembunyikan gangguan, show() menampilkan pintu, dan animate({height: "toggle"}) mengubah tinggi elemen dengan efek toggle, sesuai contoh Modul 6.',
      hint: "Method harus dipanggil dengan (). hide dan show memiliki efek berlawanan.",
    },
  ];
  const q = templates[i];
  if (!q) return null;
  const options = q.choices.map((label, j) => ({
    id: createHmac("sha256", secret)
      .update(state.id + ":" + i + ":choice:" + j)
      .digest("hex")
      .slice(0, 16),
    label,
  }));
  // Deterministic Fisher-Yates, no answer-position field in public payload.
  for (let j = options.length - 1; j > 0; j--) {
    const k = hash[10 + j] % (j + 1);
    [options[j], options[k]] = [options[k], options[j]];
  }
  return { ...q, options };
}
export function publicQuestion(q) {
  const { answer, explanation, choices, ...visible } = q;
  return visible;
}
