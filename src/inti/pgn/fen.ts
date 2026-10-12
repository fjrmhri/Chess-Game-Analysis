/** Posisi + giliran + hak rokade + en passant; mengabaikan penghitung halfmove/fullmove. */
export function fen4(fen: string): string {
  const bagian = fen.trim().split(/\s+/)
  if (bagian.length < 4) throw new Error(`FEN tidak lengkap: ${fen}`)
  return bagian.slice(0, 4).join(' ')
}

export function giliranFen(fen: string): 'w' | 'b' {
  const giliran = fen.trim().split(/\s+/)[1]
  if (giliran !== 'w' && giliran !== 'b') throw new Error(`FEN tanpa giliran: ${fen}`)
  return giliran
}
