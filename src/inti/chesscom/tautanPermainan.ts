/**
 * Tautan game di chess.com. Untuk game "Play vs Coach", PubAPI mengisi `url` dan tag [Link] dengan
 * /game/daily/ID, padahal halaman gamenya /game/coach/ID (dilaporkan pengguna 12 Okt 2026, game 271314870).
 */
export function tautanPermainan(url: string, pgn: string): string {
  const event = /\[Event "([^"]*)"\]/.exec(pgn)?.[1]
  if (event === 'Play vs Coach' && url.includes('/game/daily/')) {
    return url.replace('/game/daily/', '/game/coach/')
  }
  return url
}
