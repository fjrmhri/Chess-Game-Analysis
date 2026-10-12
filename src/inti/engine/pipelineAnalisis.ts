import { Chess } from 'chess.js'
import type { Evaluasi } from '../data/tipe'
import type { KonfigurasiAnalisis } from './konfigurasiAnalisis'
import { GalatEngine, type HasilCari, type PermintaanCari } from './mesinCatur'
import type { GarisHasil } from './uci'

export interface PosisiMasukan {
  ply: number
  fen: string
  isTerminal: boolean
}

export interface PenyediaPencarian {
  cari(permintaan: PermintaanCari, signal?: AbortSignal): Promise<HasilCari>
}

export interface CacheEvaluasi {
  ambil(
    fen: string,
    nodes: number,
    multiPv: number,
    versiEngine: string,
  ): Promise<Evaluasi | undefined>
  simpan(hasil: HasilCari): Promise<void>
  /** Mengubah garis tersimpan ke bentuk engine. */
  keGaris(evaluasi: Evaluasi): GarisHasil[]
}

export type SumberEvaluasi = 'engine' | 'cache' | 'sintetis'
export type Tahap = 'A' | 'B'

export interface HasilPosisi {
  ply: number
  fen: string
  tahap: Tahap
  sumber: SumberEvaluasi
  /** Tepat satu langkah legal. */
  paksa: boolean
  garis: GarisHasil[]
  langkahTerbaik: string | null
  nodes: number
  multiPv: number
  waktuMs?: number
}

export interface ProgresAnalisis {
  tahap: Tahap
  selesai: number
  total: number
  dariCache: number
  sisaMs?: number
}

/** Memilih ply untuk Tahap B dari hasil Tahap A (implementasi lengkap di P10/P11). */
export type PenentuPosisiKritis = (hasilTahapA: readonly HasilPosisi[]) => number[]

export const penentuKosong: PenentuPosisiKritis = () => []

export interface OpsiPipeline {
  posisi: readonly PosisiMasukan[]
  penyedia: PenyediaPencarian
  konfigurasi: KonfigurasiAnalisis
  versiEngine: string
  cache?: CacheEvaluasi
  penentuKritis?: PenentuPosisiKritis
  signal?: AbortSignal
  plyFokus?: number
  padaHasil?: (h: HasilPosisi) => void
  padaProgres?: (p: ProgresAnalisis) => void
  sekarang?: () => number
}

export interface PipelineBerjalan {
  hasil: Promise<HasilPosisi[]>
  /** Posisi terdekat dengan ply ini dikirim ke engine lebih dulu. */
  aturFokus(ply: number | undefined): void
}

function infoPosisi(fen: string): { paksa: boolean; mat: boolean } {
  const papan = new Chess(fen)
  return { paksa: papan.moves().length === 1, mat: papan.isCheckmate() }
}

/** Mat: pemain yang melangkah kalah (mate 0). Remis menurut aturan: cp 0 (= 0,5). */
function hasilSintetis(p: PosisiMasukan, mat: boolean): HasilPosisi {
  return {
    ply: p.ply,
    fen: p.fen,
    tahap: 'A',
    sumber: 'sintetis',
    paksa: false,
    garis: [
      {
        multiPv: 1,
        skor: mat ? { jenis: 'mat', nilai: 0 } : { jenis: 'cp', nilai: 0 },
        pv: [],
        kedalaman: 0,
      },
    ],
    langkahTerbaik: null,
    nodes: 0,
    multiPv: 1,
  }
}

