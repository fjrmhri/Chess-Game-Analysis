import type { Permainan } from '../../inti/data/tipe'

const NAMA_KELAS: Record<string, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  daily: 'Daily',
}

export function namaKelasWaktu(timeClass: string): string {
  return NAMA_KELAS[timeClass] ?? timeClass
}

function menitDetik(detik: number): string {
  if (detik % 60 === 0) return String(detik / 60)
  return detik < 60
    ? `${detik} dtk`
    : `${Math.floor(detik / 60)}:${String(detik % 60).padStart(2, '0')}`
}

/** time_control PubAPI: "600", "180+2", "1/86400" (daily), "-" (tanpa jam). */
export function formatKontrolWaktu(timeClass: string, timeControl: string): string {
  const kelas = namaKelasWaktu(timeClass)
  const daily = /^1\/(\d+)$/.exec(timeControl)
  if (daily) {
    const hari = Number(daily[1]) / 86400
    return `${kelas} ${Number.isInteger(hari) ? hari : hari.toFixed(1)} hari`
  }
  const live = /^(\d+)(?:\+(\d+))?$/.exec(timeControl)
  if (live) return `${kelas} ${menitDetik(Number(live[1]))}+${live[2] ?? '0'}`
  return kelas
}

const SEBAB: Record<string, string> = {
  checkmated: 'skakmat',
  resigned: 'menyerah',
  timeout: 'waktu habis',
  abandoned: 'ditinggalkan',
  lose: 'kalah',
  kingofthehill: 'king of the hill',
  threecheck: 'tiga skak',
  bughousepartnerlose: 'rekan bughouse kalah',
  agreed: 'disepakati',
  repetition: 'repetisi',
  stalemate: 'stalemate',
  insufficient: 'material kurang',
  '50move': 'aturan 50 langkah',
  timevsinsufficient: 'waktu habis vs material kurang',
}

const NAMA_HASIL = {
  menang: 'Menang',
  kalah: 'Kalah',
  remis: 'Remis',
  'tidak-diketahui': 'Tidak diketahui',
}

/** "Menang · skakmat": sebab diambil dari kode pihak yang kalah (atau kode remis). */
export function formatHasil(p: Pick<Permainan, 'hasilSaya' | 'hasilPutih' | 'hasilHitam'>): string {
  const kodeSebab = p.hasilPutih === 'win' ? p.hasilHitam : p.hasilPutih
  const sebab = SEBAB[kodeSebab]
  return sebab ? `${NAMA_HASIL[p.hasilSaya]} · ${sebab}` : NAMA_HASIL[p.hasilSaya]
}

/** Kunci bulan "YYYY-MM" (UTC) dari endTime detik. */
export function kunciBulan(endTimeDetik: number): string {
  const d = new Date(endTimeDetik * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** URL arsip PubAPI .../games/2026/10 -> "2026-10". */
export function kunciBulanDariArsip(url: string): string {
  const cocok = /\/games\/(\d{4})\/(\d{2})$/.exec(url)
  return cocok ? `${cocok[1]}-${cocok[2]}` : url
}

const NAMA_BULAN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

export function namaBulan(kunci: string): string {
  const [tahun, bulan] = kunci.split('-')
  return `${NAMA_BULAN[Number(bulan) - 1] ?? bulan} ${tahun}`
}

export function formatTanggal(endTimeDetik: number): string {
  return new Date(endTimeDetik * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
