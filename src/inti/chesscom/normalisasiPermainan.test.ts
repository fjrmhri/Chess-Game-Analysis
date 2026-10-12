import { describe, expect, it } from 'vitest'
import permainanNyata from '../pgn/fixture/permainan-nyata.json'
import { KODE_HASIL, normalisasiPermainan, petakanHasil } from './normalisasiPermainan'
import type { PermainanPubApi } from './tipe'

const fixture = (nama: string) => {
  const f = permainanNyata.find((p) => p.nama === nama)
  if (!f) throw new Error(nama)
  return { game: f.game as PermainanPubApi, username: f.username }
}

describe('petakanHasil', () => {
  it('memetakan 15 kode hasil terdokumentasi', () => {
    expect(Object.keys(KODE_HASIL)).toHaveLength(15)
    expect(petakanHasil('win')).toBe('menang')
    for (const k of [
      'checkmated',
      'timeout',
      'resigned',
      'lose',
      'abandoned',
      'kingofthehill',
      'threecheck',
      'bughousepartnerlose',
    ]) {
      expect(petakanHasil(k)).toBe('kalah')
    }
    for (const k of [
      'agreed',
      'repetition',
      'stalemate',
      'insufficient',
      '50move',
      'timevsinsufficient',
    ]) {
      expect(petakanHasil(k)).toBe('remis')
    }
    expect(petakanHasil('kode-baru')).toBe('tidak-diketahui')
  })
})

describe('normalisasiPermainan dengan game nyata', () => {
  it.each([
    ['mat-saya-kalah', 'kalah'],
    ['menyerah-lawan', 'menang'],
    ['waktu-habis-saya', 'kalah'],
    ['stalemate', 'remis'],
    ['daily-tanpa-clk', undefined],
    ['remis-repetisi', 'remis'],
  ] as const)('%s', (nama, hasilDiharapkan) => {
    const { game, username } = fixture(nama)
    const p = normalisasiPermainan(game, username.toUpperCase())
    const saya = p.warnaSaya === 'putih' ? game.white : game.black
    expect(saya.username.toLowerCase()).toBe(username)
    expect(p.lawan).toBe(p.warnaSaya === 'putih' ? game.black.username : game.white.username)
    if (hasilDiharapkan) expect(p.hasilSaya).toBe(hasilDiharapkan)
    expect(p.id).toBe(game.uuid)
    expect(p.username).toBe(username)
    expect(p.didukung).toBe(true)
    expect(p.jumlahLangkah).toBe(Math.ceil(p.jumlahPly / 2))
    expect(p.eco).toMatch(/^[A-E]\d\d$/)
    if (game.eco) expect(p.ecoUrl).toBe(game.eco)
  })

  it('jumlahLangkah = nomor langkah terakhir di PGN; akurasi chess.com ikut bila ada', () => {
    const { game, username } = fixture('mat-saya-kalah')
    const p = normalisasiPermainan(game, username)
    const nomorTerakhir = Math.max(
      ...[...(game.pgn ?? '').matchAll(/(\d+)\.\s/g)].map((m) => Number(m[1])),
    )
    expect(p.jumlahLangkah).toBe(nomorTerakhir)
    const denganAkurasi = permainanNyata
      .map((f) => f.game)
      .find((g) => 'accuracies' in g && g.accuracies)
    if (denganAkurasi) {
      const g = denganAkurasi as PermainanPubApi
      const u = g.white.username
      expect(normalisasiPermainan(g, u).akurasiChessCom).toEqual({
        putih: g.accuracies?.white,
        hitam: g.accuracies?.black,
      })
    }
  })

  it('rules selain chess ditandai belum didukung tanpa melempar', () => {
    const { game, username } = fixture('menyerah-lawan')
    const p = normalisasiPermainan({ ...game, rules: 'chess960' }, username)
    expect(p.didukung).toBe(false)
    expect(p.alasanTidakDidukung).toContain('chess960')
  })

  it('PGN rusak: belum didukung dengan alasan, tetap tidak melempar', () => {
    const { game, username } = fixture('menyerah-lawan')
    const p = normalisasiPermainan({ ...game, pgn: '1. e4 e5 2. Ke3 Ke6 3. Qh8' }, username)
    expect(p.didukung).toBe(false)
    expect(p.alasanTidakDidukung).toBeTruthy()
  })

  it('username bukan pemain game ini: galat', () => {
    const { game } = fixture('menyerah-lawan')
    expect(() => normalisasiPermainan(game, 'orang-lain')).toThrow()
  })

  it('tanpa uuid: id = url', () => {
    const { game, username } = fixture('menyerah-lawan')
    const { uuid: _uuid, ...tanpaUuid } = game
    void _uuid
    const p = normalisasiPermainan(tanpaUuid, username)
    expect(p.id).toBe(game.url)
    expect(p.uuid).toBeUndefined()
  })
})
