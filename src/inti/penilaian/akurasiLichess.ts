import type { Skor } from '../engine/uci'

// Sumber (TERVERIFIKASI 12 Okt 2026): lichess-org/lila modules/analyse AccuracyPercent.scala,
// lichess-org/scalachess core eval.scala (WinPercent), lichess-org/scalalib Maths.scala.

export const KONSTANTA_LICHESS = {
  multiplier: 0.00368208,
  plafonCp: 1000,
  cpAwalPutih: 15,
  a: 103.1668100711649,
  k: 0.04354415386753951,
  b: -3.166924740191411,
  bonusKetidakpastian: 1,
} as const

/** Win% Lichess dari cp sudut pandang putih: 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1), cp dibatasi ±1000. */
export function winPercentLichess(cpPutih: number): number {
  const cp = Math.max(-KONSTANTA_LICHESS.plafonCp, Math.min(KONSTANTA_LICHESS.plafonCp, cpPutih))
  const peluang = 2 / (1 + Math.exp(-KONSTANTA_LICHESS.multiplier * cp)) - 1
  return 50 + 50 * Math.max(-1, Math.min(1, peluang))
}

/** Skor engine (sudut pandang pemain yang melangkah) ke cp putih; mat = ±1000 (forceAsCp/plafon). */
export function cpPutihDariSkor(skor: Skor, giliran: 'w' | 'b'): number {
  const cp =
    skor.jenis === 'cp'
      ? skor.nilai
      : skor.nilai > 0
        ? KONSTANTA_LICHESS.plafonCp
        : -KONSTANTA_LICHESS.plafonCp
  return giliran === 'w' ? cp : -cp
}

/** Akurasi satu langkah: 100 bila tidak turun, selain itu a*exp(-k*selisih)+b+1, dibatasi [0, 100]. */
export function akurasiLangkahLichess(winSebelum: number, winSesudah: number): number {
  if (winSesudah >= winSebelum) return 100
  const selisih = winSebelum - winSesudah
  const mentah =
    KONSTANTA_LICHESS.a * Math.exp(-KONSTANTA_LICHESS.k * selisih) +
    KONSTANTA_LICHESS.b +
    KONSTANTA_LICHESS.bonusKetidakpastian
  return Math.max(0, Math.min(100, mentah))
}

function simpanganBaku(nilai: readonly number[]): number {
  const rata = nilai.reduce((a, b) => a + b, 0) / nilai.length
  return Math.sqrt(nilai.reduce((s, x) => s + (x - rata) ** 2, 0) / nilai.length)
}

function rataHarmonik(nilai: readonly number[]): number {
  return nilai.length / nilai.reduce((s, v) => s + 1 / Math.max(1, v), 0)
}

function rataTerbobot(pasangan: readonly [number, number][]): number | undefined {
  const [jumlah, bobot] = pasangan.reduce(([sv, sw], [v, w]) => [sv + v * w, sw + w], [0, 0])
  return bobot === 0 ? undefined : jumlah / bobot
}

export interface AkurasiPermainan {
  putih: number | undefined
  hitam: number | undefined
  /** Akurasi per langkah, indeks i = langkah ke-(i+1). */
  perLangkah: number[]
}

/**
 * gameAccuracy Lichess. cpPutih[i] = evaluasi (cp putih) setelah ply i+1.
 * Rata-rata dari rata terbobot volatilitas (jendela geser) dan rata harmonik.
 */
export function hitungAkurasiLichess(
  cpPutih: readonly number[],
  warnaAwal: 'w' | 'b',
  cpAwal: number = KONSTANTA_LICHESS.cpAwalPutih,
): AkurasiPermainan {
  const win = [cpAwal, ...cpPutih].map(winPercentLichess)
  // windowSize = (jumlah evaluasi / 10) dibatasi [2, 8]
  const ukuranJendela = Math.max(2, Math.min(8, Math.floor(cpPutih.length / 10)))
  const jendela = [
    ...Array.from({ length: Math.max(0, Math.min(ukuranJendela, win.length) - 2) }, () =>
      win.slice(0, ukuranJendela),
    ),
    ...Array.from({ length: Math.max(0, win.length - ukuranJendela + 1) }, (_, i) =>
      win.slice(i, i + ukuranJendela),
    ),
  ]
  // Bobot = simpangan baku populasi jendela, dibatasi [0,5; 12]
  const bobot = jendela.map((j) => Math.max(0.5, Math.min(12, simpanganBaku(j))))

  const perLangkah: number[] = []
  const perWarna: Record<'w' | 'b', [number, number][]> = { w: [], b: [] }
  for (let i = 0; i + 1 < win.length; i++) {
    const sebelum = win[i] ?? 50
    const sesudah = win[i + 1] ?? 50
    const putih = (i % 2 === 0) === (warnaAwal === 'w')
    const akurasi = putih
      ? akurasiLangkahLichess(sebelum, sesudah)
      : akurasiLangkahLichess(sesudah, sebelum)
    perLangkah.push(akurasi)
    const w = bobot[i]
    if (w !== undefined) perWarna[putih ? 'w' : 'b'].push([akurasi, w])
  }

  const akurasiWarna = (warna: 'w' | 'b') => {
    const data = perWarna[warna]
    if (data.length === 0) return undefined
    const terbobot = rataTerbobot(data)
    if (terbobot === undefined) return undefined
    return (terbobot + rataHarmonik(data.map(([a]) => a))) / 2
  }
  return { putih: akurasiWarna('w'), hitam: akurasiWarna('b'), perLangkah }
}
