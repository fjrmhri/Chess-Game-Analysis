# Prompt Claude Code — Telaah (dari nol sampai akhir)

## Cara pakai

1. Buka terminal di `D:\KULIAH\Project Lokal\Chess Review`, jalankan `claude`. Berkas `CLAUDE.md` dibaca otomatis; `docs/BLUEPRINT-RINGKAS.md` dirujuk oleh setiap prompt.
2. Kerjakan prompt berurutan. Satu prompt = satu sesi kerja. Mulai sesi baru (konteks bersih) di setiap prompt besar agar konteks tidak membengkak; kesinambungan dijaga oleh CLAUDE.md, dokumen, dan git.
3. Untuk prompt bertanda [RENCANA], minta rencana dulu (mode plan bila tersedia), setujui, baru eksekusi.
4. Jangan lanjut jika kriteria lulus gagal. Tempel output kegagalan ke sesi yang sama, atau pakai prompt U1 (debugging).
5. Langkah yang hanya bisa Anda lakukan ditandai [MANUAL].

Peta fase:

| Fase | Prompt | Hasil |
|---|---|---|
| 0 Persiapan | M0, P0 | Lingkungan siap, proyek diperiksa |
| 1 Fondasi | P1, P2 | Kerangka proyek, design system neo-brutalism |
| 2 PoC modul | P3, P4, P5, P6, P7 | API, engine, data, pipeline, penilaian MVP |
| 3 MVP UI | P8, P9 | Daftar game dan halaman review |
| 4 Kemiripan | P10, P11 | Brilliant/Great/Miss/Book, accuracy, rating, kalibrasi |
| 5 Analysis board | P12 | Variasi bebas dengan label instan |
| 6 Tips | P13 | Tips berbahasa Indonesia dari engine |
| 7 Rilis pribadi | P14, P15, P16 | Pengaturan/ekspor, deploy, QA akhir |
| Utilitas | U1–U3 | Debug, review, perbaikan tampilan |

---

## Fase 0 — Persiapan

### M0 [MANUAL] — Sebelum prompt pertama

- Pasang Node.js LTS dan Git (cek `node -v`, `npm -v`, `git --version` di terminal).
- Buat repo GitHub kosong (privat boleh) dan akun Cloudflare gratis. Belum perlu dihubungkan.
- Salin `CLAUDE.md` dan folder `docs/` ke folder proyek (sudah ada bila berkas ini dibuat di sana).
- Siapkan nama pengguna chess.com Anda untuk uji, dan catat spesifikasi laptop (CPU, RAM) serta model HP.

### P0 — Pemeriksaan awal

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md sampai selesai.

Tugas (belum menulis kode aplikasi):
1. Periksa lingkungan: versi node, npm, git, OS, dan isi folder kerja. Laporkan apa adanya.
2. Jika folder bukan repo git, jalankan git init, buat .gitignore untuk Node/Vite, dan commit awal berisi CLAUDE.md dan docs/.
3. Ringkas pemahamanmu dalam maksimal 10 poin: tujuan, batasan, stack, aturan arsitektur, tema desain.
4. Sebutkan hal di blueprint yang menurutmu ambigu, bertentangan, atau berisiko, beserta usulan keputusan. Maksimal 3 pertanyaan untuk saya, hanya yang benar-benar memblokir.

Jangan memasang dependensi dan jangan membuat berkas selain .gitignore. Ikuti "Penutup standar" kecuali npm run periksa (belum ada).
```

Kriteria lulus: laporan versi lingkungan, commit awal ada, daftar ambiguitas masuk akal.

---

## Fase 1 — Fondasi

### P1 — Kerangka proyek [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md.

Buat kerangka proyek di folder ini (bukan subfolder):
- Vite + React + TypeScript strict. Verifikasi versi terbaru yang stabil dengan npm view sebelum memasang; sebutkan versi yang dipakai.
- Dependensi: react-router, chess.js, react-chessboard, recharts, dexie. Dev: vitest, @testing-library/react, jsdom, eslint (+ konfigurasi TypeScript/React), prettier. Baca README tiap paket sebelum dipakai.
- Struktur folder:
  src/inti/{penilaian,engine,data,chesscom,pgn}  (logika murni, tanpa React)
  src/fitur/{masuk,daftarPermainan,review,papanAnalisis,kalibrasi,pengaturan}
  src/komponen/ui  (komponen neo-brutalism)
  src/gaya/  src/halaman/  src/pembantu/
  public/  docs/  proxy/ (nanti)  skrip/ (skrip build data)
- Skrip npm: dev, build, preview, test, lint, tipe (tsc --noEmit), periksa (tipe + lint + test + build, berurutan, berhenti saat gagal).
- Router dengan halaman placeholder: /, /pemain/:username, /review/:idPermainan, /kalibrasi, /pengaturan, /gaya, /poc/api, /poc/engine. Dukungan query ?move=N (indeks ply, 0 = posisi awal) disiapkan di tingkat router/hook.
- Satu tes contoh yang lulus untuk membuktikan Vitest jalan.
- Buat NOTICE.md awal (daftar dependensi + lisensi hasil npm view/LICENSE terpasang, bukan dari ingatan) dan README.md singkat (cara menjalankan di Windows).

Minta rencana singkat dulu. Setelah saya setujui, eksekusi. Akhiri dengan Penutup standar.
```

