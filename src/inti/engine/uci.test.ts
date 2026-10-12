import { describe, expect, it } from 'vitest'
import hitamAkanDimat from './fixture/hitam-akan-dimat.txt?raw'
import hitamMelangkah from './fixture/hitam-melangkah.txt?raw'
import matPutih from './fixture/mat-putih.txt?raw'
import multipvBatas from './fixture/multipv-batas.txt?raw'
import posisiDimat from './fixture/posisi-dimat.txt?raw'
import {
  giliranDariFen,
  PengumpulInfo,
  skorKeSudutPutih,
  uraiBarisInfo,
  uraiBestmove,
  type GarisHasil,
} from './uci'

// Fixture = output nyata stockfish 19.0.1 lite-single (skrip/rekamFixtureUci.cjs)
function kumpulkan(teks: string): {
  garis: GarisHasil[]
  bestmove: ReturnType<typeof uraiBestmove>
} {
  const pengumpul = new PengumpulInfo()
  let bestmove: ReturnType<typeof uraiBestmove> = null
  for (const baris of teks.split('\n')) {
    const info = uraiBarisInfo(baris)
    if (info) pengumpul.tambah(info)
    bestmove ??= uraiBestmove(baris)
  }
  return { garis: pengumpul.hasil(), bestmove }
}

describe('uraiBarisInfo', () => {
  it('mengurai semua field utama', () => {
    const info = uraiBarisInfo(
      'info depth 12 seldepth 18 multipv 1 score cp 33 nodes 72099 nps 252094 hashfull 24 time 286 pv d2d4 e5d4 f3d4',
    )
    expect(info).toEqual({
      kedalaman: 12,
      kedalamanSeleksi: 18,
      multiPv: 1,
      skor: { jenis: 'cp', nilai: 33 },
      batas: undefined,
      nodes: 72099,
      nps: 252094,
      waktuMs: 286,
      pv: ['d2d4', 'e5d4', 'f3d4'],
    })
  })

  it('mengenali lowerbound/upperbound dan mate negatif', () => {
    expect(
      uraiBarisInfo('info depth 13 multipv 1 score cp 26 lowerbound nodes 1 pv d2d4')?.batas,
    ).toBe('bawah')
    expect(uraiBarisInfo('info depth 9 score cp -5 upperbound nodes 1 pv e7e5')?.batas).toBe('atas')
    expect(
      uraiBarisInfo('info depth 245 seldepth 5 multipv 1 score mate -2 pv a8b8')?.skor,
    ).toEqual({
      jenis: 'mat',
      nilai: -2,
    })
  })

  it('mengabaikan info string, currmove, dan baris lain', () => {
    expect(uraiBarisInfo('info string Network replica 1: Local memory.')).toBeNull()
    expect(uraiBarisInfo('info depth 20 currmove e2e4 currmovenumber 1')).toBeNull()
    expect(uraiBarisInfo('readyok')).toBeNull()
    expect(uraiBarisInfo('')).toBeNull()
  })

  it('posisi sudah dimat: depth 0 mate 0 tanpa pv', () => {
    expect(uraiBarisInfo('info depth 0 score mate 0')).toMatchObject({
      kedalaman: 0,
      multiPv: 1,
      skor: { jenis: 'mat', nilai: 0 },
      pv: [],
    })
  })
})

describe('uraiBestmove', () => {
  it('langkah, ponder, dan (none)', () => {
    expect(uraiBestmove('bestmove d2d4 ponder e5d4')).toEqual({ langkah: 'd2d4', ponder: 'e5d4' })
    expect(uraiBestmove('bestmove e7e8q')).toEqual({ langkah: 'e7e8q' })
    expect(uraiBestmove('bestmove (none)')).toEqual({ langkah: null })
    expect(uraiBestmove('info depth 1')).toBeNull()
  })
})

describe('PengumpulInfo dengan output engine nyata', () => {
  it('MultiPV 2: baris terakhir dipakai walau lowerbound, pv[0] = bestmove', () => {
    const { garis, bestmove } = kumpulkan(multipvBatas)
    expect(garis).toHaveLength(2)
    expect(garis[0]).toMatchObject({
      multiPv: 1,
      kedalaman: 13,
      batas: 'bawah',
      skor: { jenis: 'cp', nilai: 26 },
    })
    expect(garis[0]?.pv[0]).toBe(bestmove?.langkah)
    expect(garis[1]).toMatchObject({ multiPv: 2, kedalaman: 12, skor: { jenis: 'cp', nilai: 22 } })
    expect(garis[1]?.batas).toBeUndefined()
  })

  it('mat dalam 1 untuk pemain yang melangkah', () => {
    const { garis, bestmove } = kumpulkan(matPutih)
    expect(garis[0]?.skor).toEqual({ jenis: 'mat', nilai: 1 })
    expect(bestmove?.langkah).toBe('d1d8')
  })

  it('pemain yang melangkah akan dimat dalam 2', () => {
    const { garis } = kumpulkan(hitamAkanDimat)
    expect(garis[0]?.skor).toEqual({ jenis: 'mat', nilai: -2 })
  })

  it('hitam melangkah: skor relatif ke hitam', () => {
    const { garis } = kumpulkan(hitamMelangkah)
    expect(garis[0]?.skor).toEqual({ jenis: 'cp', nilai: -33 })
    expect(garis[0]?.pv[0]).toBe('e7e5')
  })

  it('posisi sudah dimat: satu garis mate 0, bestmove (none)', () => {
    const { garis, bestmove } = kumpulkan(posisiDimat)
    expect(garis).toEqual([
      {
        multiPv: 1,
        skor: { jenis: 'mat', nilai: 0 },
        batas: undefined,
        pv: [],
        kedalaman: 0,
        nodes: undefined,
      },
    ])
    expect(bestmove).toEqual({ langkah: null })
  })
})

describe('skorKeSudutPutih', () => {
  it('membalik cp untuk hitam', () => {
    expect(skorKeSudutPutih({ jenis: 'cp', nilai: -33 }, 'b')).toEqual({ jenis: 'cp', nilai: 33 })
    expect(skorKeSudutPutih({ jenis: 'cp', nilai: 40 }, 'w')).toEqual({ jenis: 'cp', nilai: 40 })
  })

  it('menentukan pemenang mat', () => {
    expect(skorKeSudutPutih({ jenis: 'mat', nilai: 1 }, 'w')).toEqual({
      jenis: 'mat',
      langkah: 1,
      pemenang: 'w',
    })
    expect(skorKeSudutPutih({ jenis: 'mat', nilai: -2 }, 'b')).toEqual({
      jenis: 'mat',
      langkah: 2,
      pemenang: 'w',
    })
    expect(skorKeSudutPutih({ jenis: 'mat', nilai: 3 }, 'b')).toEqual({
      jenis: 'mat',
      langkah: 3,
      pemenang: 'b',
    })
    expect(skorKeSudutPutih({ jenis: 'mat', nilai: 0 }, 'b')).toEqual({
      jenis: 'mat',
      langkah: 0,
      pemenang: 'w',
    })
  })

  it('giliranDariFen', () => {
    expect(giliranDariFen('k7/8/1K6/8/8/8/8/2Q5 b - - 0 1')).toBe('b')
    expect(() => giliranDariFen('rusak')).toThrow()
  })
})
