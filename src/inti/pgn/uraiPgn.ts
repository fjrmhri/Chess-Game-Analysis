import { Chess } from 'chess.js'
import { giliranFen } from './fen'

export type JenisGalatPgn = 'PgnKosong' | 'PgnRusak' | 'Chess960' | 'VarianTidakDidukung'

export class GalatPgn extends Error {
  readonly jenis: JenisGalatPgn

  constructor(jenis: JenisGalatPgn, rincian?: string) {
    const pesan: Record<JenisGalatPgn, string> = {
      PgnKosong: 'PGN kosong.',
      PgnRusak: 'PGN tidak bisa dibaca.',
      Chess960: 'Chess960 belum didukung.',
      VarianTidakDidukung: 'Varian catur ini belum didukung.',
    }
    super(rincian ? `${pesan[jenis]} (${rincian})` : pesan[jenis])
    this.name = 'GalatPgn'
    this.jenis = jenis
  }
}

export interface LangkahPgn {
  /** 0 = posisi awal; ply n = setelah langkah ke-n. */
  ply: number
  fen: string
  langkahUci: string | null
  langkahSan: string | null
  giliran: 'w' | 'b'
  isTerminal: boolean
  sisaWaktuMs?: number
}

export type AkhirOlehAturan = 'mat' | 'stalemate' | 'material-kurang' | 'repetisi' | '50-langkah'

export interface HasilUraiPgn {
  header: Record<string, string>
  posisi: LangkahPgn[]
  hasil: string
  fenAwal: string
  fenAkhir: string
  akhirOlehAturan: AkhirOlehAturan | null
}

const POLA_CLK = /\[%clk\s+(\d+):(\d{2}):(\d{2}(?:\.\d+)?)\]/
const TOKEN_LEWATI = /^(\d+\.+|1-0|0-1|1\/2-1\/2|\*|\$\d+)$/

/** Komentar [%clk] per langkah utama, berurutan. chess.js menyimpan komentar per FEN sehingga hilang saat posisi berulang. */
export function ambilJamPerLangkah(pgn: string): (number | undefined)[] {
  const teksLangkah = pgn
    .split(/\r?\n/)
    .filter((baris) => !baris.trimStart().startsWith('['))
    .join('\n')
  const jam: (number | undefined)[] = []
  let i = 0
  let kedalamanVariasi = 0
  while (i < teksLangkah.length) {
    const c = teksLangkah[i] ?? ''
    if (c === '{') {
      const akhir = teksLangkah.indexOf('}', i)
      const komentar = teksLangkah.slice(i + 1, akhir < 0 ? undefined : akhir)
      const cocok = POLA_CLK.exec(komentar)
      if (cocok && kedalamanVariasi === 0 && jam.length > 0) {
        const [, j, m, d] = cocok
        jam[jam.length - 1] = Math.round((Number(j) * 3600 + Number(m) * 60 + Number(d)) * 1000)
      }
      i = akhir < 0 ? teksLangkah.length : akhir + 1
    } else if (c === ';') {
      const akhir = teksLangkah.indexOf('\n', i)
      i = akhir < 0 ? teksLangkah.length : akhir + 1
    } else if (c === '(') {
      kedalamanVariasi++
      i++
    } else if (c === ')') {
      kedalamanVariasi = Math.max(0, kedalamanVariasi - 1)
      i++
    } else if (/\s/.test(c)) {
      i++
    } else {
      let j = i
      while (j < teksLangkah.length && !/[\s{}();]/.test(teksLangkah[j] ?? '')) j++
      const token = teksLangkah.slice(i, j).replace(/^\d+\.+/, '')
      if (token && !TOKEN_LEWATI.test(token) && kedalamanVariasi === 0) jam.push(undefined)
      i = j
    }
  }
  return jam
}

function akhirOlehAturan(papan: Chess): AkhirOlehAturan | null {
  if (papan.isCheckmate()) return 'mat'
  if (papan.isStalemate()) return 'stalemate'
  if (papan.isInsufficientMaterial()) return 'material-kurang'
  if (papan.isThreefoldRepetition()) return 'repetisi'
  if (papan.isDrawByFiftyMoves()) return '50-langkah'
  return null
}

export function uraiPgn(pgn: string): HasilUraiPgn {
  if (!pgn.trim()) throw new GalatPgn('PgnKosong')
  const papan = new Chess()
  try {
    papan.loadPgn(pgn)
  } catch (e) {
    const varian = /\[Variant "([^"]*)"\]/.exec(pgn)?.[1]
    if (varian && /960/.test(varian)) throw new GalatPgn('Chess960')
    throw new GalatPgn('PgnRusak', e instanceof Error ? e.message : String(e))
  }
  const header = papan.getHeaders()
  const varian = header.Variant
  if (varian && /960/.test(varian)) throw new GalatPgn('Chess960')
  if (varian && varian.toLowerCase() !== 'standard')
    throw new GalatPgn('VarianTidakDidukung', varian)

  const riwayat = papan.history({ verbose: true })
  const jam = ambilJamPerLangkah(pgn)
  const jamSahih = jam.length === riwayat.length
  const fenAwal = riwayat[0]?.before ?? papan.fen()
  const akhir = akhirOlehAturan(papan)

  const posisi: LangkahPgn[] = [
    {
      ply: 0,
      fen: fenAwal,
      langkahUci: null,
      langkahSan: null,
      giliran: giliranFen(fenAwal),
      isTerminal: riwayat.length === 0 && akhir !== null,
    },
  ]
  riwayat.forEach((langkah, i) => {
    const sisa = jamSahih ? jam[i] : undefined
    posisi.push({
      ply: i + 1,
      fen: langkah.after,
      langkahUci: langkah.lan,
      langkahSan: langkah.san,
      giliran: giliranFen(langkah.after),
      isTerminal: i === riwayat.length - 1 && akhir !== null,
      ...(sisa === undefined ? {} : { sisaWaktuMs: sisa }),
    })
  })

  return {
    header,
    posisi,
    hasil: header.Result ?? '*',
    fenAwal,
    fenAkhir: papan.fen(),
    akhirOlehAturan: akhir,
  }
}