Kriteria lulus: `npm run periksa` hijau; `npm run dev` menampilkan placeholder tiap rute; commit `chore: kerangka proyek`.

### P2 — Design system neo-brutalism

```text
Baca CLAUDE.md (bagian "Desain: neo-brutalism") dan docs/BLUEPRINT-RINGKAS.md.

Bangun design system neo-brutalism untuk Telaah. Jawabannya untuk "apakah bisa": ya, murni CSS; yang kamu kerjakan adalah mewujudkannya secara konsisten.

1. src/gaya/token.css: semua token (warna terang/gelap, tinta, aksen, border 3px, bayangan keras, jarak, tipografi, warna dan bentuk 10 label). Mode gelap lewat prefers-color-scheme DAN atribut data-tema pada <html> (terang/gelap/sistem), tersimpan di localStorage dengan try/catch.
2. Font: pasang Space Grotesk dan Space Mono lewat paket @fontsource (self-host). Verifikasi lisensi OFL dari paket terpasang, catat di NOTICE.md.
3. Komponen di src/komponen/ui (TypeScript, props bertipe, tanpa warna hardcoded): Tombol (varian utama/kedua/bahaya/ghost, ukuran), Kartu, Lencana, KolomIsian, Pilihan (select), Sakelar, Tab, Tabel, BilahProgres (blok bersegmen, bukan halus), Dialog, Toast, PenukarTema. Efek hover/active sesuai CLAUDE.md; hormati prefers-reduced-motion.
4. Ikon label: 10 SVG buatan sendiri di src/komponen/ikon/LabelLangkah (komponen IkonLabel dengan prop label dan ukuran). Bentuk dan simbol sesuai CLAUDE.md, border 2px, tidak meniru ikon chess.com atau pihak lain. Sertakan teks alternatif.
5. Halaman /gaya: etalase semua komponen, semua state (normal, hover, fokus, nonaktif), 10 ikon label, palet, tipografi, dan tampilan papan 8x8 statis dengan react-chessboard bertema (kotak #FFF3C4/#7C9CF5, bingkai 4px, bayangan 8px) memakai posisi awal.
6. Periksa kontras teks vs latar untuk semua pasangan warna di terang dan gelap (hitung rasio dengan skrip kecil, target >= 4.5:1 teks, >= 3:1 elemen non-teks). Laporkan pasangan yang gagal dan perbaiki dengan menyesuaikan token, bukan dengan mengabaikan.
7. Uji visual: jalankan dev server, ambil screenshot /gaya (lebar 1280 dan 390, terang dan gelap) memakai Playwright atau alat browser yang tersedia, lalu telaah sendiri hasilnya dan perbaiki cacat (teks terpotong, bayangan terpotong, elemen tumpang tindih).

Jangan menyalin gaya, palet, atau ikon chess.com. Akhiri dengan Penutup standar dan sertakan lokasi screenshot.
```

Kriteria lulus: /gaya menampilkan semua komponen di terang dan gelap; rasio kontras terlampir; tidak ada warna hex di luar `token.css` (cek dengan grep); `npm run periksa` hijau.

[MANUAL] Lihat /gaya di browser. Jika tampilan belum "neo-brutalism" menurut Anda, pakai U3 sebelum lanjut — token yang salah akan menular ke semua halaman.

---

## Fase 2 — Modul inti (sekaligus PoC)

### P3 — Klien PubAPI chess.com + PoC 1 [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md.

