import type { KonfigurasiPenilaian } from './konfigurasiPenilaian'
import type { LabelLangkah } from './label'

/** Pita resmi expected points (batas atas inklusif). */
export function labelDariPita(
  poinHilang: number,
  langkahTerbaik: boolean,
  konfigurasi: Pick<KonfigurasiPenilaian, 'pita' | 'toleransiBest'>,
): LabelLangkah {
  const { pita, toleransiBest } = konfigurasi
  if (langkahTerbaik || poinHilang <= toleransiBest) return 'best'
  if (poinHilang <= pita.excellent) return 'excellent'
  if (poinHilang <= pita.good) return 'good'
  if (poinHilang <= pita.inaccuracy) return 'inaccuracy'
  if (poinHilang <= pita.mistake) return 'mistake'
  return 'blunder'
}

export interface KonteksLangkah {
  ply: number
  langkahUci: string
  /** Tepat satu langkah legal di posisi sebelum langkah. */
  paksa: boolean
  epTerbaik: number
  epDimainkan: number
  /** EP alternatif kedua (MultiPV 2) dari posisi sebelum langkah, bila ada. */
  epAlternatifKedua?: number
  poinHilang: number
  langkahTerbaik: string | null
  /** poinHilang langkah lawan sebelumnya (untuk Great/Miss). */
  poinHilangLawanSebelumnya?: number
  ratingPemain: number
}

export interface HasilKlasifikasi {
  label: LabelLangkah
  alasan: string[]
}

/** Penentu khusus (Book/Brilliant/Great/Miss) dicoba berurutan sebelum pita resmi; null = tidak berlaku. */
export type PenentuKhusus = (
  k: KonteksLangkah,
  konfigurasi: KonfigurasiPenilaian,
) => HasilKlasifikasi | null

/** MVP (P7): belum ada penentu khusus; Book/Brilliant/Great/Miss diisi di P10. */
export const PENENTU_KHUSUS_MVP: readonly PenentuKhusus[] = []

export function klasifikasiLangkah(
  k: KonteksLangkah,
  konfigurasi: KonfigurasiPenilaian,
  penentuKhusus: readonly PenentuKhusus[] = PENENTU_KHUSUS_MVP,
): HasilKlasifikasi {
  if (k.paksa) return { label: 'best', alasan: ['paksa'] }
  for (const penentu of penentuKhusus) {
    const hasil = penentu(k, konfigurasi)
    if (hasil) return hasil
  }
  const terbaik = k.langkahTerbaik !== null && k.langkahUci === k.langkahTerbaik
  const label = labelDariPita(k.poinHilang, terbaik, konfigurasi)
  return { label, alasan: [terbaik ? 'langkah-terbaik-engine' : 'pita-resmi'] }
}
