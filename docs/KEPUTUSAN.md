# Keputusan Proyek — Telaah

Dokumen ini lebih baru dari `docs/BLUEPRINT-RINGKAS.md` dan `docs/PROMPTS.md`. Jika ada pertentangan, dokumen ini yang berlaku.

## Keputusan P0 (12 Okt 2026)

1. **Langkah paksa di accuracy.** Mode "Terbuka" mengikuti rumus Lichess persis. Mode "Mirip chess.com" punya parameter `langkahPaksa: 'keluarkan' | 'seratus'`, default `'seratus'` (ASUMSI), dipilih lewat kalibrasi.
2. **Miss.** Logika memakai kurung: `(A dan B dan C dan D) atau (melewatkan mat paksa dan masih menang)`, dengan:
   - A: `poinHilangLawanSebelumnya >= 0.10`
   - B: `kategori(epTerbaik) == MENANG`
   - C: `kategori(epDimainkan) <= SEIMBANG`
   - D: `poinHilang >= 0.05`
3. **Ambang.** Semua berstatus ASUMSI dan ditempatkan di `src/inti/penilaian/konfigurasiPenilaian.ts`. Nilai awal:
   - SEIMBANG: EP 0,40–0,60
   - MENANG: EP >= 0,75
   - Rating rendah (pion boleh dihitung pengorbanan): < 1200
   - Brilliant: `epAlternatifKedua < 0.90`
4. **TOL_BEST.** Best jika langkah = bestmove engine atau `poinHilang <= TOL_BEST` (awal 0,003, ASUMSI). Pita resmi 0,02 / 0,05 / 0,10 / 0,20 tidak berubah.
5. **Lisensi (opsi A).** Repo GitHub publik; seluruh proyek berlisensi GPLv3. Varian (`GPL-3.0-only` atau `GPL-3.0-or-later`) ditentukan di P1 dari berkas LICENSE dan field `license` paket `stockfish` yang terpasang, bukan ditebak. Situs wajib memuat tautan ke source. Field `license`, berkas `LICENSE`, dan `NOTICE.md` diterapkan di P1. Jika verifikasi menunjukkan masalah: laporkan dan berhenti.
6. **Determinisme cache engine.** Kirim `ucinewgame` per posisi atau per game; biaya keduanya diukur di P4. Kunci cache evaluasi = 4 field pertama FEN + `anggaranNodes` + `multiPv` + `versiEngine`.
7. **Tahap B di HP.** Batas jumlah posisi kritis per game dan anggaran node per jenis perangkat masuk konfigurasi. Angka final setelah benchmark P4.
8. **Game Rating.** Disembunyikan sampai lolos uji (MAE <= 150 pada data uji). Sebelum itu UI menampilkan "belum terkalibrasi".
9. **Kontras label.** Teks dan ikon label selalu `#111111` di kedua tema; badge memakai latar warna label sendiri. Aksen utama = warna Inaccuracy dan aksen kedua = warna Miss tetap dipertahankan; pembeda adalah bentuk dan simbol. Tombol aksen tidak diletakkan menempel pada badge label.
10. **Lint.** `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks` diizinkan sebagai devDependency. Dikonfirmasi di rencana P1.
11. **Kunci tabel `permainan`.** `uuid` sebagai primary key; fallback `url` bila `uuid` tidak ada. Keberadaan `uuid` diverifikasi di PoC 1.
12. **`.gitattributes`.** Isi `* text=auto eol=lf` dan `*.wasm binary`. Dikerjakan di P1.

## Keputusan P1 (12 Okt 2026)

- **K1 Node.** Node.js 24 LTS (terpasang v24.20.0). `package.json` `engines.node` = `>=24`. Alasan: vite 8, vitest 5, react-router 8, jsdom 30, dan eslint 10 menolak Node 22.11.
- **K2 Varian GPL.** `GPL-3.0-only`, sama dengan field `license` paket `stockfish` 19.0.1 (`"GPL-3.0"`, tanpa klausul "or later" di paket).
- **K3 TypeScript.** 6.0.3, bukan 7.x, karena peer `typescript-eslint` 8.71.1 = `>=4.8.4 <6.1.0`.
- **K4 ESLint.** Ditambah `@eslint/js` dan `globals`; tanpa `eslint-plugin-react-refresh`.
- **K5 Atribusi.** Pemberitahuan hak cipta Stockfish.js ("(c) Chess.com, LLC") dicantumkan apa adanya di `NOTICE.md` sebagai syarat lisensi, bukan pemakaian merek.

## Keputusan P3 (12 Okt 2026)

