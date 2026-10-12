import { GalatChesscom } from './galat'

/** Bentuk respons PubAPI yang dipakai; field lain dibiarkan. Diverifikasi terhadap arsip nyata 2026-08..10. */
export interface PemainDalamPermainan {
  username: string
  rating: number
  result: string
  '@id': string
  uuid?: string
}

export interface PermainanPubApi {
  url: string
  pgn?: string
  time_control: string
  end_time: number
  start_time?: number
  rated: boolean
  tcn?: string
  uuid?: string
  initial_setup?: string
  fen: string
  time_class: string
  rules: string
  eco?: string
  accuracies?: { white: number; black: number }
  white: PemainDalamPermainan
  black: PemainDalamPermainan
}

export interface ResponsArsip {
  archives: string[]
}

export interface ResponsPermainanBulanan {
  games: PermainanPubApi[]
}

function adalahObjek(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

export function validasiResponsArsip(data: unknown): ResponsArsip {
  if (
    !adalahObjek(data) ||
    !Array.isArray(data.archives) ||
    !data.archives.every((a) => typeof a === 'string')
  ) {
    throw new GalatChesscom('ResponsTidakValid', undefined, 'archives')
  }
  return { archives: data.archives.filter((a): a is string => typeof a === 'string') }
}

export function validasiResponsPermainan(data: unknown): ResponsPermainanBulanan {
  if (!adalahObjek(data) || !Array.isArray(data.games)) {
    throw new GalatChesscom('ResponsTidakValid', undefined, 'games')
  }
  const sahih = data.games.every(
    (g) =>
      adalahObjek(g) &&
      typeof g.url === 'string' &&
      adalahObjek(g.white) &&
      adalahObjek(g.black) &&
      typeof g.white.rating === 'number' &&
      typeof g.black.rating === 'number',
  )
  if (!sahih) throw new GalatChesscom('ResponsTidakValid', undefined, 'games[]')
  return { games: data.games as PermainanPubApi[] }
}
