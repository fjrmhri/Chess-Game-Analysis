# Telaah — Review Game Catur Pribadi

Aplikasi web client-side untuk mereview game chess.com milik sendiri. Pemakaian pribadi, biaya Rp0.
Nama kerja: "Telaah". Jangan memakai nama, logo, atau tampilan chess.com.
Spesifikasi lengkap: `docs/BLUEPRINT-RINGKAS.md`. Urutan kerja: `docs/PROMPTS.md`.

## Prinsip kerja (prioritas: kebenaran > keamanan > instruksi terbaru > format)

- Jangan mengarang fakta, API, versi, atau angka. Sebelum memasang paket: `npm view <paket> version license`, lalu baca README/tipe paket terpasang di `node_modules`. Jangan menebak API dari ingatan.
- Tandai klaim penting di laporan: TERVERIFIKASI (ada bukti: output perintah, tes, sumber), ASUMSI, atau UNKNOWN.
- Jika hasil tidak sesuai kriteria lulus, berhenti dan laporkan. Jangan mengubah kriteria agar lulus.
- Patch minimal. Jangan refactor atau reformat besar di luar lingkup tugas.
- Tanyakan ke saya (maksimal 3 pertanyaan) hanya jika tebakan salah mahal diulang. Selain itu lanjut dengan asumsi yang ditulis eksplisit.

## Lingkungan

- Windows, folder proyek `D:\KULIAH\Project Lokal\Chess Review`. Jangan mengasumsikan bash. Semua langkah berulang harus lewat skrip `npm run ...` agar lintas-shell.
- Bahasa UI: Indonesia. Identifier (variabel, fungsi, tipe, komponen, file): Indonesia, kecuali nama yang diwajibkan framework/library. Komentar minimum, hanya untuk rumus dan ambang.

## Stack (keputusan, alasan di blueprint)

Vite + React + TypeScript (strict), React Router, chess.js, react-chessboard, Recharts, Dexie (IndexedDB), Vitest, Stockfish.js lite single-thread (paket `stockfish`, nmrugg) di Web Worker. Hosting: Cloudflare Pages. Proxy cadangan: Cloudflare Worker.

Dilarang menambah dependensi besar tanpa persetujuan saya. Dilarang memakai chessground (GPL-3.0) dan set bidak cburnett (lisensi ambigu). Tidak memakai Firebase.

## Aturan arsitektur

- Logika penilaian (EP, label, accuracy, rating, Book) = fungsi murni di `src/inti/penilaian/`, tanpa import React/DOM, dengan unit test.
- Engine hanya di Web Worker. Pencarian memakai `go nodes N`, bukan depth/movetime.
- Hasil dikunci `versiAlgoritma`. Mengubah parameter/ambang harus bisa diklasifikasi ulang dari evaluasi tersimpan tanpa menjalankan engine.
- Semua parameter yang berstatus ASUMSI ada di satu berkas `src/inti/penilaian/konfigurasiPenilaian.ts`.
- Ambang resmi pita expected points 0,02 / 0,05 / 0,10 / 0,20 tidak diubah saat kalibrasi. Yang disetel: kurva EP dan parameter Brilliant/Great/Miss/Book.
- PubAPI chess.com: request serial, retry dengan backoff saat 429, cache IndexedDB minimal 12 jam. Dilarang scraping halaman web chess.com.
- Fitur LLM untuk tips: tidak diimplementasikan kecuali saya minta. Jika kelak ada: hanya FEN + PV hasil engine sendiri, default mati.

## Kepatuhan dan lisensi

- Jangan menyalin ikon label, palet papan, desain bidak, suara, atau nama chess.com. Ikon label = SVG buatan sendiri.
- Bidak: chessnut (Apache-2.0) atau rhosgfx (CC0). Verifikasi lisensi di sumber sebelum menyalin berkas, simpan di `public/bidak/<set>/LISENSI`.
- Pertahankan `NOTICE.md` berisi daftar dependensi, lisensi, dan atribusi. Perbarui setiap menambah aset/dependensi.

## Desain: neo-brutalism (wajib konsisten)

Semua gaya lewat token CSS di `src/gaya/token.css`. Tidak ada warna hardcoded di komponen.

- Border tebal 3px solid warna tinta; radius 0.
- Bayangan keras tanpa blur: `6px 6px 0 var(--tinta)`. Dilarang gradient, blur, glassmorphism, bayangan lembut.
- Interaksi: hover geser `translate(-2px,-2px)` + bayangan 8px; active `translate(4px,4px)` + bayangan 2px. Matikan gerak bila `prefers-reduced-motion`.
- Warna datar jenuh di atas latar krem. Terang: latar `#FFF8E7`, permukaan `#FFFFFF`, tinta `#111111`, aksen utama `#FFD23F`, aksen kedua `#FF6B9D`, aksen ketiga `#4D9DE0`. Gelap: latar `#141414`, permukaan `#1F1F1F`, tinta (border/bayangan/teks) `#F5F0E1`; aksen sama.
- Tipografi: Space Grotesk (judul 700/800, huruf kapital, tracking sempit) dan Space Mono (notasi, angka, evaluasi). Pasang via `@fontsource-*` (self-host, jangan CDN). Verifikasi lisensi OFL sebelum memasang.
- Papan: kotak terang `#FFF3C4`, gelap `#7C9CF5`, bingkai 4px + bayangan 8px. Jangan memakai kombinasi hijau-krem.
- Label langkah: setiap label punya warna datar, bentuk unik, simbol unik, border 2px, dan nama teks. Jangan mengandalkan warna saja.
  Brilliant `#1BE7D6` segi enam "!!"; Great `#5B8DEF` lingkaran "!"; Best `#34D399` bintang; Excellent `#A3E635` centang; Good `#D9F99D` titik; Book `#D6B38A` buku; Inaccuracy `#FFD23F` segitiga "?!"; Mistake `#FF9F43` belah ketupat "?"; Miss `#FF6B9D` silang-target; Blunder `#FF4D4D` segi delapan "??".
- Aksesibilitas: kontras teks WCAG AA, fokus keyboard terlihat (outline 3px offset 2px), semua kontrol bisa dioperasikan dengan keyboard, mobile-first.

## Penutup standar setiap tugas

1. Jalankan `npm run periksa` (typecheck + lint + test + build). Perbaiki sampai hijau.
2. Verifikasi kriteria lulus tugas dengan bukti (output tes, angka ukur, screenshot bila UI).
3. Commit dengan pesan konvensional (`feat:`, `fix:`, `chore:`, `docs:`).
4. Laporkan ringkas: yang dibuat, bukti verifikasi (TERVERIFIKASI/ASUMSI/UNKNOWN), yang belum beres, dan data yang perlu saya kirim. Jangan lanjut ke tugas berikutnya sebelum saya minta.
