# Blueprint Ringkas — Telaah

Ringkasan keputusan dari riset blueprint (12 Okt 2026). Status: TERVERIFIKASI = ada sumber publik; ASUMSI = dugaan/rekayasa balik, harus dikalibrasi; UNKNOWN = belum ada data. Angka kuota hosting dan versi paket bisa berubah: cek ulang sebelum dipakai.

## 1. Batas kemiripan dengan chess.com

| Butir | Status | Keyakinan |
|---|---|---|
| Pita expected points: Best 0; Excellent 0–0,02; Good 0,02–0,05; Inaccuracy 0,05–0,10; Mistake 0,10–0,20; Blunder 0,20–1,00 | TERVERIFIKASI (Help Center chess.com) | Tinggi |
| Kurva centipawn → expected points per rating | UNKNOWN (privat) | Rendah |
| Definisi Brilliant/Great/Miss/Book | TERVERIFIKASI kualitatif; detail algoritma UNKNOWN | Rendah–sedang |
| Accuracy (CAPS2) dan Game Rating | Rumus privat; hanya deskripsi umum | Rendah |
| Field `accuracies{white,black}` di arsip PubAPI (jika game pernah direview) | TERVERIFIKASI | Tinggi |

Target realistis (patokan alat pihak ketiga ChessGrader, bukan jaminan): label persis ~65%, MAE accuracy ~4,3. Hasil identik dengan chess.com tidak mungkin dijamin.

## 2. Rumus (nama fungsi Indonesia)

- `hitungPeluangMenang(cp, R) = 1 / (1 + exp(-k(R) * cp))`, `k(R) = k0 * (1 + beta * (R - 1500) / 1000)`, `k0 = 0.00368208` (konstanta Lichess, TERVERIFIKASI), `beta` mulai 0 (ASUMSI, dikalibrasi). cp dibatasi [-1500, 1500]. Skor mat → 1 atau 0. cp dari sudut pandang pemain yang melangkah.
- `poinHilang = max(0, epTerbaik - epDimainkan)`. Jika langkah yang dimainkan ada di MultiPV posisi sebelumnya, pakai skor dari pencarian yang sama.
- Accuracy mode "Terbuka" (Lichess, TERVERIFIKASI): per langkah `103.1668 * exp(-0.04354 * (winSebelum - winSesudah)) - 3.1669` dengan Win% = `100 / (1 + exp(-0.00368208 * cp))`; per game = rata-rata gabungan (jendela geser berbobot volatilitas dan rata-rata harmonik).
- Accuracy mode "Mirip chess.com" (ASUMSI, dari metodologi ChessGrader): per langkah `max(0, 100 - a * loss^p)` dengan `a = 7.2`, `p = 1.75`, loss dalam poin EP 0–100; Book/langkah paksa = 100; rata-rata biasa. Kalibrasi `a`, `p`, `k(R)` terhadap field `accuracies` API.
- Game Rating (ASUMSI, rendah): `R_pemain + clamp(g1*(akurasi - mu(R)) + g2*(R_lawan - R_pemain) - g3*ACPL_berlebih, ±600)`, minimal 10 langkah non-Book; `mu(R)` dari histori; g1–g3 dari regresi pada 10–20 game. Tampilkan berlabel "perkiraan".

## 3. Pseudocode klasifikasi (urutan prioritas)

```
klasifikasiLangkah(ply):
  jika langkahLegal == 1 -> Best (paksa; keluarkan dari accuracy)
  jika isBook(ply) dan semua ply sebelumnya Book dan poinHilang <= 0.05 -> Book
  Brilliant: poinHilang <= 0.02 dan isPengorbananBidak dan epDimainkan >= 0.45
             dan epAlternatifKedua < 0.90                    (ambang awal: ASUMSI)
  Great:     poinHilang <= 0.02 dan ( (epTerbaik - epAlternatifKedua) >= 0.18
             atau kalah -> seimbang atau seimbang -> menang setelah lawan salah >= 0.10 )
  Miss:      poinHilangLawanSebelumnya >= 0.10 dan kategori(epTerbaik) == MENANG (>= 0.75)
             dan kategori(epDimainkan) <= SEIMBANG dan poinHilang >= 0.05
             atau melewatkan mat paksa padahal masih menang
  Pita resmi: Best (terbaik/toleransi ~0.003), Excellent <=0.02, Good <=0.05,
              Inaccuracy <=0.10, Mistake <=0.20, selain itu Blunder
```

Kasus tepi: posisi sudah menang telak (kurva datar) → terapkan backstop cp (100–400 cp tidak boleh Good) dan kalibrasi; pihak yang sudah kena mat paksa tidak dihukum lagi; hindari Brilliant beruntun di variasi sama. `isPengorbananBidak`: bidak bergerak/bidak lain (bukan pion; pemain rating rendah pion boleh) bisa diambil dengan SEE < 0, atau material bersih setelah 2–4 ply PV turun >= 2; kecuali rekapturasi biasa.

## 4. Engine dan analisis

