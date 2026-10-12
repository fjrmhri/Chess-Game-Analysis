/** Semua parameter penilaian. Mengubah nilai apa pun wajib menaikkan VERSI_ALGORITMA. */
export const VERSI_ALGORITMA = 'p7-mvp-1'

export interface KonfigurasiPenilaian {
  versiAlgoritma: string
  kurva: {
    /** Konstanta Lichess (TERVERIFIKASI, scalachess WinPercent MULTIPLIER). */
    k0: number
    /** k(R) = k0 * (1 + beta * (R - 1500) / 1000). */
    beta: number
    batasCp: number
  }
  /** Pita expected points resmi (Help Center chess.com); tidak diubah saat kalibrasi. */
  pita: {
    excellent: number
    good: number
    inaccuracy: number
    mistake: number
  }
  toleransiBest: number
  kategori: {
    menang: number
    seimbangBawah: number
    seimbangAtas: number
  }
  brilliant: {
    epDimainkanMin: number
    epAlternatifKeduaMaks: number
    ratingRendah: number
  }
  great: {
    celahAlternatifKedua: number
    kesalahanLawanMin: number
  }
  miss: {
    kesalahanLawanMin: number
    poinHilangMin: number
  }
  book: {
    poinHilangMaks: number
  }
  akurasiMiripChessCom: {
    a: number
    p: number
    langkahPaksa: 'keluarkan' | 'seratus'
  }
}

export const KONFIGURASI_PENILAIAN: KonfigurasiPenilaian = {
  versiAlgoritma: VERSI_ALGORITMA,
  kurva: {
    k0: 0.00368208,
    // ASUMSI: beta 0 (kurva tidak bergantung rating) sampai dikalibrasi
    beta: 0,
    // ASUMSI (blueprint §2): cp dibatasi ±1500 untuk EP
    batasCp: 1500,
  },
  pita: { excellent: 0.02, good: 0.05, inaccuracy: 0.1, mistake: 0.2 },
  // ASUMSI (KEPUTUSAN butir 4): Best bila bestmove engine atau poinHilang <= 0,003
  toleransiBest: 0.003,
  // ASUMSI (KEPUTUSAN butir 3): MENANG >= 0,75; SEIMBANG 0,40–0,60
  kategori: { menang: 0.75, seimbangBawah: 0.4, seimbangAtas: 0.6 },
  // ASUMSI (blueprint §3, KEPUTUSAN butir 3): ambang awal Brilliant
  brilliant: { epDimainkanMin: 0.45, epAlternatifKeduaMaks: 0.9, ratingRendah: 1200 },
  // ASUMSI (blueprint §3): celah ke alternatif kedua 0,18; kesalahan lawan sebelumnya 0,10
  great: { celahAlternatifKedua: 0.18, kesalahanLawanMin: 0.1 },
  // ASUMSI (blueprint §3)
  miss: { kesalahanLawanMin: 0.1, poinHilangMin: 0.05 },
  // ASUMSI (blueprint §3)
  book: { poinHilangMaks: 0.05 },
  // ASUMSI (blueprint §2, metodologi ChessGrader; KEPUTUSAN butir 1 untuk langkah paksa)
  akurasiMiripChessCom: { a: 7.2, p: 1.75, langkahPaksa: 'seratus' },
}