export function mulaiPipeline(opsi: OpsiPipeline): PipelineBerjalan {
  const sekarang = opsi.sekarang ?? (() => performance.now())
  const internal = new AbortController()
  const batal = () => internal.abort()
  if (opsi.signal?.aborted) internal.abort()
  opsi.signal?.addEventListener('abort', batal, { once: true })
  let fokus = opsi.plyFokus

  async function jalankanTahap(
    tahap: Tahap,
    daftar: readonly PosisiMasukan[],
    anggaran: { nodes: number; multiPv: number },
    paksaPer: Map<number, boolean>,
    terima: (h: HasilPosisi) => void,
    totalTahap: number,
    selesaiAwal: number,
  ): Promise<void> {
    let selesai = selesaiAwal
    let dariCache = 0
    let waktuEngineTotal = 0
    let jumlahEngine = 0
    const laporkan = () => {
      const sisa = totalTahap - selesai
      const rata = jumlahEngine ? waktuEngineTotal / jumlahEngine : undefined
      opsi.padaProgres?.({
        tahap,
        selesai,
        total: totalTahap,
        dariCache,
        ...(rata === undefined
          ? {}
          : { sisaMs: (rata * sisa) / Math.max(1, opsi.konfigurasi.jumlahWorker) }),
      })
    }
    const catatSelesai = (h: HasilPosisi) => {
      selesai++
      terima(h)
      opsi.padaHasil?.(h)
      laporkan()
    }

    const antrean: PosisiMasukan[] = []
    for (const p of daftar) {
      if (internal.signal.aborted) throw new GalatEngine('Dibatalkan')
      const tersimpan = await opsi.cache
        ?.ambil(p.fen, anggaran.nodes, anggaran.multiPv, opsi.versiEngine)
        .catch(() => undefined)
      if (tersimpan && opsi.cache) {
        dariCache++
        catatSelesai({
          ply: p.ply,
          fen: p.fen,
          tahap,
          sumber: 'cache',
          paksa: paksaPer.get(p.ply) ?? false,
          garis: opsi.cache.keGaris(tersimpan).slice(0, anggaran.multiPv),
          langkahTerbaik: tersimpan.langkahTerbaik,
          nodes: tersimpan.anggaranNodes,
          multiPv: Math.min(tersimpan.multiPv, anggaran.multiPv),
        })
      } else {
        antrean.push(p)
      }
    }
    laporkan()

    await new Promise<void>((selesaiSemua, gagal) => {
      let berjalan = 0
      let berhenti = false
      const ambilBerikut = (): PosisiMasukan | undefined => {
        if (antrean.length === 0) return undefined
        let indeks = 0
        if (fokus !== undefined) {
          const f = fokus
          antrean.forEach((p, i) => {
            const terbaik = antrean[indeks]
            if (terbaik && Math.abs(p.ply - f) < Math.abs(terbaik.ply - f)) indeks = i
          })
        }
        return antrean.splice(indeks, 1)[0]
      }
      const jadwalkan = () => {
        if (berhenti) return
        if (antrean.length === 0 && berjalan === 0) {
          selesaiSemua()
          return
        }
        while (berjalan < opsi.konfigurasi.jumlahWorker) {
          const p = ambilBerikut()
          if (!p) return
          berjalan++
          const mulai = sekarang()
          opsi.penyedia
            .cari(
              {
                fen: p.fen,
                nodes: anggaran.nodes,
                multiPv: anggaran.multiPv,
                ucinewgame: opsi.konfigurasi.ucinewgamePerPosisi,
              },
              internal.signal,
            )
            .then(async (h) => {
              await opsi.cache?.simpan(h).catch(() => undefined)
              if (berhenti) return
              const durasi = sekarang() - mulai
              waktuEngineTotal += durasi
              jumlahEngine++
              berjalan--
              catatSelesai({
                ply: p.ply,
                fen: p.fen,
                tahap,
                sumber: 'engine',
                paksa: paksaPer.get(p.ply) ?? false,
                garis: h.garis,
                langkahTerbaik: h.langkahTerbaik,
                nodes: anggaran.nodes,
                multiPv: anggaran.multiPv,
                waktuMs: h.waktuMs,
              })
              jadwalkan()
            })
            .catch((e: unknown) => {
              if (berhenti) return
              berhenti = true
              internal.abort()
              if (opsi.signal?.aborted) gagal(new GalatEngine('Dibatalkan'))
              else gagal(e instanceof Error ? e : new GalatEngine('Rusak', String(e)))
            })
        }
      }
      if (internal.signal.aborted) {
        gagal(new GalatEngine('Dibatalkan'))
        return
      }
      internal.signal.addEventListener(
        'abort',
        () => {
          if (berhenti) return
          berhenti = true
          gagal(new GalatEngine('Dibatalkan'))
        },
        { once: true },
      )
      jadwalkan()
    })
  }

  async function jalankan(): Promise<HasilPosisi[]> {
    const hasil = new Map<number, HasilPosisi>()
    const paksaPer = new Map<number, boolean>()
    const nonTerminal: PosisiMasukan[] = []
    let selesaiTerminal = 0

    for (const p of opsi.posisi) {
      const info = infoPosisi(p.fen)
      if (p.isTerminal) {
        const h = hasilSintetis(p, info.mat)
        hasil.set(p.ply, h)
        selesaiTerminal++
        opsi.padaHasil?.(h)
      } else {
        paksaPer.set(p.ply, info.paksa)
        nonTerminal.push(p)
      }
    }

    await jalankanTahap(
      'A',
      nonTerminal,
      opsi.konfigurasi.tahapA,
      paksaPer,
      (h) => hasil.set(h.ply, h),
      opsi.posisi.length,
      selesaiTerminal,
    )

    const urutA = [...hasil.values()].sort((a, b) => a.ply - b.ply)
    const plyKritis = new Set(
      (opsi.penentuKritis ?? penentuKosong)(urutA).slice(0, opsi.konfigurasi.tahapB.batasPosisi),
    )
    const kritis = nonTerminal.filter((p) => plyKritis.has(p.ply))
    if (kritis.length > 0) {
      await jalankanTahap(
        'B',
        kritis,
        opsi.konfigurasi.tahapB,
        paksaPer,
        (h) => hasil.set(h.ply, h),
        kritis.length,
        0,
      )
    }
    return [...hasil.values()].sort((a, b) => a.ply - b.ply)
  }

  const janji = jalankan().finally(() => opsi.signal?.removeEventListener('abort', batal))
  return {
    hasil: janji,
    aturFokus: (ply) => {
      fokus = ply
    },
  }
}
