export type JenisGalatChesscom =
  | 'UsernameTidakValid'
  | 'PemainTidakDitemukan'
  | 'TerbatasiLaju'
  | 'ServerGagal'
  | 'JaringanGagal'
  | 'CorsGagal'
  | 'ResponsTidakValid'
  | 'Dibatalkan'

const PESAN: Record<JenisGalatChesscom, string> = {
  UsernameTidakValid:
    'Username tidak valid. Gunakan 3–25 huruf, angka, garis bawah, atau tanda hubung.',
  PemainTidakDitemukan: 'Pemain atau arsip tidak ditemukan di chess.com.',
  TerbatasiLaju: 'Terlalu banyak permintaan ke chess.com. Tunggu sebentar lalu coba lagi.',
  ServerGagal: 'Server chess.com sedang bermasalah. Coba lagi nanti.',
  JaringanGagal: 'Tidak ada koneksi internet.',
  CorsGagal:
    'Permintaan diblokir browser atau jaringan gagal (kemungkinan CORS). Coba lagi atau aktifkan proxy.',
  ResponsTidakValid: 'Respons chess.com tidak sesuai format yang diharapkan.',
  Dibatalkan: 'Permintaan dibatalkan.',
}

export class GalatChesscom extends Error {
  readonly jenis: JenisGalatChesscom
  readonly status: number | undefined

  constructor(jenis: JenisGalatChesscom, status?: number, rincian?: string) {
    super(rincian ? `${PESAN[jenis]} (${rincian})` : PESAN[jenis])
    this.name = 'GalatChesscom'
    this.jenis = jenis
    this.status = status
  }
}

export function adalahGalatChesscom(e: unknown, jenis?: JenisGalatChesscom): e is GalatChesscom {
  return e instanceof GalatChesscom && (jenis === undefined || e.jenis === jenis)
}