- **K1 Kriteria PoC 1 "24 bulan".** Akun `fjrmhrii` hanya punya 3 bulan arsip. PoC 1 diuji dengan `fjrmhrii` (semua arsip, status SEBAGIAN) ditambah akun publik `erik` (24 bulan) untuk syarat 24 request serial tanpa error CORS.
- **K2 TTL cache.** Semua respons PubAPI (termasuk bulan berjalan) di-cache 12 jam. Pengambilan ulang hanya lewat aksi manual pengguna ("Abaikan cache"/"Muat ulang").
- **K3 Wrangler.** `proxy/package.json` mengunci `wrangler` 4.149.0 tetapi belum dipasang; pemasangan dan deploy di P15.
- **K4 Fixture.** Fixture tes = 3 game asli dari arsip `fjrmhrii` 2026/10 (publik, milik pengguna).

## Keputusan P4 (12 Okt 2026)

- **K1 Berkas engine.** `public/engine/` tidak di-commit; `skrip/salinEngine.mjs` menyalin `stockfish-19-lite-single.{js,wasm}` + `LISENSI` dari `node_modules` lewat `predev`/`prebuild` dan menolak versi paket yang tidak cocok dengan `konfigurasiEngine.ts`.
- **K2 Paket.** `stockfish` 19.0.1 dependensi biasa (versi terkunci).
- **K3 Tes integrasi.** Engine asli diuji di Node (satu proses anak per engine) dalam `npm run test:engine`, bagian dari `npm run periksa`.
- **K4 Garis MultiPV (ASUMSI, diputuskan saat implementasi).** Garis per multipv = baris `info` terakhir, termasuk lowerbound/upperbound (ditandai `batas`), agar `pv[0]` multipv 1 = `bestmove`. Alternatif "baris tepat terakhir" ditolak karena terukur memberi pv[0] ≠ bestmove (b1c3 vs d2d4).
- **K5 Vitest `maxWorkers: 4`.** Bawaan (~jumlah core) membuat proses tes kehabisan commit memory Windows saat aplikasi lain memakai RAM.

## Keputusan P5 (12 Okt 2026)

- **K1 Skema.** Tabel data masuk sebagai Dexie **versi 2** (versi 1 = `cacheApi` dari P3); migrasi v1→v2 teruji tanpa kehilangan cache.
- **K2 Kunci `permainan`.** `id` = `uuid`, atau `url` bila `uuid` tidak ada; tabel turunan memakai `idPermainan`.
- **K3 Kunci `evaluasi`.** `[fen4+anggaranNodes+multiPv+versiEngine]` (menimpa bentuk `[fen, anggaranNodes, multiPv]` di PROMPTS P5). Evaluasi dengan nodes/MultiPV ≥ diminta dan versi engine sama dipakai ulang; prioritas kecocokan persis, lalu nodes terbesar.
- **K4 Fixture.** 6 game nyata: 5 dari arsip `fjrmhrii` (mat, menyerah, waktu habis, stalemate, daily tanpa clk) + 1 remis repetisi dari arsip publik `hikaru` 2026/09 (arsip `fjrmhrii` dan `erik` 2026/07–10 tidak punya remis repetisi).
- **K5 `fake-indexeddb`** 6.2.5 (Apache-2.0) sebagai devDependency untuk tes Dexie.
- **K6 Ekspor.** Semua tabel kecuali `cacheApi`; impor mode `ganti` (bawaan) atau `gabung`, menolak versi skema lebih baru.
- `jumlahLangkah` = langkah penuh (`ceil(ply/2)`); `jumlahPly` disimpan terpisah. Field `eco` PubAPI (URL) disimpan di `ecoUrl`, kode ECO dari tag PGN di `eco`.
- Komentar `[%clk]` dibaca dengan tokenizer sendiri karena chess.js menyimpan komentar per FEN (hilang saat posisi berulang).
- Kode hasil PubAPI (15, TERVERIFIKASI dari chess.com/news/view/published-data-api): menang `win`; kalah `checkmated, timeout, resigned, lose, abandoned, kingofthehill, threecheck, bughousepartnerlose`; remis `agreed, repetition, stalemate, insufficient, 50move, timevsinsufficient`. HTTP 410 kini diperlakukan sebagai `PemainTidakDitemukan`.

## Keputusan P6 (12 Okt 2026)

