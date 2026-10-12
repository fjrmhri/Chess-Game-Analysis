# NOTICE — Telaah

Telaah dilisensikan di bawah GNU General Public License v3.0 saja (`GPL-3.0-only`); teks lengkap di `LICENSE`.
Kode sumber: lihat tautan "Kode sumber" di situs (konstanta `URL_SUMBER` di `src/konfigurasiAplikasi.ts`).
Telaah tidak berafiliasi dengan Chess.com.

Data di bawah diambil dari `package.json` dan berkas lisensi paket terpasang di `node_modules` (diperbarui 12 Okt 2026), bukan dari ingatan. Teks lisensi lengkap tiap paket ada di berkas yang disebut pada kolom "Berkas".

## Engine (direncanakan, dipasang di P4)

| Paket | Versi | Lisensi | Atribusi |
|---|---|---|---|
| stockfish (Stockfish.js, nmrugg) | 19.0.1 | GPL-3.0 (`Copying.txt`) | "Stockfish.js 19 (c) 2026, Chess.com, LLC"; berbasis Stockfish (c) T. Romstad, M. Costalba, J. Kiiski, G. Linscott dan kontributor lain; net oleh Chris Bao (sscg13). Kode non-engine di paket: MIT. |

Sumber: berkas paket versi 19.0.1 (`package.json`, `README.md`, `Copying.txt`, header `bin/stockfish-19-lite-single.js`). Diverifikasi ulang dari `node_modules` saat dipasang.

## Dependensi runtime (ikut dibundel ke situs)

Langsung:

| Paket | Versi | Lisensi | Berkas |
|---|---|---|---|
| react | 19.3.0 | MIT | LICENSE |
| react-dom | 19.3.0 | MIT | LICENSE |
| react-router | 8.4.0 | MIT | LICENSE.md |
| chess.js | 1.4.0 | BSD-2-Clause | LICENSE |
| react-chessboard | 5.12.1 | MIT | LICENSE |
| recharts | 3.10.1 | MIT | LICENSE |
| dexie | 4.4.6 | Apache-2.0 | LICENSE, NOTICE |

Transitif (hasil `npm ls --omit=dev --all`):

| Paket | Versi | Lisensi |
|---|---|---|
| @dnd-kit/accessibility | 3.1.1 | MIT |
| @dnd-kit/core | 6.3.1 | MIT |
| @dnd-kit/modifiers | 9.0.0 | MIT |
| @dnd-kit/utilities | 3.2.2 | MIT |
| @reduxjs/toolkit | 2.13.0 | MIT |
| @remix-run/route-pattern | 0.22.1 | MIT |
| @standard-schema/spec | 1.1.0 | MIT |
| @standard-schema/utils | 0.3.0 | MIT |
| clsx | 2.1.1 | MIT |
| cookie-es | 3.1.1 | MIT |
| d3-array, d3-color, d3-format, d3-interpolate, d3-path, d3-scale, d3-shape, d3-time, d3-time-format, d3-timer, internmap | 3.x/4.x/2.x | ISC |
| d3-ease | 3.0.1 | BSD-3-Clause |
| decimal.js-light | 2.5.1 | MIT |
| es-toolkit | 1.52.0 | MIT (NOTICE: bagian diturunkan dari Lodash, MIT) |
| eventemitter3 | 5.0.4 | MIT |
| immer | 11.1.21 | MIT |
| react-is | 19.3.0 | MIT |
| react-redux | 9.3.0 | MIT |
| redux | 5.0.1 | MIT |
| redux-thunk | 3.1.0 | MIT |
| reselect | 5.2.0 | MIT |
| scheduler | 0.28.0 | MIT |
| tiny-invariant | 1.3.3 | MIT |
| tslib | 2.8.1 | 0BSD |
| use-sync-external-store | 1.7.0 | MIT |
| victory-vendor | 37.3.6 | MIT AND ISC |

Paket tipe `@types/*` dan `csstype` (MIT) hanya dipakai saat kompilasi, tidak dibundel.

### Pemberitahuan yang wajib dipertahankan

- **Dexie.js** — Copyright (c) 2014-2017 David Fahlander. Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0). Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
- **es-toolkit** — Parts of the test suite and compatibility layer in es-toolkit/compat are derived from Lodash (https://github.com/lodash/lodash). Copyright OpenJS Foundation and other contributors; based on Underscore.js, copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors. MIT License.

## Proxy cadangan (`proxy/`, belum dipasang/di-deploy)

| Paket | Versi | Lisensi | Sumber data |
|---|---|---|---|
| wrangler (dev) | 4.149.0 | MIT OR Apache-2.0 | `npm view wrangler` 12 Okt 2026; diverifikasi ulang dari `node_modules` saat dipasang (P15) |

## Alat pengembangan (tidak dibundel)

| Paket | Versi | Lisensi |
|---|---|---|
| typescript | 6.0.3 | Apache-2.0 |
| vite | 8.3.4 | MIT |
| @vitejs/plugin-react | 6.1.2 | MIT |
| vitest | 5.0.3 | MIT |
| jsdom | 30.1.2 | MIT |
| @testing-library/react | 16.3.3 | MIT |
| @testing-library/dom | 10.4.2 | MIT |
| eslint | 10.12.0 | MIT |
| @eslint/js | 10.0.1 | MIT |
| typescript-eslint | 8.71.1 | MIT |
| eslint-plugin-react-hooks | 7.1.1 | MIT |
| globals | 17.13.0 | MIT |
| prettier | 3.9.10 | MIT |
| @types/node | 24.19.2 | MIT |
| @types/react, @types/react-dom | 19.3.0 | MIT |

## Font (dibundel ke situs)

| Paket | Versi | Lisensi | Hak cipta (dari `LICENSE` paket) |
|---|---|---|---|
| @fontsource/space-grotesk | 5.3.0 | OFL-1.1 | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) |
| @fontsource/space-mono | 5.3.0 | OFL-1.1 | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) |

Teks SIL Open Font License 1.1 lengkap ada di `node_modules/@fontsource/<font>/LICENSE`. Font tidak dimodifikasi dan tidak dijual terpisah.

## Aset

| Aset | Lokasi | Pencipta | Lisensi | Sumber |
|---|---|---|---|---|
| Set bidak Chessnut (12 SVG, tidak dimodifikasi) | `public/bidak/chessnut/` | Alexis Luengas, Copyright 2015 | Apache-2.0 (`public/bidak/chessnut/LISENSI`, `COPYRIGHT`) | https://github.com/LexLuengas/chessnut-pieces commit `2b8eaf14a31edad7e9deb53b1473e1d4857868a9`; lisensi dikonfirmasi juga di https://github.com/lichess-org/lila/blob/master/COPYING.md |
| Ikon label langkah (10 SVG) | `src/komponen/ikon/LabelLangkah.tsx` | dibuat untuk proyek ini | GPL-3.0-only | — |
| Favicon | `public/ikon.svg` | dibuat untuk proyek ini | GPL-3.0-only | — |

Bidak bawaan `react-chessboard` tidak dipakai; asal desainnya tidak tercatat di paket (UNKNOWN), jadi diganti Chessnut.
