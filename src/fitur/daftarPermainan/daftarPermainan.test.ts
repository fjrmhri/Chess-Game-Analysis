import { describe, expect, it } from 'vitest'
import { normalisasiPermainan } from '../../inti/chesscom/normalisasiPermainan'
import type { PermainanPubApi } from '../../inti/chesscom/tipe'
import type { Permainan } from '../../inti/data/tipe'
import permainanNyata from '../../inti/pgn/fixture/permainan-nyata.json'
import { bacaUsernameTerakhir, catatUsername } from '../../pembantu/usernameTerakhir'
import { ambilHalaman, filterKeQuery, terapkanFilter, uraiFilter } from './filterPermainan'
import {
  formatHasil,
  formatKontrolWaktu,
  kunciBulan,
  kunciBulanDariArsip,
  namaBulan,
} from './formatPermainan'

describe('format', () => {
  it.each([
    ['rapid', '600', 'Rapid 10+0'],
    ['blitz', '180+2', 'Blitz 3+2'],
    ['bullet', '30', 'Bullet 30 dtk+0'],
    ['bullet', '90+1', 'Bullet 1:30+1'],
    ['daily', '1/86400', 'Daily 1 hari'],
    ['daily', '1/259200', 'Daily 3 hari'],
    ['daily', '-', 'Daily'],
  ])('%s %s -> %s', (kelas, kontrol, harapan) => {
    expect(formatKontrolWaktu(kelas, kontrol)).toBe(harapan)
  })

  it('hasil dengan sebab dari kode pihak yang kalah atau kode remis', () => {
    expect(formatHasil({ hasilSaya: 'menang', hasilPutih: 'win', hasilHitam: 'resigned' })).toBe(
      'Menang · menyerah',
    )
    expect(formatHasil({ hasilSaya: 'kalah', hasilPutih: 'checkmated', hasilHitam: 'win' })).toBe(
      'Kalah · skakmat',
    )
    expect(
      formatHasil({ hasilSaya: 'remis', hasilPutih: 'repetition', hasilHitam: 'repetition' }),
    ).toBe('Remis · repetisi')
  })

  it('kunci bulan UTC dan nama bulan', () => {
    expect(kunciBulan(Date.UTC(2026, 9, 31, 23, 59) / 1000)).toBe('2026-10')
    expect(kunciBulanDariArsip('https://api.chess.com/pub/player/x/games/2026/08')).toBe('2026-08')
    expect(namaBulan('2026-10')).toBe('Okt 2026')
  })
})

const contoh = (i: number, ubah: Partial<Permainan> = {}): Permainan => ({
  id: `g${i}`,
  url: `u${i}`,
  username: 'saya',
  warnaSaya: i % 2 ? 'putih' : 'hitam',
  lawan: i % 3 ? 'BotAlpha' : 'manusia_x',
  namaPutih: 'a',
  namaHitam: 'b',
  ratingPutih: 500,
  ratingHitam: 500,
  hasilPutih: 'win',
  hasilHitam: 'resigned',
  hasilSaya: i % 4 === 0 ? 'kalah' : 'menang',
  timeClass: i % 5 === 0 ? 'blitz' : 'rapid',
  timeControl: '600',
  rated: true,
  rules: 'chess',
  didukung: true,
  endTime: Date.UTC(2026, i < 30 ? 9 : 8, 1 + (i % 28)) / 1000 + i,
  jumlahLangkah: 30,
  jumlahPly: 60,
  pgn: '',
  ...ubah,
})

describe('filter dan paginasi', () => {
  const semua = Array.from({ length: 45 }, (_, i) => contoh(i))

  it('query string <-> filter bolak-balik; nilai tidak sah diabaikan', () => {
    const f = uraiFilter(
      new URLSearchParams('kelas=rapid&hasil=menang&warna=hitam&bulan=2026-10&lawan=bot&hal=2'),
    )
    expect(f).toEqual({
      kelas: 'rapid',
      hasil: 'menang',
      warna: 'hitam',
      bulan: '2026-10',
      lawan: 'bot',
      hal: 2,
    })
    expect(uraiFilter(filterKeQuery(f))).toEqual(f)
    expect(uraiFilter(new URLSearchParams('hasil=juara&warna=ungu&bulan=okt&hal=-3'))).toEqual({
      hal: 1,
    })
    expect(filterKeQuery({ hal: 1 }).toString()).toBe('')
  })

  it('setiap filter mempersempit; urutan terbaru dulu', () => {
    const rapid = terapkanFilter(semua, { kelas: 'rapid', hal: 1 })
    expect(rapid.every((p) => p.timeClass === 'rapid')).toBe(true)
    expect(rapid.length).toBe(semua.filter((p) => p.timeClass === 'rapid').length)
    const kalahPutih = terapkanFilter(semua, { hasil: 'kalah', warna: 'putih', hal: 1 })
    expect(kalahPutih.every((p) => p.hasilSaya === 'kalah' && p.warnaSaya === 'putih')).toBe(true)
    const sept = terapkanFilter(semua, { bulan: '2026-09', hal: 1 })
    expect(sept).toHaveLength(15)
    const cari = terapkanFilter(semua, { lawan: 'BOT', hal: 1 })
    expect(cari.every((p) => p.lawan === 'BotAlpha')).toBe(true)
    const urut = terapkanFilter(semua, { hal: 1 })
    expect(urut.every((p, i) => i === 0 || (urut[i - 1]?.endTime ?? 0) >= p.endTime)).toBe(true)
  })

  it('paginasi 20 per halaman dan membatasi halaman di luar rentang', () => {
    expect(ambilHalaman(semua, 1)).toMatchObject({ hal: 1, jumlahHalaman: 3, total: 45 })
    expect(ambilHalaman(semua, 3).data).toHaveLength(5)
    expect(ambilHalaman(semua, 9).hal).toBe(3)
    expect(ambilHalaman([], 4)).toMatchObject({ hal: 1, jumlahHalaman: 1, data: [] })
  })

  it('game nyata ternormalisasi dapat difilter', () => {
    const nyata = permainanNyata
      .filter((f) => f.username === 'fjrmhrii')
      .map((f) => normalisasiPermainan(f.game as PermainanPubApi, f.username))
    expect(terapkanFilter(nyata, { kelas: 'daily', hal: 1 })).toHaveLength(1)
  })
})

describe('username terakhir', () => {
  function palsu() {
    const isi = new Map<string, string>()
    return {
      getItem: (k: string) => isi.get(k) ?? null,
      setItem: (k: string, v: string) => void isi.set(k, v),
    }
  }

  it('terbaru di depan, tanpa duplikat, maksimal 5', () => {
    const p = palsu()
    for (const u of ['a', 'b', 'c', 'a', 'd', 'e', 'f']) catatUsername(p, u)
    expect(bacaUsernameTerakhir(p)).toEqual(['f', 'e', 'd', 'a', 'c'])
  })

  it('penyimpanan rusak atau melempar tidak menggagalkan', () => {
    const rusak = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceeded')
      },
    }
    expect(bacaUsernameTerakhir(rusak)).toEqual([])
    expect(catatUsername(rusak, 'x')).toEqual(['x'])
    expect(bacaUsernameTerakhir({ getItem: () => '{rusak', setItem: () => undefined })).toEqual([])
  })
})