Bangun src/inti/chesscom:
- ambilDaftarArsip(username) -> GET https://api.chess.com/pub/player/{username}/games/archives
- ambilPermainanBulanan(urlArsip | {tahun, bulan})
- Antrean permintaan SERIAL (satu per waktu), retry dengan backoff eksponensial untuk 429/5xx (maksimal 3 percobaan), pembatalan lewat AbortSignal.
- Cache IndexedDB (Dexie): TTL 12 jam untuk daftar arsip dan bulan lampau; bulan berjalan boleh TTL lebih pendek (tentukan dan jelaskan).
- Normalisasi username (huruf kecil, validasi karakter) dan galat bertipe (PemainTidakDitemukan, TerbatasiLaju, JaringanGagal, CorsGagal) dengan pesan Indonesia.
- Pemilihan titik akhir: variabel lingkungan VITE_URL_PROXY (opsional). Bila terisi dan fetch langsung gagal dengan kesalahan jaringan/CORS, ulangi lewat proxy.
- Folder proxy/: Cloudflare Worker minimal untuk meneruskan GET /pub/* ke api.chess.com, hanya origin yang diizinkan (dari variabel), User-Agent berisi kontak (placeholder yang saya isi), meneruskan cache-control, menambahkan header CORS untuk origin tersebut. Belum di-deploy. Baca dokumentasi Wrangler resmi sebelum menulis konfigurasi; jangan menebak.
- Tes unit dengan fetch di-mock dan fixture JSON respons nyata (satu bulan, minimal 3 game; buat dari bentuk dokumentasi PubAPI). Tes: serial, retry 429, cache hit, galat 404.

PoC 1: halaman /poc/api. Isi: kolom username, tombol "Uji". Tampilkan secara berurutan: jumlah arsip, 24 bulan terakhir diambil serial dengan status/waktu tiap permintaan, ada/tidaknya header access-control-allow-origin (dari response.headers; bila dibaca tertutup oleh browser, katakan itu), field yang terbaca pada game pertama (pgn, accuracies, white.rating, uuid, time_class, rules, eco). Tampilkan LULUS/GAGAL menurut kriteria di blueprint.

Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: tes unit hijau; /poc/api dengan username Anda mengambil 24 bulan tanpa error CORS dari `localhost`.
[MANUAL] Jalankan /poc/api dengan username Anda, tempel hasilnya ke sesi. Jika CORS gagal berulang, lanjut ke pembuatan proxy (tugas tambahan di sesi yang sama). Catatan: pengujian dari domain `*.pages.dev` dilakukan di P15.

### P4 — Engine Stockfish + PoC 2 [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md.

Bangun src/inti/engine:
1. Jalankan npm view stockfish version license dist-tags, baca README paket terpasang, dan tentukan berkas varian "lite single-threaded" yang benar (js + wasm). Catat versi dan ukuran berkas (byte nyata). Salin berkas ke public/engine/ lewat skrip npm (skrip/salinEngine) agar bisa diulang; jangan menaruh berkas biner besar di luar yang perlu. Catat lisensi GPLv3 di NOTICE.md.
2. Pembungkus UCI untuk Worker: kelas MesinCatur dengan metode mulai(), cari({fen, nodes, multiPv}) -> Promise<HasilCari>, hentikan(), tutup(). Parser baris "info ... score cp|mate ... multipv ... pv ..." dan "bestmove". Normalisasi skor ke sudut pandang pemain yang melangkah. Opsi: Hash, MultiPV, Threads=1. Penanganan galat dan timeout.
3. KolamMesin: N Worker (default min(4, hardwareConcurrency - 1) laptop, 2 pada perangkat seluler; dapat diubah), antrean tugas, pembatalan, penyelesaian berurutan terjamin kebenarannya (hasil dipetakan ke permintaan lewat id).
4. Tes unit untuk parser UCI dengan cuplikan output nyata (dari menjalankan engine), dan tes integrasi yang memuat engine di Node/jsdom bila memungkinkan; bila tidak, jelaskan batasnya dan uji di browser lewat PoC.

PoC 2: halaman /poc/engine. Tombol benchmark: posisi awal, posisi tengah permainan, posisi akhir permainan; go nodes 100000 dan 1000000; ukur waktu, nodes/detik, kedalaman. Uji pool 1/2/3/4 Worker pada 24 posisi dan hitung percepatan. Tampilkan crossOriginIsolated, hardwareConcurrency, userAgent. Tampilkan LULUS/GAGAL menurut kriteria blueprint (laptop <= 0,3 s per 100k node; pool 3 Worker >= 2,3x).

Jangan mengklaim angka kinerja tanpa menjalankannya. Bila tidak bisa menjalankan di browser sendiri, bangun halamannya dan nyatakan UNKNOWN, lalu beri saya instruksi untuk menjalankannya.
Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: parser teruji; /poc/engine jalan di Chrome laptop dan HP.
[MANUAL] Jalankan /poc/engine di laptop dan HP (HP: lewat jaringan lokal atau setelah deploy di P15). Tempel hasil ke sesi berikutnya. Bila kecepatan tidak memenuhi, minta turunkan anggaran node atau evaluasi multi-thread sebelum lanjut.

### P5 — Parser PGN, model data, penyimpanan [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md.

Bangun src/inti/pgn dan src/inti/data:
1. Tipe TypeScript (nama Indonesia): Permainan, Posisi, GarisEngine, Evaluasi, LabelLangkah, HasilAnalisis, Variasi, DataKalibrasi.
2. Skema Dexie (versi 1, dengan jalur migrasi yang jelas):
   pemain(username) {daftarArsip[], diperbaruiPada}
   permainan(uuid; fallback url) {username, warnaSaya, lawan, ratingPutih, ratingHitam, hasilPutih, hasilHitam, hasilSaya, timeClass, timeControl, rated, rules, endTime, jumlahLangkah, eco, pgn, akurasiChessCom?{putih,hitam}}
   posisi([uuid, ply]) {fen, langkahUci, langkahSan, giliran, isBook, isTerminal}
   evaluasi([fen, anggaranNodes, multiPv]) {garis[]{skorCp?, skorMat?, pvUci[], kedalaman, nodes}, versiEngine}
   labelLangkah([uuid, ply]) {label, poinHilang, epSebelum, epSesudah, langkahTerbaik, pvTerbaik[], alasan[]}
   hasilAnalisis([uuid, versiAlgoritma]) {akurasi{putih,hitam}, ratingPermainan{putih,hitam}, ringkasan, kurvaEvaluasi[], selesaiPada}
   kalibrasi([uuid, ply]) {labelChessCom, labelSaya, akurasiChessCom, ratingChessCom}
   variasi(idVariasi) {uuid, plyInduk, langkah[], label[]}
   Evaluasi dibagi antar game (kunci berdasarkan FEN, bukan uuid).
3. normalisasiPermainan(jsonChessCom, username): turunkan warnaSaya, hasilSaya (menang/kalah/remis dari field result kedua pihak, petakan semua nilai result chess.com yang terdokumentasi), jumlahLangkah dari PGN, akurasiChessCom bila ada. Tangani rules != chess dengan menandainya (belum didukung) tanpa membuat aplikasi rusak.
4. uraiPgn(pgn): kembalikan daftar Posisi per ply (FEN, UCI, SAN), header, dan hasil. Pakai chess.js; tangani PGN rusak, komentar {[%clk ...]}, dan posisi awal bukan standar bila ada (Chess960 ditolak dengan galat jelas).
5. Fungsi penyimpanan: simpanPermainan, ambilPermainanPemain (filter + paginasi di tingkat query), simpanEvaluasi/ambilEvaluasi, simpanHasilAnalisis, ekspor/impor seluruh basis data ke JSON (dengan versi skema).
6. Tes: fixture 5 PGN nyata dengan variasi (mat, remis repetisi, menyerah, waktu habis, komentar clk). Uji jumlahLangkah, hasilSaya, FEN akhir.

Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: semua tes hijau; ekspor lalu impor menghasilkan data identik.

### P6 — Pipeline analisis [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md.

Bangun src/inti/engine/pipelineAnalisis:
- Masukan: Permainan (pgn terurai). Keluaran bertahap (async iterator/callback progres): evaluasi tiap posisi.
- Tahap A: semua posisi yang bukan terminal, go nodes (default 100000), MultiPV 2, lewat KolamMesin. Lewati posisi yang evaluasinya sudah ada di cache (kunci fen+nodes+multiPv; evaluasi dengan nodes >= yang diminta dan multiPv >= yang diminta boleh dipakai ulang).
- Posisi terminal (mat, stalemate, remis aturan): jangan kirim ke engine; buat evaluasi sintetis (mat -> pemenang 1; remis -> 0,5).
- Posisi dengan satu langkah legal: tandai paksa.
- Tahap B (disiapkan sebagai antarmuka dengan penentu "posisiKritis" yang bisa diganti; implementasi penentu lengkap menyusul di P11): ulangi pencarian posisi terpilih dengan nodes lebih tinggi (default 600000), MultiPV 2–3.
- Progres per posisi (selesai/total, perkiraan sisa waktu), pembatalan bersih (stop engine, tidak meninggalkan Worker menggantung), prioritas: posisi dekat langkah yang sedang dilihat dahulu bila diminta.
- Semua parameter (nodes, multiPv, jumlah worker) dari satu objek konfigurasi + pengaturan pengguna.
- Tes: pakai MesinCatur tiruan deterministik. Uji: urutan hasil benar, cache dipakai, pembatalan, posisi terminal, langkah paksa.

Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: tes hijau; satu game nyata bisa dianalisis dari skrip uji/halaman PoC dan evaluasinya tersimpan; analisis kedua game yang sama selesai < 1 detik (dari cache).

### P7 — Penilaian MVP (pita resmi + accuracy Lichess)

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md (bagian 2 dan 3).

Bangun src/inti/penilaian (fungsi murni, tanpa React):
1. konfigurasiPenilaian.ts: semua parameter (k0, beta, ambang pita resmi, TOL_BEST, ambang MENANG/TIDAK_BURUK/CELAH, a, p, dsb.) beserta versiAlgoritma. Tandai yang ASUMSI dengan komentar satu baris.
2. hitungPeluangMenang(cp|mat, rating), hitungPoinHilang.
3. klasifikasiLangkah versi MVP: langkah paksa, pita resmi (Best, Excellent, Good, Inaccuracy, Mistake, Blunder). Brilliant/Great/Miss/Book BELUM (tempatkan hook yang jelas).
4. hitungAkurasi mode "Terbuka" (rumus Lichess persis, dari blueprint; verifikasi rumus terhadap https://lichess.org/page/accuracy bila ada akses dan laporkan hasilnya).
5. ringkasanLabel per pemain (hitungan tiap kategori).
6. Fungsi kelasPenilaianPermainan(evaluasi[], posisi[], ratingPutih, ratingHitam, konfigurasi) -> HasilAnalisis (label per ply, kurva EP, akurasi, ringkasan). Murni dan deterministik.
7. Klasifikasi ulang tanpa engine: fungsi yang menerima evaluasi tersimpan + konfigurasi baru.
8. Tes unit kaya: nilai batas tiap pita (0,02/0,05/0,10/0,20 tepat di batas), simetri putih/hitam, konversi mat, cp ekstrem, langkah paksa, dan satu game fixture dengan hasil yang dihitung tangan untuk 5 langkah. Jangan menulis tes yang hanya menyalin implementasi.

Akhiri dengan Penutup standar.
```

Kriteria lulus: tes batas pita lulus; satu game end-to-end (API → PGN → engine → label) dapat dihitung lewat skrip/halaman uji; PoC 3 bagian awal: bandingkan label manual 1 game dengan chess.com (Anda), target >= 50% persis, selisih accuracy <= 10 vs field `accuracies` API.
[MANUAL] Bandingkan 1 game Anda dengan Game Review chess.com dan laporkan hasilnya.

---

## Fase 3 — MVP UI

### P8 — Halaman masuk dan daftar game [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md. Gunakan komponen src/komponen/ui dan token neo-brutalism; jangan membuat gaya baru di luar token.

Bangun:
1. Halaman / (HalamanMasuk): kolom username, tombol "Muat riwayat", daftar username terakhir (localStorage dengan try/catch), pesan galat Indonesia untuk tiap galat bertipe.
2. Halaman /pemain/:username (DaftarPermainan): ambil arsip bulan terbaru dahulu, lazy per bulan dengan indikator progres; "Muat bulan lebih lama" bertahap.
   Kolom: tanggal, lawan (rating), warna, hasil, kontrol waktu (time_class + time_control terbaca), jumlah langkah, akurasi chess.com bila ada (bertanda), status analisis lokal (sudah/belum), tombol Review.
   Filter: kontrol waktu, hasil, warna, bulan, cari lawan. Paginasi lokal 20 per halaman. Semua filter tercermin di query string URL.
   Mobile: tampilan kartu (bukan tabel). Desktop: tabel.
   Game dengan rules != chess ditampilkan tapi tombol Review nonaktif dengan alasan.
3. Keadaan kosong, memuat, dan galat yang dirancang neo-brutalism (bukan teks polos).
4. Tes komponen untuk filter dan paginasi. Uji tampilan: screenshot 1280 dan 390 (terang/gelap), telaah, perbaiki.

Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: dengan username Anda, daftar game tampil, filter dan paginasi bekerja, URL dapat dibagikan; layout mobile 390px tanpa gulir horizontal.

### P9 — Halaman review [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md. Pakai token dan komponen neo-brutalism.

Bangun /review/:idPermainan (HalamanReview):
1. Alur: muat Permainan dari Dexie (atau ambil ulang dari API bila tidak ada), uraiPgn, jalankan pipelineAnalisis dengan indikator progres (blok bersegmen), tampilkan hasil Tahap A secepat tersedia, simpan hasil. Kunjungan ulang memakai cache tanpa menjalankan engine. Tombol "Analisis ulang".
2. PapanCatur: pembungkus react-chessboard bertema (lihat CLAUDE.md), orientasi sesuai warnaSaya + tombol balik papan, panah langkah terbaik (hijau) dan langkah dimainkan (merah) untuk langkah buruk, highlight kotak asal/tujuan, badge IkonLabel di kotak tujuan (lapisan SVG sendiri bila react-chessboard tidak cukup; verifikasi dari dokumentasi paket, jangan menebak props).
3. BarEvaluasi vertikal (blok datar neo-brutalism) dengan angka evaluasi (Space Mono).
4. Navigasi: tombol awal/mundur/maju/akhir, tombol keyboard (panah kiri/kanan, Home/End), ?move=N (indeks ply) sinkron dengan URL memakai replaceState; muat langsung ke langkah dari URL.
5. GrafikEvaluasi (Recharts AreaChart, data {ply, epPutih} 0–1): klik titik loncat ke langkah, ReferenceLine langkah aktif, titik berwarna dan berbentuk untuk Blunder/Mistake/Miss/Brilliant, tooltip yang jelas, bisa dioperasikan keyboard.
6. PanelRingkasan: akurasi tiap pemain (dengan penanda mode Terbuka), tabel hitungan tiap kategori untuk putih dan hitam dengan IkonLabel, nama pemain, rating. Game Rating menyusul di P11 (sisakan tempat berlabel "belum tersedia").
7. DaftarLangkah: SAN + IkonLabel per langkah, dua kolom, langkah aktif disorot, gulir otomatis.
8. Mobile: papan lebar penuh, bar navigasi, grafik mini, tab [Langkah | Ringkasan]. Desktop: dua kolom seperti wireframe blueprint.
9. Tes komponen untuk navigasi dan sinkron ?move. Uji visual dengan screenshot (1280, 390; terang/gelap) pada game nyata; telaah dan perbaiki.

Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: klik titik grafik memindahkan papan; refresh URL mempertahankan langkah; navigasi 60 fps (periksa dengan profil sederhana atau jelaskan metode); buka ulang game < 200 ms dari cache.

---

## Fase 4 — Kemiripan dengan chess.com

### P10 — Book, Brilliant, Great, Miss [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md (bagian 3 dan 4).

1. Book: tulis skrip/skrip-data.ts yang mengunduh berkas TSV (a–e) dari repo lichess-org/chess-openings (CC0; cek LICENSE di repo), membangun himpunan EPD ternormalisasi dan ECO/nama, dan menulis public/data/pembukaan.json (ringkas; laporkan ukuran). Skrip dijalankan manual (npm run data:pembukaan), hasilnya di-commit. Fungsi isBook(epd). Catat lisensi di NOTICE.md.
2. Implementasikan di src/inti/penilaian sesuai pseudocode blueprint: isPengorbananBidak (SEE sederhana + perubahan material 2–4 ply di PV; tulis fungsi SEE sendiri atau pakai chess.js dengan jujur terhadap keterbatasannya), kategori(ep) MENANG/SEIMBANG/KALAH dengan T_menang yang bergantung rating, Brilliant, Great, Miss (termasuk melewatkan mat paksa), backstop cp untuk posisi menang telak, aturan tidak menghukum pihak yang sudah kena mat paksa, tidak ada Brilliant beruntun pada variasi sama.
3. penentu posisiKritis untuk Tahap B (kandidat Brilliant/Great/Miss, poinHilang >= 0.10, perubahan skor mat, selisih evaluasi besar, batas jumlah per game) + hubungkan ke pipelineAnalisis; hasil Tahap B menggantikan Tahap A untuk posisi itu.
4. Setiap label menyimpan `alasan[]` (kode aturan pemicu) agar debugging dan kalibrasi bisa menelusuri.
5. Tes unit untuk setiap aturan: kasus positif dan negatif, kasus batas. Semua parameter tetap di konfigurasiPenilaian.ts (ASUMSI) dan naikkan versiAlgoritma.
6. UI: Book dan label baru muncul di review (IkonLabel sudah ada), dan penjelasan "mengapa label ini" (daftar alasan) pada langkah aktif.

Jangan mengklaim kecocokan dengan chess.com; ukuran kecocokan baru ada setelah P11. Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: tes aturan hijau; pada 3 game uji, label Brilliant/Great jarang (bukan puluhan per game); tiap label punya alasan.

### P11 — Accuracy mirip chess.com, Game Rating, halaman kalibrasi [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md (bagian 2 dan 8).

1. Accuracy mode "Mirip chess.com" (rumus ASUMSI di blueprint) + pengaturan pemilihan mode; Game Rating (rumus ASUMSI di blueprint) berlabel "perkiraan", minimal 10 langkah non-Book; tampilkan di PanelRingkasan.
2. /kalibrasi (halaman kerja pribadi):
   a. Pilih game dari riwayat yang punya akurasiChessCom (otomatis dari API) dan unggah/tempel CSV label manual (kolom: uuid, ply, labelChessCom) serta rating game dari UI Game Review (input manual per game). Validasi CSV dengan pesan jelas.
   b. Jalankan analisis untuk game terpilih pada anggaran node 50k, 100k, 300k, 1M dan simpan semua evaluasi (progres jelas; bisa dihentikan).
   c. Hitung metrik (dari blueprint bagian 8): label persis, ±1 tingkat, matriks kebingungan 10x10, precision/recall tiap kategori kunci, MAE accuracy, MAE Game Rating, akurasi "siapa lebih akurat". Pisahkan set latih (default 12 game) dan uji.
   d. Grid search parameter (k0, beta, TOL_BEST, backstop, T_menang, CELAH_SATU_SATUNYA, AMBANG_TIDAK_BURUK, a, p, g1–g3) dengan klasifikasi ulang tanpa engine; ruang pencarian kecil dan terdokumentasi; ambang pita resmi dikunci. Tampilkan skor latih vs uji dan peringatan overfit bila selisih > 10 poin persen.
   e. Ekspor laporan CSV/JSON dan tombol "Terapkan parameter" yang menulis konfigurasi baru dengan versiAlgoritma baru (tidak menimpa diam-diam).
3. Fungsi metrik dan grid search murni di src/inti/penilaian/kalibrasi dengan tes (pakai data sintetis kecil dengan jawaban yang diketahui).
4. Tulis docs/PROSEDUR-KALIBRASI.md untuk saya: langkah mengumpulkan data dari chess.com (hanya game sendiri, tanpa scraping), format CSV, cara membaca laporan.

Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: metrik dapat dihitung pada data uji; laporan memuat latih/uji.
[MANUAL] Kumpulkan 15–20 game Anda yang sudah di-review di chess.com (akun gratis hanya 1 review penuh per hari, jadi mulailah lebih awal), catat label per langkah dan Game Rating ke CSV sesuai prosedur, jalankan kalibrasi. Target ASUMSI: label persis >= 65%, MAE accuracy <= 5. Jika tidak tercapai, laporkan temuan; jangan mengubah ambang resmi.

---

## Fase 5 — Analysis board

### P12 — Analysis board [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md.

Bangun PapanAnalisis di halaman review (mode "Analisis"):
1. Dari posisi mana pun pada game, pengguna menggerakkan bidak sendiri (drag-drop dan klik-klik); validasi dengan chess.js; promosi bidak dengan dialog pilihan.
2. Setiap langkah variasi: evaluasi on-demand (MultiPV 3, nodes dapat diatur, default 100000) lewat pool; batalkan pencarian lama dengan stop saat pengguna melangkah lagi; label langkah memakai evaluasi posisi induk (cache atau dicari bila belum ada) dan klasifikasiLangkah yang sama dengan review utama (Book berlaku selama masih dalam teori).
3. PanelGarisEngine: tiga garis teratas (skor, SAN PV 6 ply), bar evaluasi, panah langkah terbaik.
4. Kontrol: Undo, Ulang (redo), Reset ke game utama, Simpan variasi (Dexie `variasi`), daftar variasi tersimpan per game, hapus variasi.
5. Tautan: ?move=N untuk posisi game utama; parameter var=uciA,uciB,... untuk variasi (N = ply induk). Tombol "Salin tautan". URL dengan var tidak valid ditolak dengan pesan jelas, bukan crash.
6. Target kinerja: label langkah variasi <= 2 detik di laptop; ukur dan laporkan angka nyata (atau UNKNOWN bila tidak bisa menjalankan).
7. Tes untuk reducer variasi (langkah, undo, redo, reset, serialisasi URL) dan kasus tepi: langkah mat, remis, promosi, en passant, rokade.
8. Mobile: papan penuh, baris tombol, panel garis engine sebagai panel geser. Uji visual dengan screenshot.

Minta rencana singkat dulu. Akhiri dengan Penutup standar.
```

Kriteria lulus: semua kontrol bekerja; tautan ber-`var` dapat dibuka di tab baru dan menghasilkan posisi sama; label muncul <= 2 s di laptop Anda.

---

## Fase 6 — Tips

### P13 — Tips berbahasa Indonesia dari engine

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md (bagian fitur tips).

Bangun src/inti/tips (fungsi murni) dan KartuTips:
1. Untuk langkah Inaccuracy/Mistake/Miss/Blunder: tampilkan langkah terbaik (SAN), PV 4–6 ply dalam SAN, poin hilang (persen peluang), panah di papan (sudah ada), dan satu penjelasan templat bahasa Indonesia: "Langkah {SAN} kehilangan sekitar {x}% peluang. Lebih baik {terbaik}, karena {motif}. Lanjutan: {PV}."
2. Deteksi motif murni dari data engine dan aturan (tiap deteksi punya tes): bidak menggantung (SEE < 0 setelah langkah), mat terlewat atau mat tak terhindarkan, garpu, material hilang dalam N ply, raja tidak aman (sederhana, jelas batasnya). Bila tidak ada motif terdeteksi, kalimat "karena" dihilangkan, jangan mengarang alasan.
3. Variasi kalimat secukupnya (3–4 templat per motif) agar tidak monoton, tetap deterministik per langkah.
4. Jangan menambahkan LLM. Beri catatan di docs/TIPS.md tentang batas fitur ini dan bagaimana LLM bisa ditambahkan kelak (hanya FEN + PV + motif, default mati, dan risiko kepatuhan di User Agreement chess.com).
5. Tinjau 20 tips dari game nyata saya secara kritis: kutip contoh yang salah/janggal di laporan dan perbaiki aturannya.

Akhiri dengan Penutup standar.
```

Kriteria lulus: tips muncul untuk semua langkah buruk; tidak ada penjelasan yang mengarang motif; 20 tips hasil tinjauan Anda mayoritas masuk akal.
[MANUAL] Baca 20 tips pada game Anda dan beri tahu yang salah.

---

## Fase 7 — Rilis pribadi

### P14 — Pengaturan, ekspor/impor, offline

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md.

1. /pengaturan: tema (terang/gelap/sistem), orientasi papan default, anggaran node Tahap A/B, jumlah Worker, mode accuracy, tampilkan/sembunyikan panah, ukuran papan; tersimpan di localStorage/Dexie dengan try/catch, aplikasi tetap jalan bila penyimpanan gagal.
2. Ekspor/impor JSON (sudah ada fungsi di P5) dengan UI, validasi versi skema, konfirmasi sebelum menimpa, ringkasan hasil impor.
3. Manajemen penyimpanan: tampilkan perkiraan ukuran data (navigator.storage.estimate bila ada) dan tombol hapus evaluasi/hasil per game atau semua.
4. PWA opsional ringan: service worker (cara paling sederhana yang berfungsi di Cloudflare Pages) agar aplikasi dan berkas engine tersimpan offline. Pastikan service worker tidak mengganggu pembaruan versi (strategi pembaruan jelas) dan tidak mengganggu header COOP/COEP bila nanti diaktifkan. Jelaskan trade-off; jika risikonya lebih besar dari manfaatnya, lewati dan katakan.
5. Halaman "Tentang & Lisensi" yang membaca NOTICE.md (atau salinannya saat build), memuat penafian "Tidak berafiliasi dengan Chess.com".

Akhiri dengan Penutup standar.
```

Kriteria lulus: impor/ekspor round-trip identik; aplikasi tidak crash saat localStorage diblokir (uji dengan mode pribadi/pemblokiran).

### P15 — Deploy ke Cloudflare Pages [RENCANA]

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md (bagian hosting).

Siapkan deploy dan beri saya langkah [MANUAL] yang tepat:
1. public/_headers: Content-Type application/wasm untuk *.wasm, Cache-Control immutable untuk aset ber-hash dan berkas engine; header keamanan dasar. COOP/COEP TIDAK diaktifkan (single-thread); sediakan versi dikomentari beserta penjelasan kapan dipakai dan konsekuensinya (COEP memblokir sumber lintas-origin).
2. public/_redirects untuk fallback SPA (periksa dokumentasi Cloudflare Pages terbaru; jangan menebak sintaks).
3. Konfigurasi build (perintah, folder keluaran, versi Node) dan variabel lingkungan VITE_URL_PROXY.
4. Deploy proxy Worker (folder proxy/): jelaskan perintah wrangler yang tepat dari dokumentasi resmi, variabel origin yang diizinkan, User-Agent berkontak. Jangan memasukkan rahasia ke repo.
5. Skrip uji pascadeploy (npm run uji:deploy -- <url>): periksa status, MIME wasm, header cache, dan bahwa rute dalam (mis. /review/x) mengembalikan aplikasi, bukan 404.
6. Tulis docs/DEPLOY.md untuk Windows: buat repo GitHub, push, hubungkan ke Cloudflare Pages lewat dasbor (langkah demi langkah sesuai UI saat ini; jika tidak yakin dengan UI terbaru, katakan UNKNOWN dan rujuk dokumentasi resmi), cek ulang batas gratis di halaman resmi sebelum memutuskan, dan GitHub Pages sebagai cadangan (catatan: tanpa custom header).

Jangan melakukan git push atau deploy sendiri; siapkan semuanya dan beri saya perintahnya. Akhiri dengan Penutup standar.
```

Kriteria lulus: `npm run uji:deploy` lulus terhadap URL `*.pages.dev`; PoC 1 (CORS dari origin produksi) dan PoC 2 (engine, HP) diulang di situs produksi dan hasilnya dicatat.
[MANUAL] Push ke GitHub, hubungkan Cloudflare Pages, deploy proxy bila PoC 1 menunjukkan CORS bermasalah dari origin produksi, ulangi /poc/api dan /poc/engine di produksi, termasuk di HP.

### P16 — QA akhir dan audit

```text
Baca CLAUDE.md dan docs/BLUEPRINT-RINGKAS.md.

Lakukan audit akhir, hanya laporkan dan perbaiki yang terbukti:
1. Fungsional: telusuri 3 skenario penuh (masuk username -> daftar -> review -> analysis board -> variasi tersimpan -> tautan dibagikan) pada game nyata; catat bug dengan langkah reproduksi.
2. Aksesibilitas: jalankan axe-core (atau setara) pada semua halaman; uji navigasi keyboard penuh; periksa kontras token; periksa label ARIA papan/grafik/daftar langkah. Perbaiki temuan AA.
3. Responsif: 360, 390, 768, 1280, 1920 px, terang/gelap; tidak ada gulir horizontal, teks terpotong, atau bayangan terpotong.
4. Kinerja: waktu muat awal, ukuran bundle (laporkan angka), pemisahan kode untuk halaman berat dan Recharts, tidak ada Worker menggantung setelah berpindah halaman, penggunaan memori saat analisis game panjang (100+ langkah).
5. Kepatuhan: periksa NOTICE.md lengkap dan benar (bandingkan dengan package.json dan berkas aset di public/), tidak ada aset/nama/warna/ikon yang menyalin chess.com, tidak ada scraping, request PubAPI serial, tidak ada rahasia di repo.
6. Dokumentasi: README (menjalankan, menguji, struktur), docs/ARSITEKTUR.md (diagram alur data teks), docs/PROSEDUR-KALIBRASI.md mutakhir, daftar keterbatasan jujur (apa yang hanya pendekatan terhadap chess.com).
7. Laporan akhir: tabel temuan (tingkat keparahan, status), apa yang masih ASUMSI/UNKNOWN, dan rekomendasi satu langkah berikutnya.

Akhiri dengan Penutup standar.
```

Kriteria lulus: tidak ada temuan keparahan tinggi terbuka; laporan akhir menyebut jujur batas kemiripan dengan chess.com.

---

## Prompt utilitas

### U1 — Debugging terstruktur

```text
Ada masalah: <gejala singkat>.
Bukti: <pesan error / log konsol / langkah reproduksi / tangkapan layar>.
Ikuti urutan: (1) gejala, (2) akar masalah dengan bukti (berkas:baris, log, angka) — jika bukti kurang, tulis UNKNOWN dan perintah yang perlu dijalankan, jangan menebak, (3) perbaikan minimal, (4) cara verifikasi, termasuk tes yang gagal sebelum perbaikan dan lulus sesudahnya. Jangan merefaktor di luar akar masalah. Akhiri dengan Penutup standar.
```

### U2 — Tinjauan kode berkala (tiap akhir fase)

```text
Tinjau perubahan sejak commit <hash fase sebelumnya> terhadap CLAUDE.md. Periksa: pelanggaran aturan arsitektur (logika di komponen, engine di luar Worker, warna hardcoded), penamaan, tes yang hanya menyalin implementasi, parameter ASUMSI yang tersebar di luar konfigurasiPenilaian.ts, dependensi baru tanpa catatan di NOTICE.md, dan risiko kepatuhan. Laporkan temuan berperingkat dengan berkas:baris. Perbaiki hanya yang jelas salah; sisanya tanyakan.
```

### U3 — Perbaikan tampilan neo-brutalism

```text
Telaah tampilan halaman <rute> terhadap bagian "Desain: neo-brutalism" di CLAUDE.md. Ambil screenshot (1280 dan 390, terang dan gelap), tulis daftar penyimpangan (border/bayangan tidak konsisten, radius, gradient/blur, warna di luar token, hierarki lemah, teks terpotong, kontras), lalu perbaiki lewat token dan komponen yang ada, bukan gaya satu-kali. Tampilkan screenshot sebelum dan sesudah. Jika token itu sendiri yang salah, usulkan perubahan token dan dampaknya sebelum menerapkan.
```

---

## Catatan risiko untuk Anda

- Versi paket (React Router, react-chessboard, stockfish) dan kuota hosting dapat berubah; prompt sengaja menyuruh Claude Code memverifikasi, bukan memakai angka dari berkas ini.
- Kinerja engine di HP: UNKNOWN sampai P4 dijalankan. Hasil P4 menentukan anggaran node, jumlah Worker, dan apakah multi-thread perlu dievaluasi.
- Kecocokan dengan chess.com: pendekatan, bukan replika. Kalibrasi (P11) membutuhkan data yang hanya bisa Anda kumpulkan dari akun chess.com Anda sendiri.
- Jika suatu saat dipublikasikan: Stockfish GPLv3 mewajibkan rilis source karya gabungan. Anda perlu menyatakannya sebelum itu terjadi.
