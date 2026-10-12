import { KolamMesin } from '../../inti/engine/kolamMesin'
import { MesinCatur, type OpsiMesin } from '../../inti/engine/mesinCatur'
import type { SaluranUci } from '../../inti/engine/saluran'

// Kriteria PoC 2 (blueprint §7)
export const BATAS_100K_LAPTOP_MS = 300
export const BATAS_100K_SELULER_MS = 1500
export const TARGET_PERCEPATAN_3_WORKER = 2.3

export interface BarisTunggal {
  posisi: string
  nodes: number
  waktuMs: number
  nps: number
  kedalaman: number | undefined
}

export interface BarisKolam {
  jumlahWorker: number
  waktuMs: number
  percepatan: number
  /** Diisi bila kolam gagal dimulai (mis. memori Wasm habis); pengujian jumlah lebih besar dihentikan. */
  galat?: string
}

export interface HasilUcinewgame {
  perPosisiMs: number
  sekaliMs: number
  deterministik: boolean
}

type Pabrik = () => SaluranUci
type Waktu = () => number

export async function ukurMuat(
  pabrik: Pabrik,
  sekarang: Waktu,
): Promise<{ mesin: MesinCatur; muatMs: number }> {
  const mulai = sekarang()
  const mesin = new MesinCatur(pabrik())
  await mesin.mulai()
  return { mesin, muatMs: sekarang() - mulai }
}

export async function benchmarkTunggal(
  mesin: MesinCatur,
  posisi: readonly { nama: string; fen: string }[],
  daftarNodes: readonly number[],
  signal?: AbortSignal,
  padaBaris?: (b: BarisTunggal) => void,
): Promise<BarisTunggal[]> {
  const hasil: BarisTunggal[] = []
  for (const nodes of daftarNodes) {
    for (const p of posisi) {
      const h = await mesin.cari({ fen: p.fen, nodes, multiPv: 1, ucinewgame: true }, signal)
      const baris = {
        posisi: p.nama,
        nodes: h.nodes ?? nodes,
        waktuMs: h.waktuMs,
        nps: Math.round(((h.nodes ?? nodes) / h.waktuMs) * 1000),
        kedalaman: h.kedalaman,
      }
      hasil.push(baris)
      padaBaris?.(baris)
    }
  }
  return hasil
}

export async function benchmarkKolam(
  pabrik: Pabrik,
  daftarJumlah: readonly number[],
  daftarFen: readonly string[],
  nodes: number,
  sekarang: Waktu,
  signal?: AbortSignal,
  padaBaris?: (b: BarisKolam) => void,
  opsiMesin?: OpsiMesin,
): Promise<BarisKolam[]> {
  const hasil: BarisKolam[] = []
  let dasarMs: number | undefined
  for (const jumlah of daftarJumlah) {
    const kolam = new KolamMesin({ jumlah, pabrikSaluran: pabrik, opsiMesin })
    try {
      try {
        await kolam.mulai()
      } catch (e) {
        const baris = {
          jumlahWorker: jumlah,
          waktuMs: Number.NaN,
          percepatan: Number.NaN,
          galat: e instanceof Error ? e.message : String(e),
        }
        hasil.push(baris)
        padaBaris?.(baris)
        break
      }
      const mulai = sekarang()
      await Promise.all(
        daftarFen.map((fen) => kolam.cari({ fen, nodes, multiPv: 1, ucinewgame: true }, signal)),
      )
      const waktuMs = sekarang() - mulai
      dasarMs ??= waktuMs
      const baris = { jumlahWorker: jumlah, waktuMs, percepatan: dasarMs / waktuMs }
      hasil.push(baris)
      padaBaris?.(baris)
    } finally {
      kolam.tutup()
    }
  }
  return hasil
}

/** Biaya "ucinewgame" per posisi vs sekali per game, dan cek determinisme (KEPUTUSAN butir 6). */
export async function ukurUcinewgame(
  mesin: MesinCatur,
  daftarFen: readonly string[],
  nodes: number,
  sekarang: Waktu,
  signal?: AbortSignal,
): Promise<HasilUcinewgame> {
  let mulai = sekarang()
  for (const fen of daftarFen)
    await mesin.cari({ fen, nodes, multiPv: 2, ucinewgame: true }, signal)
  const perPosisiMs = sekarang() - mulai

  mulai = sekarang()
  for (const [i, fen] of daftarFen.entries()) {
    await mesin.cari({ fen, nodes, multiPv: 2, ucinewgame: i === 0 }, signal)
  }
  const sekaliMs = sekarang() - mulai

  const fen = daftarFen[0] ?? ''
  const a = await mesin.cari({ fen, nodes, multiPv: 2, ucinewgame: true }, signal)
  const b = await mesin.cari({ fen, nodes, multiPv: 2, ucinewgame: true }, signal)
  const deterministik =
    JSON.stringify(a.garis) === JSON.stringify(b.garis) && a.langkahTerbaik === b.langkahTerbaik
  return { perPosisiMs, sekaliMs, deterministik }
}

export function rataRata(angka: readonly number[]): number {
  return angka.length ? angka.reduce((a, b) => a + b, 0) / angka.length : Number.NaN
}

export function nilaiKecepatan(baris: readonly BarisTunggal[], seluler: boolean) {
  const rata100k = rataRata(baris.filter((b) => b.nodes < 200_000).map((b) => b.waktuMs))
  const batas = seluler ? BATAS_100K_SELULER_MS : BATAS_100K_LAPTOP_MS
  return { rata100k, batas, lulus: rata100k <= batas }
}

export function nilaiKolam(baris: readonly BarisKolam[]) {
  const tiga = baris.find((b) => b.jumlahWorker === 3 && !b.galat)
  if (!tiga) return { percepatan3: undefined, lulus: undefined }
  return { percepatan3: tiga.percepatan, lulus: tiga.percepatan >= TARGET_PERCEPATAN_3_WORKER }
}
