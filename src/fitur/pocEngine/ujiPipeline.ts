import type { KlienChesscom } from '../../inti/chesscom/klien'
import { normalisasiPermainan } from '../../inti/chesscom/normalisasiPermainan'
import type { BasisDataTelaah } from '../../inti/data/basisData'
import {
  ambilPosisiPermainan,
  cacheEvaluasiDexie,
  simpanPermainan,
} from '../../inti/data/penyimpanan'
import type { Permainan, Posisi } from '../../inti/data/tipe'
import type { KonfigurasiAnalisis } from '../../inti/engine/konfigurasiAnalisis'
import {
  mulaiPipeline,
  type PenyediaPencarian,
  type ProgresAnalisis,
} from '../../inti/engine/pipelineAnalisis'
import { uraiPgn } from '../../inti/pgn/uraiPgn'

// Kriteria P6: analisis ulang game yang sama dari cache
export const BATAS_RUN_KEDUA_MS = 1000
// Jumlah bulan arsip terbaru yang diperiksa untuk mencari game terakhir
const BATAS_BULAN_DICARI = 3

export async function siapkanGameTerakhir(
  klien: KlienChesscom,
  db: BasisDataTelaah,
  username: string,
  signal?: AbortSignal,
): Promise<{ permainan: Permainan; posisi: Posisi[] }> {
  const { archives } = await klien.ambilDaftarArsip(username, { signal })
  for (const url of archives.slice(-BATAS_BULAN_DICARI).reverse()) {
    const { games } = await klien.ambilPermainanBulanan(url, { signal })
    const terakhir = [...games].reverse().find((g) => g.rules === 'chess')
    if (!terakhir) continue
    const permainan = normalisasiPermainan(terakhir, username)
    if (!permainan.didukung) throw new Error(permainan.alasanTidakDidukung ?? 'Game belum didukung')
    await simpanPermainan(db, permainan, uraiPgn(permainan.pgn).posisi)
    return { permainan, posisi: await ambilPosisiPermainan(db, permainan.id) }
  }
  throw new Error(`Tidak ada game standar dalam ${BATAS_BULAN_DICARI} bulan arsip terakhir.`)
}

export interface HasilRun {
  waktuMs: number
  panggilanEngine: number
  dariCache: number
  total: number
}

export async function jalankanRun(
  posisi: readonly Posisi[],
  penyedia: PenyediaPencarian,
  db: BasisDataTelaah,
  konfigurasi: KonfigurasiAnalisis,
  versiEngine: string,
  signal?: AbortSignal,
  padaProgres?: (p: ProgresAnalisis) => void,
): Promise<HasilRun> {
  let panggilanEngine = 0
  let dariCache = 0
  const penghitung: PenyediaPencarian = {
    cari: (p, s) => {
      panggilanEngine++
      return penyedia.cari(p, s)
    },
  }
  const mulai = performance.now()
  await mulaiPipeline({
    posisi,
    penyedia: penghitung,
    cache: cacheEvaluasiDexie(db),
    konfigurasi,
    versiEngine,
    signal,
    padaProgres: (p) => {
      dariCache = p.dariCache
      padaProgres?.(p)
    },
  }).hasil
  return { waktuMs: performance.now() - mulai, panggilanEngine, dariCache, total: posisi.length }
}
