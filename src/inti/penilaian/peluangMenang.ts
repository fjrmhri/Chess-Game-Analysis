import type { Skor } from '../engine/uci'
import type { KonfigurasiPenilaian } from './konfigurasiPenilaian'

/** k(R) = k0 * (1 + beta * (R - 1500) / 1000). */
export function hitungK(rating: number, kurva: KonfigurasiPenilaian['kurva']): number {
  return kurva.k0 * (1 + (kurva.beta * (rating - 1500)) / 1000)
}

/**
 * Expected points pemain yang melangkah: 1 / (1 + exp(-k(R) * cp)), cp dibatasi ±batasCp.
 * Mat untuk pemain yang melangkah = 1; dimat (termasuk mate 0) = 0.
 */
export function hitungPeluangMenang(
  skor: Skor,
  rating: number,
  kurva: KonfigurasiPenilaian['kurva'],
): number {
  if (skor.jenis === 'mat') return skor.nilai > 0 ? 1 : 0
  const cp = Math.max(-kurva.batasCp, Math.min(kurva.batasCp, skor.nilai))
  return 1 / (1 + Math.exp(-hitungK(rating, kurva) * cp))
}

/** poinHilang = max(0, epTerbaik - epDimainkan). */
export function hitungPoinHilang(epTerbaik: number, epDimainkan: number): number {
  return Math.max(0, epTerbaik - epDimainkan)
}
