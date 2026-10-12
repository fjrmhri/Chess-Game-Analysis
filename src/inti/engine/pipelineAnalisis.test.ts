import { describe, expect, it } from 'vitest'
import type { Evaluasi } from '../data/tipe'
import { fen4 } from '../pgn/fen'
import { uraiPgn } from '../pgn/uraiPgn'
import {
  gabungKonfigurasi,
  konfigurasiBawaan,
  type KonfigurasiAnalisis,
} from './konfigurasiAnalisis'
import { GalatEngine, type HasilCari, type PermintaanCari } from './mesinCatur'
import {
  mulaiPipeline,
  type CacheEvaluasi,
  type PenyediaPencarian,
  type PosisiMasukan,
  type ProgresAnalisis,
} from './pipelineAnalisis'

const VERSI = 'tiruan-1'

/** Engine tiruan deterministik: skor = panjang FEN mod 97; jeda bisa diatur per ply. */
class PenyediaTiruan implements PenyediaPencarian {
  readonly permintaan: PermintaanCari[] = []
  aktif = 0
  aktifMaks = 0
  private readonly jeda: (fen: string) => number

  constructor(jeda: (fen: string) => number = () => 1) {
    this.jeda = jeda
  }

  static skor(fen: string): number {
    return fen.length % 97
  }

  cari(p: PermintaanCari, signal?: AbortSignal): Promise<HasilCari> {
    this.permintaan.push(p)
    this.aktif++
    this.aktifMaks = Math.max(this.aktifMaks, this.aktif)
    return new Promise((selesai, gagal) => {
      const t = setTimeout(() => {
        this.aktif--
        selesai({
          fen: p.fen,
          nodesDiminta: p.nodes,
          multiPv: p.multiPv,
          garis: Array.from({ length: p.multiPv }, (_, i) => ({
            multiPv: i + 1,
            skor: { jenis: 'cp' as const, nilai: PenyediaTiruan.skor(p.fen) - i },
            pv: ['a2a3'],
            kedalaman: 10,
          })),
          langkahTerbaik: 'a2a3',
          waktuMs: 5,
          versiEngine: VERSI,
        })
      }, this.jeda(p.fen))
      signal?.addEventListener('abort', () => {
        clearTimeout(t)
        this.aktif--
        gagal(new GalatEngine('Dibatalkan'))
      })
    })
  }
}

class CacheMemoriEvaluasi implements CacheEvaluasi {
  readonly isi = new Map<string, Evaluasi>()
  simpanan = 0

  ambil(fen: string, nodes: number, multiPv: number, versi: string): Promise<Evaluasi | undefined> {
    const e = this.isi.get(fen4(fen))
    return Promise.resolve(
      e && e.versiEngine === versi && e.anggaranNodes >= nodes && e.multiPv >= multiPv
        ? e
        : undefined,
    )
  }

  simpan(h: HasilCari): Promise<void> {
    this.simpanan++
    this.isi.set(fen4(h.fen), {
      fen4: fen4(h.fen),
      anggaranNodes: h.nodesDiminta,
      multiPv: h.multiPv,
      versiEngine: h.versiEngine,
      garis: h.garis.map((g) => ({
        multiPv: g.multiPv,
        skorCp: g.skor.nilai,
        pvUci: g.pv,
        kedalaman: g.kedalaman,
      })),
      langkahTerbaik: h.langkahTerbaik,
      dibuatPada: 0,
    })
    return Promise.resolve()
  }

  keGaris(e: Evaluasi) {
    return e.garis.map((g) => ({
      multiPv: g.multiPv,
      skor: { jenis: 'cp' as const, nilai: g.skorCp ?? 0 },
      pv: g.pvUci,
      kedalaman: g.kedalaman,
    }))
  }
}

const konfigurasi = (ubah: Parameters<typeof gabungKonfigurasi>[1] = {}): KonfigurasiAnalisis =>
  gabungKonfigurasi(konfigurasiBawaan(8, false), { jumlahWorker: 3, ...ubah })

function posisiDariPgn(pgn: string): PosisiMasukan[] {
  return uraiPgn(pgn).posisi.map((p) => ({ ply: p.ply, fen: p.fen, isTerminal: p.isTerminal }))
}

// Fool's mate: 4 ply, posisi akhir mat; setelah 1. f3 e5 2. g4 hitam punya banyak langkah
const POSISI_MAT = posisiDariPgn('1. f3 e5 2. g4 Qh4# 0-1')

