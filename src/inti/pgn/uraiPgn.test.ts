import { describe, expect, it } from 'vitest'
import permainanNyata from './fixture/permainan-nyata.json'
import { fen4 } from './fen'
import { ambilJamPerLangkah, GalatPgn, uraiPgn } from './uraiPgn'

// Fixture: game nyata dari PubAPI (fjrmhrii 2026/08–10; remis repetisi dari arsip publik hikaru 2026/09)
const game = (nama: string) => {
  const f = permainanNyata.find((p) => p.nama === nama)
  if (!f) throw new Error(`fixture ${nama} tidak ada`)
  return f.game
}

function tangkap(fn: () => unknown): GalatPgn {
  try {
    fn()
  } catch (e) {
    if (e instanceof GalatPgn) return e
    throw e
  }
  throw new Error('Diharapkan gagal')
}

describe('uraiPgn dengan PGN chess.com nyata', () => {
  it.each(permainanNyata.map((p) => [p.nama, p.game.pgn] as const))(
    '%s: FEN akhir sama dengan [CurrentPosition] chess.com',
    (_nama, pgn) => {
      const hasil = uraiPgn(pgn)
      const currentPosition = /\[CurrentPosition "([^"]+)"\]/.exec(pgn)?.[1]
      expect(currentPosition).toBeDefined()
      expect(fen4(hasil.fenAkhir)).toBe(fen4(currentPosition ?? ''))
      expect(hasil.posisi[0]?.ply).toBe(0)
      expect(hasil.posisi.at(-1)?.fen).toBe(hasil.fenAkhir)
      expect(
        hasil.posisi
          .slice(1)
          .every((p) => /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(p.langkahUci ?? '')),
      ).toBe(true)
    },
  )

  it('mat: langkah terakhir terminal, hasil sesuai header', () => {
    const h = uraiPgn(game('mat-saya-kalah').pgn)
    expect(h.akhirOlehAturan).toBe('mat')
    expect(h.posisi.at(-1)?.isTerminal).toBe(true)
    expect(h.posisi.at(-1)?.langkahSan).toMatch(/#$/)
    expect(h.posisi.slice(0, -1).some((p) => p.isTerminal)).toBe(false)
    expect(['1-0', '0-1']).toContain(h.hasil)
  })

  it('stalemate dan repetisi dikenali dari aturan', () => {
    expect(uraiPgn(game('stalemate').pgn).akhirOlehAturan).toBe('stalemate')
    const rep = uraiPgn(game('remis-repetisi').pgn)
    expect(rep.akhirOlehAturan).toBe('repetisi')
    expect(rep.hasil).toBe('1/2-1/2')
  })

  it('menyerah dan waktu habis: bukan akhir oleh aturan, tidak ada posisi terminal', () => {
    for (const nama of ['menyerah-lawan', 'waktu-habis-saya']) {
      const h = uraiPgn(game(nama).pgn)
      expect(h.akhirOlehAturan).toBeNull()
      expect(h.posisi.some((p) => p.isTerminal)).toBe(false)
    }
  })

  it('jam [%clk] terbaca per ply, termasuk saat posisi berulang', () => {
    const pgn = game('remis-repetisi').pgn
    const h = uraiPgn(pgn)
    const jam = h.posisi.slice(1).map((p) => p.sisaWaktuMs)
    expect(jam.every((j) => typeof j === 'number')).toBe(true)
    const pertama = /\[%clk (\d+):(\d+):(\d+(?:\.\d+)?)\]/.exec(pgn)
    const [, j, m, d] = pertama ?? []
    expect(jam[0]).toBe(Math.round((Number(j) * 3600 + Number(m) * 60 + Number(d)) * 1000))
    expect(ambilJamPerLangkah(pgn)).toHaveLength(h.posisi.length - 1)
  })

  it('game daily tanpa clk: sisaWaktuMs tidak diisi', () => {
    const h = uraiPgn(game('daily-tanpa-clk').pgn)
    expect(h.posisi.some((p) => p.sisaWaktuMs !== undefined)).toBe(false)
  })
})

describe('uraiPgn kasus khusus', () => {
  it('posisi awal non-standar lewat [SetUp]/[FEN]', () => {
    const pgn = [
      '[SetUp "1"]',
      '[FEN "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1"]',
      '[Result "1-0"]',
      '',
      '1. Rd8# 1-0',
    ].join('\n')
    const h = uraiPgn(pgn)
    expect(h.fenAwal).toBe('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1')
    expect(h.posisi).toHaveLength(2)
    expect(h.posisi[1]).toMatchObject({ langkahUci: 'd1d8', isTerminal: true, giliran: 'b' })
  })

  it('Chess960 ditolak dengan galat jelas', () => {
    const pgn = [
      '[Variant "Chess960"]',
      '[SetUp "1"]',
      '[FEN "bbqnnrkr/pppppppp/8/8/8/8/PPPPPPPP/BBQNNRKR w HFhf - 0 1"]',
      '',
      '1. e4 *',
    ].join('\n')
    expect(tangkap(() => uraiPgn(pgn)).jenis).toBe('Chess960')
  })

  it('PGN rusak dan kosong', () => {
    expect(tangkap(() => uraiPgn('1. e4 e5 2. Ke3 Ke6 3. Qh8')).jenis).toBe('PgnRusak')
    expect(tangkap(() => uraiPgn('  ')).jenis).toBe('PgnKosong')
  })

  it('ambilJamPerLangkah melewati nomor langkah, NAG, hasil, dan variasi', () => {
    const jam = ambilJamPerLangkah(
      '1. e4 {[%clk 0:01:00]} 1... e5 $1 {[%clk 0:00:59.5]} (1... c5 {[%clk 0:00:10]}) 2. Nf3 1-0',
    )
    expect(jam).toEqual([60000, 59500, undefined])
  })
})
