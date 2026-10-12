import type { HasilSaya, Permainan, Warna } from '../data/tipe'
import { ambilJamPerLangkah, GalatPgn, uraiPgn } from '../pgn/uraiPgn'
import type { PermainanPubApi } from './tipe'

/** Kode hasil PubAPI (chess.com/news/view/published-data-api, "Game results codes"), 15 kode. */
export const KODE_HASIL: Record<string, HasilSaya> = {
  win: 'menang',
  checkmated: 'kalah',
  timeout: 'kalah',
  resigned: 'kalah',
  lose: 'kalah',
  abandoned: 'kalah',
  kingofthehill: 'kalah',
  threecheck: 'kalah',
  bughousepartnerlose: 'kalah',
  agreed: 'remis',
  repetition: 'remis',
  stalemate: 'remis',
  insufficient: 'remis',
  '50move': 'remis',
  timevsinsufficient: 'remis',
}

export function petakanHasil(kode: string): HasilSaya {
  return KODE_HASIL[kode] ?? 'tidak-diketahui'
}

function hitungPly(pgn: string): { jumlahPly: number; eco?: string; alasan?: string } {
  try {
    const hasil = uraiPgn(pgn)
    return { jumlahPly: hasil.posisi.length - 1, eco: hasil.header.ECO }
  } catch (e) {
    return {
      jumlahPly: ambilJamPerLangkah(pgn).length,
      eco: /\[ECO "([^"]*)"\]/.exec(pgn)?.[1],
      alasan: e instanceof GalatPgn ? e.message : 'PGN tidak bisa dibaca',
    }
  }
}

export function normalisasiPermainan(game: PermainanPubApi, username: string): Permainan {
  const saya = username.trim().toLowerCase()
  const putih = game.white.username.toLowerCase() === saya
  const hitam = game.black.username.toLowerCase() === saya
  if (!putih && !hitam) throw new Error(`${username} tidak bermain di ${game.url}`)
  const warnaSaya: Warna = putih ? 'putih' : 'hitam'

  const pgn = game.pgn ?? ''
  const { jumlahPly, eco, alasan } = hitungPly(pgn)
  const rulesDidukung = game.rules === 'chess'
  const didukung = rulesDidukung && alasan === undefined

  return {
    id: game.uuid ?? game.url,
    ...(game.uuid ? { uuid: game.uuid } : {}),
    url: game.url,
    username: saya,
    warnaSaya,
    lawan: putih ? game.black.username : game.white.username,
    namaPutih: game.white.username,
    namaHitam: game.black.username,
    ratingPutih: game.white.rating,
    ratingHitam: game.black.rating,
    hasilPutih: game.white.result,
    hasilHitam: game.black.result,
    hasilSaya: petakanHasil(putih ? game.white.result : game.black.result),
    timeClass: game.time_class,
    timeControl: game.time_control,
    rated: game.rated,
    rules: game.rules,
    didukung,
    ...(didukung
      ? {}
      : { alasanTidakDidukung: rulesDidukung ? alasan : `Aturan "${game.rules}" belum didukung.` }),
    endTime: game.end_time,
    jumlahPly,
    jumlahLangkah: Math.ceil(jumlahPly / 2),
    ...(eco ? { eco } : {}),
    ...(game.eco ? { ecoUrl: game.eco } : {}),
    pgn,
    ...(game.accuracies
      ? { akurasiChessCom: { putih: game.accuracies.white, hitam: game.accuracies.black } }
      : {}),
  }
}