describe('konfigurasi analisis', () => {
  it('bawaan laptop vs seluler dan penggabungan pengaturan', () => {
    expect(konfigurasiBawaan(16, false)).toMatchObject({
      tahapA: { nodes: 100000, multiPv: 2 },
      tahapB: { nodes: 600000 },
      jumlahWorker: 4,
      ucinewgamePerPosisi: true,
    })
    expect(konfigurasiBawaan(8, true).jumlahWorker).toBe(2)
    const k = gabungKonfigurasi(konfigurasiBawaan(16, false), {
      tahapA: { nodes: 50000.4 },
      jumlahWorker: 99,
      tahapB: { multiPv: -1, batasPosisi: 0 },
    })
    expect(k.tahapA).toEqual({ nodes: 50000, multiPv: 2 })
    expect(k.jumlahWorker).toBe(8)
    expect(k.tahapB.multiPv).toBe(1)
    expect(k.tahapB.batasPosisi).toBe(0)
  })
})

describe('pipelineAnalisis', () => {
  it('urutan hasil per ply, terminal sintetis tanpa engine, anggaran dan ucinewgame dari konfigurasi', async () => {
    const penyedia = new PenyediaTiruan((fen) => (fen.length * 7) % 11)
    const urutanTerima: number[] = []
    const { hasil } = mulaiPipeline({
      posisi: POSISI_MAT,
      penyedia,
      konfigurasi: konfigurasi(),
      versiEngine: VERSI,
      padaHasil: (h) => urutanTerima.push(h.ply),
    })
    const h = await hasil
    expect(h.map((x) => x.ply)).toEqual([0, 1, 2, 3, 4])
    expect(penyedia.permintaan.map((p) => p.fen).sort()).toEqual(
      POSISI_MAT.slice(0, 4)
        .map((p) => p.fen)
        .sort(),
    )
    expect(
      penyedia.permintaan.every((p) => p.nodes === 100000 && p.multiPv === 2 && p.ucinewgame),
    ).toBe(true)
    expect(h[4]).toMatchObject({
      sumber: 'sintetis',
      garis: [{ skor: { jenis: 'mat', nilai: 0 } }],
    })
    expect(h.slice(0, 4).every((x) => x.sumber === 'engine' && x.garis.length === 2)).toBe(true)
    expect(h[2]?.garis[0]?.skor).toEqual({
      jenis: 'cp',
      nilai: PenyediaTiruan.skor(POSISI_MAT[2]?.fen ?? ''),
    })
    expect(urutanTerima.sort()).toEqual([0, 1, 2, 3, 4])
    expect(penyedia.aktifMaks).toBeLessThanOrEqual(3)
  })

  it('remis menurut aturan = cp 0 (stalemate)', async () => {
    const stalemate = { ply: 0, fen: 'k7/8/1Q6/8/8/8/8/K7 b - - 0 1', isTerminal: true }
    const h = await mulaiPipeline({
      posisi: [stalemate],
      penyedia: new PenyediaTiruan(),
      konfigurasi: konfigurasi(),
      versiEngine: VERSI,
    }).hasil
    expect(h[0]?.garis[0]?.skor).toEqual({ jenis: 'cp', nilai: 0 })
  })

  it('menandai posisi dengan satu langkah legal sebagai paksa', async () => {
    const posisi = [
      { ply: 0, fen: '7k/8/8/8/8/8/1q6/K7 w - - 0 1', isTerminal: false },
      {
        ply: 1,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        isTerminal: false,
      },
    ]
    const h = await mulaiPipeline({
      posisi,
      penyedia: new PenyediaTiruan(),
      konfigurasi: konfigurasi(),
      versiEngine: VERSI,
    }).hasil
    expect(h.map((x) => x.paksa)).toEqual([true, false])
  })

  it('analisis kedua memakai cache tanpa memanggil engine', async () => {
    const cache = new CacheMemoriEvaluasi()
    const pertama = new PenyediaTiruan()
    const h1 = await mulaiPipeline({
      posisi: POSISI_MAT,
      penyedia: pertama,
      cache,
      konfigurasi: konfigurasi(),
      versiEngine: VERSI,
    }).hasil
    expect(cache.simpanan).toBe(4)

    const kedua = new PenyediaTiruan()
    const progres: ProgresAnalisis[] = []
    const h2 = await mulaiPipeline({
      posisi: POSISI_MAT,
      penyedia: kedua,
      cache,
      konfigurasi: konfigurasi(),
      versiEngine: VERSI,
      padaProgres: (p) => progres.push(p),
    }).hasil
    expect(kedua.permintaan).toHaveLength(0)
    expect(h2.slice(0, 4).every((x) => x.sumber === 'cache')).toBe(true)
    expect(h2.map((x) => x.garis)).toEqual(h1.map((x) => x.garis))
    expect(progres.at(-1)).toMatchObject({ selesai: 5, total: 5, dariCache: 4 })

    const versiLain = new PenyediaTiruan()
    await mulaiPipeline({
      posisi: POSISI_MAT,
      penyedia: versiLain,
      cache,
      konfigurasi: konfigurasi(),
      versiEngine: 'tiruan-2',
    }).hasil
    expect(versiLain.permintaan).toHaveLength(4)
  })

  it('pembatalan: menolak Dibatalkan dan tidak mengirim posisi lagi', async () => {
    const penyedia = new PenyediaTiruan(() => 50)
    const p = new AbortController()
    const { hasil } = mulaiPipeline({
      posisi: posisiDariPgn('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 *'),
      penyedia,
      konfigurasi: konfigurasi({ jumlahWorker: 2 }),
      versiEngine: VERSI,
      signal: p.signal,
    })
    setTimeout(() => p.abort(), 10)
    await expect(hasil).rejects.toMatchObject({ jenis: 'Dibatalkan' })
    const terkirim = penyedia.permintaan.length
    await new Promise((r) => setTimeout(r, 80))
    expect(terkirim).toBe(2)
    expect(penyedia.permintaan).toHaveLength(2)
    expect(penyedia.aktif).toBe(0)
  })

  it('galat engine menghentikan pipeline dan meneruskan galatnya', async () => {
    const penyedia: PenyediaPencarian = {
      cari: () => Promise.reject(new GalatEngine('Timeout')),
    }
    await expect(
      mulaiPipeline({
        posisi: POSISI_MAT,
        penyedia,
        konfigurasi: konfigurasi(),
        versiEngine: VERSI,
      }).hasil,
    ).rejects.toMatchObject({ jenis: 'Timeout' })
  })

  it('prioritas fokus: posisi terdekat dengan ply fokus dikirim lebih dulu', async () => {
    const posisi = posisiDariPgn('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *')
    const penyedia = new PenyediaTiruan()
    await mulaiPipeline({
      posisi,
      penyedia,
      konfigurasi: konfigurasi({ jumlahWorker: 1 }),
      versiEngine: VERSI,
      plyFokus: 8,
    }).hasil
    const urutanPly = penyedia.permintaan.map((r) => posisi.find((p) => p.fen === r.fen)?.ply)
    expect(urutanPly[0]).toBe(8)
    expect(urutanPly.slice(1, 3).sort()).toEqual([7, 9])
  })

  it('aturFokus di tengah jalan mengubah urutan berikutnya', async () => {
    const posisi = posisiDariPgn('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *')
    const penyedia = new PenyediaTiruan(() => 5)
    let sudah = false
    const jalan = mulaiPipeline({
      posisi,
      penyedia,
      konfigurasi: konfigurasi({ jumlahWorker: 1 }),
      versiEngine: VERSI,
      padaHasil: (h) => {
        if (h.sumber === 'engine' && !sudah) {
          sudah = true
          jalan.aturFokus(10)
        }
      },
    })
    await jalan.hasil
    const urutanPly = penyedia.permintaan.map((r) => posisi.find((p) => p.fen === r.fen)?.ply)
    expect(urutanPly[0]).toBe(0)
    expect(urutanPly[1]).toBe(10)
  })

  it('Tahap B mengulang posisi kritis dengan anggaran lebih besar dan menggantikan hasil A', async () => {
    const penyedia = new PenyediaTiruan()
    const h = await mulaiPipeline({
      posisi: POSISI_MAT,
      penyedia,
      konfigurasi: konfigurasi({ tahapB: { batasPosisi: 1 } }),
      versiEngine: VERSI,
      penentuKritis: () => [2, 3],
    }).hasil
    const b = penyedia.permintaan.filter((p) => p.nodes === 600000)
    expect(b).toHaveLength(1)
    expect(b[0]).toMatchObject({ fen: POSISI_MAT[2]?.fen, multiPv: 3 })
    expect(h[2]).toMatchObject({ tahap: 'B', nodes: 600000, multiPv: 3 })
    expect(h[3]?.tahap).toBe('A')
  })

  it('progres: total, selesai, dan perkiraan sisa waktu', async () => {
    let t = 0
    const progres: ProgresAnalisis[] = []
    await mulaiPipeline({
      posisi: POSISI_MAT,
      penyedia: new PenyediaTiruan(),
      konfigurasi: konfigurasi({ jumlahWorker: 1 }),
      versiEngine: VERSI,
      sekarang: () => (t += 100),
      padaProgres: (p) => progres.push(p),
    }).hasil
    expect(progres.every((p) => p.total === 5)).toBe(true)
    expect(progres.at(-1)?.selesai).toBe(5)
    expect(progres.find((p) => p.sisaMs !== undefined && p.selesai < 5)?.sisaMs).toBeGreaterThan(0)
    expect(progres.at(-1)?.sisaMs).toBe(0)
  })
})
