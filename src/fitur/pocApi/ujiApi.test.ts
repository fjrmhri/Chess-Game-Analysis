import { describe, expect, it } from 'vitest'
import { CacheMemori } from '../../inti/chesscom/cache'
import permainanFixture from '../../inti/chesscom/fixture/permainan-2026-10.json'
import { buatKlienChesscom, type CatatanPermintaan } from '../../inti/chesscom/klien'
import { adaTumpangTindih, jalankanUjiApi, TARGET_BULAN } from './ujiApi'

function catatan(
  mulai: number,
  selesai: number,
  sumber: CatatanPermintaan['sumber'] = 'langsung',
): CatatanPermintaan {
  return { url: 'u', sumber, percobaan: 1, status: 200, mulai, selesai, headerAcao: null }
}

function buatKlien(jumlahBulan: number, gagalPada?: string) {
  const arsip = Array.from({ length: jumlahBulan }, (_, i) => {
    const tahun = 2024 + Math.floor(i / 12)
    return `https://api.chess.com/pub/player/fjrmhrii/games/${tahun}/${String((i % 12) + 1).padStart(2, '0')}`
  })
  const log: CatatanPermintaan[] = []
  let waktu = 0
  const klien = buatKlienChesscom({
    cache: new CacheMemori(),
    sekarang: () => waktu++,
    daring: () => true,
    padaCatat: (c) => log.push(c),
    ambil: (masukan: RequestInfo | URL) => {
      const url = masukan instanceof Request ? masukan.url : masukan.toString()
      if (url.endsWith('/archives')) return Promise.resolve(Response.json({ archives: arsip }))
      if (url === gagalPada) return Promise.reject(new TypeError('Failed to fetch'))
      return Promise.resolve(Response.json(permainanFixture))
    },
  })
  return { klien, log }
}

describe('adaTumpangTindih', () => {
  it('mendeteksi request jaringan yang tumpang tindih; cache diabaikan', () => {
    expect(adaTumpangTindih([catatan(0, 5), catatan(5, 9)])).toBe(false)
    expect(adaTumpangTindih([catatan(0, 5), catatan(4, 9)])).toBe(true)
    expect(adaTumpangTindih([catatan(0, 5), catatan(1, 1, 'cache'), catatan(6, 9)])).toBe(false)
  })
})

describe('jalankanUjiApi', () => {
  it('LULUS untuk 24 bulan tanpa galat dan hanya mengambil 24 bulan terakhir', async () => {
    const { klien, log } = buatKlien(30)
    const h = await jalankanUjiApi(klien, 'fjrmhrii', { ambilCatatan: () => log })
    expect(h.bulanDiuji).toHaveLength(TARGET_BULAN)
    expect(h.bulanDiuji[0]).toContain('/2024/07')
    expect(h.status).toBe('LULUS')
    expect(h.fieldGamePertama?.uuid).toMatch(/^[0-9a-f-]{36}$/)
    expect(h.jumlahGameDenganAccuracies).toBe(2 * TARGET_BULAN)
  })

  it('SEBAGIAN bila arsip kurang dari 24 bulan', async () => {
    const { klien, log } = buatKlien(3)
    const h = await jalankanUjiApi(klien, 'fjrmhrii', { ambilCatatan: () => log })
    expect(h.status).toBe('SEBAGIAN')
    expect(h.alasan[0]).toContain('3 bulan')
  })

  it('GAGAL bila ada galat CORS pada satu bulan', async () => {
    const gagal = 'https://api.chess.com/pub/player/fjrmhrii/games/2025/06'
    const { klien, log } = buatKlien(24, gagal)
    const h = await jalankanUjiApi(klien, 'fjrmhrii', { ambilCatatan: () => log })
    expect(h.status).toBe('GAGAL')
    expect(h.adaGalatCors).toBe(true)
    expect(h.galatBulan.map((g) => g.url)).toEqual([gagal])
  })
})
