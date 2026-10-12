// Harus sama dengan versi paket stockfish terpasang; skrip/salinEngine.mjs memeriksanya.
export const VERSI_PAKET_ENGINE = '19.0.1'
export const BERKAS_ENGINE = 'stockfish-19-lite-single.js'
export const VERSI_ENGINE = `stockfish.js ${VERSI_PAKET_ENGINE} lite-single`

// ASUMSI: 16 MB per Worker cukup untuk go nodes <= 1e6; disetel setelah benchmark
export const HASH_MB = 16

// ASUMSI: batas waktu = dasar + nodes / NPS_TERENDAH_ASUMSI (perangkat paling lambat ~20k nps)
export const BATAS_WAKTU_DASAR_MS = 10_000
export const NPS_TERENDAH_ASUMSI = 20_000
export const BATAS_WAKTU_MULAI_MS = 20_000
// Tenggang menunggu "bestmove" setelah "stop"
export const TENGGANG_STOP_MS = 5_000

export function batasWaktuCariMs(nodes: number): number {
  return BATAS_WAKTU_DASAR_MS + (nodes / NPS_TERENDAH_ASUMSI) * 1000
}

// Blueprint §4 (ASUMSI): laptop min(4, hardwareConcurrency - 1), HP 2
export function jumlahWorkerBawaan(hardwareConcurrency: number, seluler: boolean): number {
  if (seluler) return 2
  return Math.max(1, Math.min(4, hardwareConcurrency - 1))
}

export function urlEngine(dasar: string): string {
  return `${dasar.replace(/\/?$/, '/')}engine/${BERKAS_ENGINE}`
}
