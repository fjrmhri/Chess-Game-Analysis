import type { HasilSaya, Permainan, Warna } from '../../inti/data/tipe'
import { kunciBulan } from './formatPermainan'

export const PER_HALAMAN = 20

export interface FilterDaftar {
  kelas?: string
  hasil?: HasilSaya
  warna?: Warna
  /** "YYYY-MM" */
  bulan?: string
  lawan?: string
  hal: number
}

const HASIL_SAH: readonly HasilSaya[] = ['menang', 'kalah', 'remis', 'tidak-diketahui']
const WARNA_SAH: readonly Warna[] = ['putih', 'hitam']

export function uraiFilter(query: URLSearchParams): FilterDaftar {
  const hasil = query.get('hasil')
  const warna = query.get('warna')
  const bulan = query.get('bulan')
  const hal = Number(query.get('hal'))
  const kelas = query.get('kelas')?.trim()
  const lawan = query.get('lawan')?.trim()
  return {
    ...(kelas ? { kelas } : {}),
    ...(hasil && (HASIL_SAH as readonly string[]).includes(hasil)
      ? { hasil: hasil as HasilSaya }
      : {}),
    ...(warna && (WARNA_SAH as readonly string[]).includes(warna) ? { warna: warna as Warna } : {}),
    ...(bulan && /^\d{4}-\d{2}$/.test(bulan) ? { bulan } : {}),
    ...(lawan ? { lawan } : {}),
    hal: Number.isInteger(hal) && hal >= 1 ? hal : 1,
  }
}

export function filterKeQuery(f: FilterDaftar): URLSearchParams {
  const q = new URLSearchParams()
  if (f.kelas) q.set('kelas', f.kelas)
  if (f.hasil) q.set('hasil', f.hasil)
  if (f.warna) q.set('warna', f.warna)
  if (f.bulan) q.set('bulan', f.bulan)
  if (f.lawan) q.set('lawan', f.lawan)
  if (f.hal > 1) q.set('hal', String(f.hal))
  return q
}

export function terapkanFilter(daftar: readonly Permainan[], f: FilterDaftar): Permainan[] {
  const lawan = f.lawan?.toLowerCase()
  return daftar
    .filter(
      (p) =>
        (!f.kelas || p.timeClass === f.kelas) &&
        (!f.hasil || p.hasilSaya === f.hasil) &&
        (!f.warna || p.warnaSaya === f.warna) &&
        (!f.bulan || kunciBulan(p.endTime) === f.bulan) &&
        (!lawan || p.lawan.toLowerCase().includes(lawan)),
    )
    .sort((a, b) => b.endTime - a.endTime)
}

export interface Halaman<T> {
  data: T[]
  hal: number
  jumlahHalaman: number
  total: number
}

/** Halaman di luar rentang dibatasi ke halaman terakhir/pertama. */
export function ambilHalaman<T>(
  daftar: readonly T[],
  hal: number,
  perHalaman = PER_HALAMAN,
): Halaman<T> {
  const jumlahHalaman = Math.max(1, Math.ceil(daftar.length / perHalaman))
  const halSah = Math.min(Math.max(1, hal), jumlahHalaman)
  return {
    data: daftar.slice((halSah - 1) * perHalaman, halSah * perHalaman),
    hal: halSah,
    jumlahHalaman,
    total: daftar.length,
  }
}