- Stockfish.js lite single-thread di Worker (tanpa COOP/COEP). Pool `min(4, hardwareConcurrency - 1)` di laptop, 2 di HP (ASUMSI, sesuaikan hasil benchmark).
- Tahap A: semua posisi, `go nodes 100000`, MultiPV 2. Tahap B: posisi kritis (kandidat Brilliant/Great/Miss, poinHilang >= 0.10, perubahan skor mat), `go nodes 600000`, MultiPV 2–3. Angka ini ASUMSI dari praktik ChessGrader; setel saat kalibrasi.
- Posisi akhir tidak dikirim ke engine: mat → EP pemenang 1; remis → 0,5.
- Estimasi waktu per game 40 langkah: laptop 5–15 s, HP 30–90 s. UNKNOWN sampai diukur (PoC engine). Versi paket `stockfish` dan ukuran berkas: sumber saling bertentangan (18 vs 19); cek `npm view stockfish`.
- Multi-thread butuh `crossOriginIsolated` (COOP `same-origin` + COEP `require-corp`/`credentialless`). Hanya jika single-thread terlalu lambat.

## 5. Skema IndexedDB (Dexie)

`pemain(username)`, `permainan(uuid|url)`, `posisi([uuid,ply])`, `evaluasi([fen,anggaranNodes,multiPv])`, `labelLangkah([uuid,ply])`, `hasilAnalisis([uuid,versiAlgoritma])`, `kalibrasi([uuid,ply])`, `variasi(idVariasi)`. Field utama per tabel ada di docs/PROMPTS.md (prompt data). Sinkron antar perangkat: ekspor/impor JSON. Tanpa Firebase.

## 6. Hosting

Utama: GitHub → Cloudflare Pages (`_headers`, SPA fallback). Proxy cadangan CORS: Cloudflare Worker. Cadangan hosting: GitHub Pages (tanpa custom header; coi-serviceworker bila perlu multi-thread). Netlify (kredit habis bila sering deploy) dan Firebase Spark (transfer 360 MB/hari) lebih sempit. Angka kuota dari sumber sekunder: verifikasi ulang di halaman resmi sebelum memutuskan.

## 7. PoC dan kriteria lulus

1. PubAPI dari browser: 24 bulan arsip serial tanpa error CORS; field `pgn`, `accuracies`, `white.rating` terbaca.
2. Engine: 100k node ≤ 0,3 s di laptop, ≤ 1,5 s di HP; pool 3 Worker ≥ 2,3x percepatan.
3. Satu game end-to-end: label persis ≥ 50% sebelum kalibrasi; selisih accuracy ≤ 10 vs API.
4. Papan + grafik klik + `?move=N` (N = indeks ply, 0 = posisi awal).
5. IndexedDB: buka ulang < 200 ms; ubah ambang tanpa engine.
6. Analysis board: label variasi ≤ 2 s di laptop.
7. Deploy: situs publik, MIME wasm benar, engine termuat ≤ 5 s di 4G pada kunjungan pertama.
8. Kalibrasi mini.

## 8. Kalibrasi

15–20 game yang sudah punya Game Review (12 latih, sisanya uji). Accuracy otomatis dari `accuracies` API; label per langkah dan Game Rating dicatat manual dari UI chess.com oleh pemilik akun (tanpa scraping). Metrik: label persis, ±1 tingkat, matriks kebingungan, precision/recall Blunder/Mistake/Miss/Great/Brilliant, MAE accuracy, MAE rating. Target ASUMSI: label persis ≥ 65%, recall Blunder/Mistake ≥ 80%, MAE accuracy ≤ 5, MAE rating ≤ 150. Grid search parameter tanpa menjalankan engine ulang. Jika selisih latih−uji > 10 poin persen = overfit.

## 9. Lisensi

| Dependensi | Lisensi | Pribadi | Jika dipublikasikan |
|---|---|---|---|
| Stockfish / Stockfish.js | GPLv3 | Bebas | Rilis source seluruh karya gabungan (GPLv3) |
| chess.js | BSD-2-Clause (ASUMSI, cek LICENSE) | Bebas | Notice |
| react-chessboard | MIT | Bebas | Notice |
| chessnut / rhosgfx | Apache-2.0 / CC0 (lila COPYING.md) | Bebas | Notice / tanpa syarat |
| lichess chess-openings | CC0 | Bebas | Bebas |
| Space Grotesk, Space Mono | OFL (ASUMSI, cek) | Bebas | Sertakan lisensi font |
| Recharts, Dexie | MIT, Apache-2.0 (ASUMSI, cek) | Bebas | Notice |

Kepatuhan chess.com: hanya PubAPI; serial; cache >= 12 jam; tanpa scraping; tanpa menyalin glyph, palet papan, desain bidak, suara, logo, nama. Jika dipublikasikan: penafian "tidak berafiliasi dengan Chess.com".

## 10. Sumber utama

- Klasifikasi langkah: https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc
- Accuracy: https://support.chess.com/en/articles/8708970-how-is-accuracy-in-analysis-determined
- Game Rating: https://support.chess.com/en/articles/10773754-how-is-game-rating-calculated-in-game-review
- PubAPI: https://support.chess.com/en/articles/9650547-published-data-api
- Lichess accuracy: https://lichess.org/page/accuracy
- ChessGrader metodologi: https://chessgrader.com/methodology/
- Stockfish.js: https://github.com/nmrugg/stockfish.js/
- Lisensi set bidak: https://github.com/lichess-org/lila/blob/master/COPYING.md
- Data pembukaan: https://github.com/lichess-org/chess-openings
- Batas Cloudflare Pages: https://developers.cloudflare.com/pages/platform/limits/
