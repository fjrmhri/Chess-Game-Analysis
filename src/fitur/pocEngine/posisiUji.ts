import { Chess } from 'chess.js'

// Opera Game (Morphy vs Duke Karl / Count Isouard, Paris 1858), domain publik.
const LANGKAH_OPERA =
  'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#'.split(
    ' ',
  )

/** FEN setelah ply 1..n Opera Game (posisi non-terminal). */
export function posisiOpera(jumlah: number): string[] {
  const papan = new Chess()
  const hasil: string[] = []
  for (const san of LANGKAH_OPERA.slice(0, jumlah)) {
    papan.move(san)
    hasil.push(papan.fen())
  }
  return hasil
}

export const POSISI_BENCHMARK = [
  { nama: 'Awal', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  { nama: 'Tengah (Opera ply 22)', fen: posisiOpera(22)[21] ?? '' },
  { nama: 'Akhir (benteng)', fen: '8/5pk1/6p1/8/3R4/6P1/5PKP/r7 w - - 0 40' },
] as const
