import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { tautanPermainan } from '../chesscom/tautanPermainan'
import permainanNyata from './fixture/permainan-nyata.json'
import { buatPgnBeranotasi, type LangkahBeranotasi } from './pgnBeranotasi'
import { uraiPgn } from './uraiPgn'

describe('buatPgnBeranotasi', () => {
  const asli = permainanNyata.find((f) => f.nama === 'mat-saya-kalah')?.game.pgn ?? ''
  const urai = uraiPgn(asli)
  const label = ['best', 'excellent', 'inaccuracy', 'blunder', 'brilliant'] as const
  const langkah: LangkahBeranotasi[] = urai.posisi.slice(1).map((p, i) => ({
    ply: p.ply,
    langkahSan: p.langkahSan ?? '',
    label: label[i % label.length] ?? 'best',
    poinHilang: i / 100,
    langkahTerbaik: 'e2e4',
  }))
  const pgn = buatPgnBeranotasi({
    pgnAsli: asli,
    langkah,
    versiAlgoritma: 'p7-mvp-1',
    akurasi: { putih: 64.6262, hitam: 96.9589 },
  })

  it('dapat dibaca ulang dan berakhir di posisi yang sama', () => {
    const papan = new Chess()
    papan.loadPgn(pgn)
    expect(papan.fen()).toBe(urai.fenAkhir)
    expect(papan.history()).toHaveLength(urai.posisi.length - 1)
  })

  it('header asli dipertahankan + annotator dan akurasi Telaah', () => {
    expect(pgn).toContain('[White "')
    expect(pgn).toContain('[Annotator "Telaah p7-mvp-1"]')
    expect(pgn).toContain('[TelaahAkurasiPutih "64.6"]')
    expect(pgn).toContain('[TelaahAkurasiHitam "97.0"]')
  })

  it('label sebagai NAG + komentar, langkah hitam bernomor N...', () => {
    expect(pgn).toMatch(/1\. \S+ \{Best \| hilang 0\.000 \| terbaik e2e4\} 1\.\.\. \S+ \{Excellent/)
    expect(pgn).toMatch(/2\. \S+ \$6 \{Inaccuracy/)
    expect(pgn).toMatch(/2\.\.\. \S+ \$4 \{Blunder/)
    expect(pgn).toMatch(/3\. \S+ \$3 \{Brilliant/)
    expect(pgn.trimEnd().endsWith(urai.hasil)).toBe(true)
    expect(pgn).not.toContain('[%clk')
  })

  it('tag [Link] bisa diganti', () => {
    const p = buatPgnBeranotasi({
      pgnAsli: '[Link "https://www.chess.com/game/daily/1"]\n[Result "*"]',
      langkah: [],
      versiAlgoritma: 'v',
      tautan: 'https://www.chess.com/game/coach/1',
    })
    expect(p).toContain('[Link "https://www.chess.com/game/coach/1"]')
    expect(p).not.toContain('game/daily')
  })

  it('mulai dari giliran hitam', () => {
    const p = buatPgnBeranotasi({
      pgnAsli: '[Result "*"]',
      langkah: [
        { ply: 1, langkahSan: 'e5', label: 'good', poinHilang: 0.03, langkahTerbaik: null },
        { ply: 2, langkahSan: 'Nf3', label: 'best', poinHilang: 0, langkahTerbaik: null },
      ],
      nomorAwal: 7,
      giliranAwal: 'b',
      versiAlgoritma: 'v',
    })
    expect(p).toContain('7... e5 {Good | hilang 0.030} 8. Nf3 {Best | hilang 0.000} *')
  })
})

describe('tautanPermainan', () => {
  it('game Play vs Coach: /game/daily/ diganti /game/coach/', () => {
    expect(
      tautanPermainan('https://www.chess.com/game/daily/271314870', '[Event "Play vs Coach"]\n'),
    ).toBe('https://www.chess.com/game/coach/271314870')
  })

  it('game lain tidak diubah', () => {
    expect(tautanPermainan('https://www.chess.com/game/daily/1', '[Event "Let\'s Play!"]')).toBe(
      'https://www.chess.com/game/daily/1',
    )
    expect(tautanPermainan('https://www.chess.com/game/live/2', '[Event "Live Chess"]')).toBe(
      'https://www.chess.com/game/live/2',
    )
  })
})
