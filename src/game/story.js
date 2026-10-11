export const operators = {
  female: { name: "Allie", role: "Teknisi Sistem", number: "20050730" },
  male: { name: "Noah", role: "Operator Keamanan", number: "20041108" },
};
export const operator = (id) => operators[id === "female" ? "female" : "male"];
const radio = [
  ["Pos 07 di sini. Kartu akses ada di laci. Kami menunggu di luar.", false],
  ["Pasang sekring. Jangan sentuh kabel yang masih menyala.", false],
  [
    "Kamera ketiga menunjukkan EXIT. Jangan percaya gambar yang bergerak sendiri.",
    false,
  ],
  ["Jangan tunggu pemindai. Lari sekarang.", true],
  ["Ada seseorang di balik kaca. Dia tahu namamu.", true],
  ["Unit perawatan masih ingat rute keluar. Kirim dia lebih dulu.", false],
  ["Nyalakan senter. Kami perlu melihat wajahmu.", true],
  ["Pintu terakhir menunggu. Kali ini jangan menoleh.", true],
];
const replies = {
  female: [
    "Kartu dulu. Tanpa otorisasi, terminal ini nggak akan merespons.",
    "Arusnya putus di sini. Satu sekring cukup buat menyalakan generator.",
    "Monitor itu menampilkan koridor yang sama… tapi aku nggak ada di sana.",
    "Bukan suara pos tadi. Aku tunggu lampu pemindai padam.",
    "Tekanannya naik. Tutup katup dulu, baru sentuh terminal.",
    "Rutenya bisa dipulihkan. Robot ini mungkin masih bisa bantu.",
    "Mereka nggak butuh wajahku. Senter mati, loker jadi tempat berlindung.",
    "Sistem terakhir. Setelah segel lepas, aku harus lari.",
  ],
  male: [
    "Kartu akses, lalu cek jalan keluar. Aku nggak suka tempat sesunyi ini.",
    "Gelap bikin patroli susah. Generator ini harus hidup dulu.",
    "Ada bayangan di monitor. Koridor aslinya kosong.",
    "Negatif. Pemindai masih aktif. Aku tunggu celah aman.",
    "Jangan dekat kaca. Katupnya bocor; aku tutup dulu.",
    "Biar robot memeriksa jalurnya sebelum aku lewat.",
    "Itu bukan petugas. Matikan senter, sembunyi kalau dia mendekat.",
    "Buka segelnya. Simpan napas buat lari ke EXIT.",
  ],
};
export function entryLines(room, id) {
  const key = id === "female" ? "female" : "male";
  const [text, suspicious] = radio[room] || radio[0];
  return [
    {
      speaker: suspicious ? "RADIO / SUMBER TAK DIKENAL" : "RADIO / POS 07",
      text,
      suspicious,
      sound: "radio",
    },
    {
      speaker: operator(key).name,
      text: replies[key][room] || replies[key][0],
    },
  ];
}
const recovery = {
  female: [
    "Peta terhubung. Koridornya lebih panjang dari yang kukira.",
    "Generator stabil. Tapi ada beban listrik lain di jaringan ini.",
    "Kamera pulih. Gambar itu bukan rekaman lama.",
    "Kunci terlepas. Pemindainya masih harus dihindari.",
    "Datanya utuh. Nama eksperimennya… NULL-07.",
    "Unitnya merespons. Aku kasih dia rute yang aman.",
    "Sinyalnya milikku sekarang. EXIT ada di ujung koridor.",
    "Akses terbuka. Tinggal segel terakhir.",
  ],
  male: [
    "Peta aktif. Aku tandai jalan ke kanan.",
    "Lampu menyala. Ada langkah yang berhenti bersamaan.",
    "Kamera tersambung. Seseorang mengikutiku.",
    "Gerbang siap. Aku tetap tunggu pemindai padam.",
    "Berkas eksperimen pulih. Mereka nggak pernah meninggalkan fasilitas ini.",
    "Robot aktif. Silakan jalan duluan, kawan.",
    "Jalur EXIT ditemukan. Aku bisa keluar dari sini.",
    "Pintu terbuka. Satu segel, lalu lari.",
  ],
};
export function recoveryLine(room, id) {
  return {
    speaker: operator(id).name,
    text: recovery[id === "female" ? "female" : "male"][room],
  };
}
const tasks = {
  badge: [
    "Kartu masih valid. Siapa yang terakhir pakai ini?",
    "Kartu akses ditemukan. Pintu pertama bisa diperiksa.",
  ],
  power: [
    "Arus kembali. Sekarang generator bisa dipulihkan.",
    "Ada daya. Aku dengar sesuatu di belakang mesin.",
  ],
  camera: [
    "EXIT terlihat. Bayangan itu barusan melihat ke kamera.",
    "Jalur keluar jelas. Aku nggak sendirian di rekaman itu.",
  ],
  release: [
    "Tuasnya lepas. Tunggu pemindai padam sebelum lewat.",
    "Gerbang terbuka. Lampu pemindai yang menentukan waktu lewat.",
  ],
  seal: [
    "Tekanannya turun. Kaca itu seharusnya nggak berembun dari dalam.",
    "Katup tertutup. Ada bekas tangan di sisi dalam kaca.",
  ],
  route: [
    "Robot menuju pintu. Semoga dia nggak berhenti di tengah jalan.",
    "Unit berjalan. Ikuti dia, tapi jaga jarak.",
  ],
  signal: [
    "Frekuensi 07 terkunci. Suara yang lain masih berusaha masuk.",
    "Radio tersambung. Aku tetap nggak percaya suara tadi.",
  ],
  exit: ["Segel lepas. Jangan berhenti sekarang!", "Segel terbuka. Lari!"],
};
export function taskLine(task, id) {
  const text = tasks[task]?.[id === "female" ? 0 : 1];
  return text ? { speaker: operator(id).name, text } : null;
}
export function endingFor(correct, id) {
  const tier = correct === 8 ? 3 : correct >= 6 ? 2 : correct >= 4 ? 1 : 0;
  const endings = [
    {
      title: "Masih ada yang berjaga.",
      facility: "SINYAL ASING MASIH AKTIF",
      tint: 0xb6a3a0,
      allie: "Aku berhasil keluar. Tapi radio di dalam masih memanggil namaku.",
      noah: "Pintunya tertutup. Langkah dari dalam… belum berhenti.",
    },
    {
      title: "Pintu darurat.",
      facility: "FASILITAS DALAM MODE DARURAT",
      tint: 0xcfb590,
      allie:
        "Sistem bertahan cukup lama untuk membuka EXIT. Perbaikannya belum selesai.",
      noah: "Aku keluar lewat jalur darurat. Lampu di dalam masih merah.",
    },
    {
      title: "Sinyal terakhir.",
      facility: "SEBAGIAN BESAR SISTEM STABIL",
      tint: 0xa8c7c2,
      allie:
        "Jaringannya hampir stabil. Aku memutus suara yang bukan milik pos 07.",
      noah: "Radio pos kembali terdengar. Aku mengunci gerbang sebelum suara itu menyusul.",
    },
    {
      title: "Fajar di NULL-07.",
      facility: "SELURUH SISTEM STABIL",
      tint: 0xc7d8b1,
      allie:
        "Delapan sistem stabil. Untuk pertama kalinya, radio benar-benar diam.",
      noah: "Seluruh jalur aman. Pagi datang, dan nggak ada lagi langkah di belakangku.",
    },
  ];
  const end = endings[tier];
  return {
    ...end,
    tier,
    speaker: operator(id).name,
    copy: id === "female" ? end.allie : end.noah,
  };
}
