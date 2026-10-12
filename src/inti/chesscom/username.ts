import { GalatChesscom } from './galat'

// ASUMSI: aturan username chess.com = 3–25 karakter huruf/angka/_/-; tidak terdokumentasi resmi
const POLA_USERNAME = /^[a-z0-9_-]{3,25}$/

export function normalisasiUsername(masukan: string): string {
  const hasil = masukan.trim().toLowerCase()
  if (!POLA_USERNAME.test(hasil)) throw new GalatChesscom('UsernameTidakValid')
  return hasil
}
