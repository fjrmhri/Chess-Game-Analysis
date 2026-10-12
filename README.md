# Telaah

Aplikasi web client-side untuk mereview game catur pribadi dari arsip publik. Analisis berjalan di browser.
Lisensi: GPL-3.0-only (lihat `LICENSE` dan `NOTICE.md`). Tidak berafiliasi dengan Chess.com.

## Prasyarat (Windows)

- Node.js 24 LTS (`node -v` harus `v24.x` atau lebih baru)
- Git

## Menjalankan

Semua perintah dijalankan di folder proyek (PowerShell atau cmd):

```
npm install
npm run dev
```

Buka alamat yang dicetak Vite (biasanya http://localhost:5173).

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` | build produksi ke `dist/` |
| `npm run preview` | menyajikan hasil build |
| `npm run test` | unit test (Vitest) |
| `npm run lint` | ESLint |
| `npm run tipe` | pemeriksaan tipe (`tsc -b`) |
| `npm run format` | merapikan kode dengan Prettier |
| `npm run periksa` | tipe + lint + test + build, berhenti saat ada yang gagal |

## Dokumen

- `CLAUDE.md` — aturan kerja
- `docs/KEPUTUSAN.md` — keputusan terbaru (menimpa blueprint)
- `docs/BLUEPRINT-RINGKAS.md` — spesifikasi
- `docs/PROMPTS.md` — urutan kerja
