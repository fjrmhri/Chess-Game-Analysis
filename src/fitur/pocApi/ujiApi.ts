import { adalahGalatChesscom, GalatChesscom } from '../../inti/chesscom/galat'
import type { CatatanPermintaan, KlienChesscom } from '../../inti/chesscom/klien'
import type { PermainanPubApi } from '../../inti/chesscom/tipe'

// Kriteria PoC 1 (blueprint §7): 24 bulan arsip diambil serial tanpa error CORS
export const TARGET_BULAN = 24

export interface FieldGame {
  sumber: string
  pgn: boolean
  accuracies: string
  whiteRating: string
  uuid: string
  timeClass: string
  rules: string
  eco: string
}

export interface HasilUjiApi {
  username: string
  jumlahArsip: number
  bulanDiuji: string[]
  bulanBerhasil: number
  galatBulan: { url: string; pesan: string }[]
  jumlahGame: number
  jumlahGameDenganAccuracies: number
  fieldGamePertama: FieldGame | null
  adaRequestJaringan: boolean
  headerAcao: string | null
  adaGalatCors: boolean
  tumpangTindih: boolean
  status: 'LULUS' | 'SEBAGIAN' | 'GAGAL'
  alasan: string[]
}

export function ringkasFieldGame(g: PermainanPubApi, sumber: string): FieldGame {
  return {
    sumber,
    pgn: typeof g.pgn === 'string' && g.pgn.length > 0,
    accuracies: g.accuracies ? `${g.accuracies.white} / ${g.accuracies.black}` : 'tidak ada',
    whiteRating: String(g.white.rating),
    uuid: g.uuid ?? 'tidak ada',
    timeClass: g.time_class,
    rules: g.rules,
    eco: g.eco ?? 'tidak ada',
  }
}

/** Request jaringan serial = setiap request mulai setelah request sebelumnya selesai. */
export function adaTumpangTindih(catatan: readonly CatatanPermintaan[]): boolean {
  const jaringan = catatan.filter((c) => c.sumber !== 'cache')
  return jaringan.some((c, i) => i > 0 && c.mulai < (jaringan[i - 1]?.selesai ?? 0))
}

export function nilaiHasil(
  h: Omit<HasilUjiApi, 'status' | 'alasan'>,
): Pick<HasilUjiApi, 'status' | 'alasan'> {
  const alasan: string[] = []
  if (h.adaGalatCors) alasan.push('Ada galat CORS/jaringan.')
  if (h.galatBulan.length > 0) alasan.push(`${h.galatBulan.length} bulan gagal diambil.`)
  if (h.tumpangTindih) alasan.push('Request jaringan tumpang tindih (tidak serial).')
  if (!h.fieldGamePertama?.pgn) alasan.push('Field pgn tidak terbaca.')
  if (h.fieldGamePertama && Number.isNaN(Number(h.fieldGamePertama.whiteRating))) {
    alasan.push('Field white.rating tidak terbaca.')
  }
  if (h.jumlahGameDenganAccuracies === 0) alasan.push('Tidak ada game dengan field accuracies.')
  if (alasan.length > 0) return { status: 'GAGAL', alasan }
  if (h.bulanBerhasil < TARGET_BULAN) {
    return {
      status: 'SEBAGIAN',
      alasan: [
        `Arsip hanya ${h.bulanBerhasil} bulan; kriteria butuh ${TARGET_BULAN}. Uji juga akun lain.`,
      ],
    }
  }
  return { status: 'LULUS', alasan: [] }
}

export interface OpsiUjiApi {
  signal?: AbortSignal
  abaikanCache?: boolean
  padaKemajuan?: (selesai: number, total: number) => void
  ambilCatatan: () => readonly CatatanPermintaan[]
}

export async function jalankanUjiApi(
  klien: KlienChesscom,
  username: string,
  opsi: OpsiUjiApi,
): Promise<HasilUjiApi> {
  const { signal, abaikanCache } = opsi
  const arsip = await klien.ambilDaftarArsip(username, { signal, abaikanCache })
  const bulanDiuji = arsip.archives.slice(-TARGET_BULAN)
  const galatBulan: HasilUjiApi['galatBulan'] = []
  let jumlahGame = 0
  let jumlahGameDenganAccuracies = 0
  let fieldGamePertama: FieldGame | null = null
  let adaGalatCors = false

  opsi.padaKemajuan?.(0, bulanDiuji.length)
  for (const [i, url] of [...bulanDiuji].reverse().entries()) {
    try {
      const { games } = await klien.ambilPermainanBulanan(url, { signal, abaikanCache })
      jumlahGame += games.length
      jumlahGameDenganAccuracies += games.filter((g) => g.accuracies).length
      const pertama = games[0]
      if (!fieldGamePertama && pertama) fieldGamePertama = ringkasFieldGame(pertama, url)
    } catch (e) {
      if (adalahGalatChesscom(e, 'Dibatalkan')) throw e
      if (adalahGalatChesscom(e, 'CorsGagal') || adalahGalatChesscom(e, 'JaringanGagal')) {
        adaGalatCors = true
      }
      galatBulan.push({ url, pesan: e instanceof GalatChesscom ? e.message : String(e) })
    }
    opsi.padaKemajuan?.(i + 1, bulanDiuji.length)
  }

  const catatan = opsi.ambilCatatan()
  const jaringan = catatan.find((c) => c.sumber !== 'cache' && c.status !== null)
  const dasar = {
    username,
    jumlahArsip: arsip.archives.length,
    bulanDiuji,
    bulanBerhasil: bulanDiuji.length - galatBulan.length,
    galatBulan,
    jumlahGame,
    jumlahGameDenganAccuracies,
    fieldGamePertama,
    adaRequestJaringan: jaringan !== undefined,
    headerAcao: jaringan?.headerAcao ?? null,
    adaGalatCors,
    tumpangTindih: adaTumpangTindih(catatan),
  }
  return { ...dasar, ...nilaiHasil(dasar) }
}
