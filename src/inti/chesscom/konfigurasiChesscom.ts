export const URL_DASAR_PUBAPI = 'https://api.chess.com'

// CLAUDE.md: cache PubAPI minimal 12 jam (berlaku juga untuk bulan berjalan, KEPUTUSAN.md P3-K2)
export const TTL_CACHE_MS = 12 * 60 * 60 * 1000

// Total percobaan termasuk yang pertama
export const MAKS_PERCOBAAN = 3

// Backoff eksponensial: jeda = JEDA_DASAR_MS * 2^(percobaan-1) -> 1 s, 2 s
export const JEDA_DASAR_MS = 1000

// Batas atas jeda dari header Retry-After agar UI tidak menggantung
export const BATAS_RETRY_AFTER_MS = 60_000
