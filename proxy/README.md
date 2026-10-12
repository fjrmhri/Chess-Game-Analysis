# telaah-proxy

Cloudflare Worker cadangan. Dipakai hanya bila request langsung dari browser ke `api.chess.com` gagal karena CORS. Hanya meneruskan `GET /pub/*` dari origin di `ORIGIN_DIIZINKAN`.

Status: belum di-deploy. Dependensi (`wrangler`) belum dipasang; dipasang saat deploy (P15).

Sebelum deploy:

1. Isi `USER_AGENT` di `wrangler.jsonc` dengan kontak Anda.
2. Tambahkan origin produksi ke `ORIGIN_DIIZINKAN`.
3. Di folder ini: `npm install`, lalu `npm run deploy` (login Cloudflare diminta pertama kali).
4. Isi `VITE_URL_PROXY` di aplikasi dengan URL Worker.

Catatan: header `Origin` bisa dipalsukan oleh klien non-browser, jadi pembatasan origin hanya mencegah situs lain memakai proxy dari browser, bukan pengamanan penuh.
