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

## Data pengguna

- Username chess.com untuk uji: `fjrmhrii`
- Laptop (DxDiag, TERVERIFIKASI): ASUS VivoBook M1403QA, AMD Ryzen 7 5800HS (8 core / 16 thread), RAM 16 GB, Windows 11 Home build 26100, layar 1920x1200 skala 150%.
- HP: vivo Y20sG. Spesifikasi UNKNOWN; jangan berasumsi, ukur lewat benchmark P4.
- Identitas git: Fajar / hackinghero01@gmail.com.

## Aturan keputusan (permanen)

Setiap ambiguitas, hambatan, atau pertanyaan tidak diajukan sebagai pertanyaan terbuka. Sajikan:

- 2–3 opsi (Opsi A/B/C), masing-masing dengan trade-off singkat;
- satu opsi bertanda REKOMENDASI beserta alasannya;
- akibat bila tidak dijawab.

Jika memblokir: tunggu pilihan pengguna. Jika tidak memblokir: lanjut dengan opsi REKOMENDASI dan tulis asumsinya di laporan.
