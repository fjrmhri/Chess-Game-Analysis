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