- **K1 Keluaran.** Callback `padaHasil`/`padaProgres` + Promise semua hasil; `aturFokus(ply)` mengubah prioritas di tengah jalan.
- **K2 Bukti kriteria.** Tes integrasi otomatis (engine asli di Node + Dexie) dan kartu "Uji pipeline" di `/poc/engine`.
- **K3 Anggaran tes otomatis** 20.000 node; konfigurasi asli 100.000 diuji di browser.
- Posisi terminal: mat = `mate 0` (pemain yang melangkah kalah), remis menurut aturan = `cp 0`; evaluasi sintetis tidak di-cache.
- Galat engine pada satu posisi menghentikan seluruh pipeline (ASUMSI; tombol "Analisis ulang" di P9).
- ASUMSI di `konfigurasiAnalisis.ts`: batas posisi kritis Tahap B 12 (laptop) / 6 (HP); penentu posisi kritis bawaan kosong sampai P10/P11.
- **Hasil (TERVERIFIKASI 12 Okt 2026):** Node, game `mat-saya-kalah` 25 posisi, 20k node, 2 engine: run kedua 13 ms dari cache, 0 panggilan engine. Chromium headless laptop (build produksi), game terakhir `fjrmhrii` 95 ply, 100k node, MultiPV 2, 4 Worker: run 1 6.952 ms (95 posisi engine), run 2 100 ms dari cache, 0 panggilan engine.

## Temuan engine (TERVERIFIKASI 12 Okt 2026)

- Setiap instance Wasm lite-single memesan memori awal 128 MB (maks 2048 MB, dari section memory berkas `.wasm`). Di Chromium laptop, Worker ke-7 gagal dengan `WebAssembly.instantiate(): Out of memory` saat commit memory Windows bebas ~1,7 GB.
- `ucinewgame` + `go nodes N` single-thread deterministik (hasil identik pada dua run, di Node dan browser). Biaya `ucinewgame` per posisi vs sekali per game: +2,3% (24 posisi × 100k node, 1 run).
- Modul Node `stockfish` berbagi state: hanya satu engine per proses Node.
- **PoC 2 laptop, browser pengguna (12 Okt 2026, ringkasan ditempel pengguna; userAgent tidak disertakan):** muat engine 154 ms; rata-rata 100k node 165 ms (batas 300 ms) LULUS; percepatan 3 Worker 2,42x (target 2,3x) LULUS; `ucinewgame` per posisi 3.508 ms vs sekali per game 4.024 ms (−12,8%); deterministik. Run headless sebelumnya (369 ms) terjadi saat commit memory Windows tertekan dan tidak dipakai sebagai acuan.
- **Keputusan turunan:** `ucinewgame` dikirim **per posisi** (KEPUTUSAN butir 6). Biayanya tidak terukur (lebih cepat dalam satu run, dalam batas derau) dan hasilnya tidak bergantung urutan pencarian. Anggaran Tahap A tetap 100k node.
- PoC 2 HP (vivo Y20sG): UNKNOWN, menunggu benchmark.

## Temuan data PubAPI (TERVERIFIKASI 12 Okt 2026)

- `uuid` ada di 128/128 game `fjrmhrii` → kunci `permainan` = `uuid` (butir 11) sesuai.
- `accuracies` ada di 18/128 game `fjrmhrii`.
- Field `eco` berisi URL halaman pembukaan (mis. `https://www.chess.com/openings/Pirc-Defense`), bukan kode ECO; ada di 121/128 game. Kode ECO ada di tag PGN `[ECO]` (128/128).
- Browser tidak mengekspos header `access-control-allow-origin` ke JavaScript (bukan header CORS-safelisted); `curl` menunjukkan nilainya `*`.

## Data pengguna

- Username chess.com untuk uji: `fjrmhrii`
- Laptop (DxDiag, TERVERIFIKASI): ASUS VivoBook M1403QA, AMD Ryzen 7 5800HS (8 core / 16 thread), RAM 16 GB, Windows 11 Home build 26100, layar 1920x1200 skala 150%.
- HP: vivo Y20sG. Spesifikasi UNKNOWN; jangan berasumsi, ukur lewat benchmark P4.
- Identitas git: Fajar / hackinghero01@gmail.com.
- Repo publik: https://github.com/fjrmhri/Chess-Game-Analysis

## Aturan keputusan (permanen)

Setiap ambiguitas, hambatan, atau pertanyaan tidak diajukan sebagai pertanyaan terbuka. Sajikan:

- 2–3 opsi (Opsi A/B/C), masing-masing dengan trade-off singkat;
- satu opsi bertanda REKOMENDASI beserta alasannya;
- akibat bila tidak dijawab.

Jika memblokir: tunggu pilihan pengguna. Jika tidak memblokir: lanjut dengan opsi REKOMENDASI dan tulis asumsinya di laporan.
