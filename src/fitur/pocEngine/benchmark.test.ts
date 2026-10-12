import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { SaluranPalsu } from '../../inti/engine/saluranPalsu'
import { benchmarkKolam, nilaiKecepatan, nilaiKolam, ukurUcinewgame } from './benchmark'
import { posisiOpera, POSISI_BENCHMARK } from './posisiUji'

describe('posisi uji', () => {
  it('24 posisi Opera Game sah dan berbeda', () => {
    const daftar = posisiOpera(24)
    expect(daftar).toHaveLength(24)
    expect(new Set(daftar).size).toBe(24)
    for (const fen of daftar) expect(new Chess(fen).isGameOver()).toBe(false)
  })

  it('posisi benchmark sah dan punya langkah legal', () => {
    for (const p of POSISI_BENCHMARK) expect(new Chess(p.fen).moves().length).toBeGreaterThan(0)
  })
})

describe('penilaian PoC 2', () => {
  const baris = (nodes: number, waktuMs: number) => ({
    posisi: 'x',
    nodes,
    waktuMs,
    nps: 0,
    kedalaman: 1,
  })

  it('rata-rata 100k dibanding batas laptop/seluler; 1M diabaikan', () => {
    const data = [baris(100_017, 280), baris(100_100, 320), baris(1_000_000, 5000)]
    expect(nilaiKecepatan(data, false)).toEqual({ rata100k: 300, batas: 300, lulus: true })
    expect(nilaiKecepatan([baris(100_000, 301)], false).lulus).toBe(false)
    expect(nilaiKecepatan([baris(100_000, 1400)], true).lulus).toBe(true)
  })

  it('percepatan 3 worker >= 2,3x', () => {
    expect(nilaiKolam([{ jumlahWorker: 3, waktuMs: 1, percepatan: 2.3 }]).lulus).toBe(true)
    expect(nilaiKolam([{ jumlahWorker: 3, waktuMs: 1, percepatan: 2.29 }]).lulus).toBe(false)
    expect(nilaiKolam([{ jumlahWorker: 2, waktuMs: 1, percepatan: 2 }]).lulus).toBeUndefined()
  })

  it('benchmarkKolam menghitung percepatan relatif ke jumlah pertama', async () => {
    let t = 0
    const hasil = await benchmarkKolam(
      () => new SaluranPalsu({ jedaCari: () => 1 }),
      [1, 2],
      posisiOpera(4),
      10,
      () => (t += 10),
    )
    expect(hasil.map((h) => h.jumlahWorker)).toEqual([1, 2])
    expect(hasil[0]?.percepatan).toBe(1)
  })

  it('benchmarkKolam mencatat kolam yang gagal mulai lalu berhenti', async () => {
    let dibuat = 0
    const hasil = await benchmarkKolam(
      () => {
        dibuat++
        // Kolam ke-2 (2 mesin): saluran ke-3 tidak pernah menjawab "uci"
        return dibuat === 3 ? new SaluranPalsu({ diam: true }) : new SaluranPalsu()
      },
      [1, 2, 3],
      posisiOpera(2),
      10,
      () => 0,
      undefined,
      undefined,
      { batasWaktuMulaiMs: 20 },
    )
    expect(hasil.map((h) => h.jumlahWorker)).toEqual([1, 2])
    expect(hasil[1]?.galat).toBeTruthy()
    expect(nilaiKolam(hasil).lulus).toBeUndefined()
  })

  it('ukurUcinewgame melaporkan determinisme', async () => {
    const { MesinCatur } = await import('../../inti/engine/mesinCatur')
    const mesin = new MesinCatur(new SaluranPalsu())
    await mesin.mulai()
    const h = await ukurUcinewgame(mesin, posisiOpera(3), 10, () => 0)
    expect(h.deterministik).toBe(true)
    mesin.tutup()
  })
})
