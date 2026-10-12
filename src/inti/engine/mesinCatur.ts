import { AntreanSerial } from '../chesscom/antrean'
import {
  batasWaktuCariMs as batasWaktuCariBawaan,
  BATAS_WAKTU_MULAI_MS,
  HASH_MB,
  TENGGANG_STOP_MS,
  VERSI_ENGINE,
} from './konfigurasiEngine'
import type { SaluranUci } from './saluran'
import { PengumpulInfo, uraiBarisInfo, uraiBestmove, type GarisHasil } from './uci'

export type JenisGalatEngine =
  'GagalMulai' | 'Timeout' | 'Dibatalkan' | 'Tertutup' | 'Rusak' | 'MasukanTidakValid'

export class GalatEngine extends Error {
  readonly jenis: JenisGalatEngine

  constructor(jenis: JenisGalatEngine, pesan?: string) {
    super(pesan ?? jenis)
    this.name = 'GalatEngine'
    this.jenis = jenis
  }
}

export interface PermintaanCari {
  fen: string
  nodes: number
  multiPv: number
  /** Kirim "ucinewgame" (kosongkan hash) sebelum mencari: hasil tidak bergantung urutan pencarian. */
  ucinewgame?: boolean
}

export interface HasilCari {
  fen: string
  nodesDiminta: number
  multiPv: number
  garis: GarisHasil[]
  langkahTerbaik: string | null
  ponder?: string
  nodes?: number
  kedalaman?: number
  waktuMs: number
  versiEngine: string
}

export interface OpsiMesin {
  hashMb?: number
  batasWaktuMulaiMs?: number
  batasWaktuCariMs?: (nodes: number) => number
  tenggangStopMs?: number
  sekarang?: () => number
}

type StatusMesin = 'baru' | 'memulai' | 'siap' | 'tertutup' | 'rusak'

interface Penantian {
  cocok: (baris: string) => boolean
  selesai: () => void
  gagal: (e: GalatEngine) => void
  pewaktu: ReturnType<typeof setTimeout>
}

interface PencarianAktif {
  pengumpul: PengumpulInfo
  permintaan: PermintaanCari
  mulai: number
  alasanBatal?: GalatEngine
  pewaktu: ReturnType<typeof setTimeout>
  selesai: (h: HasilCari) => void
  gagal: (e: GalatEngine) => void
}

const POLA_FEN_AMAN = /^[1-8pnbrqkPNBRQK/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$/

export class MesinCatur {
  private readonly saluran: SaluranUci
  private readonly opsi: Required<OpsiMesin>
  private readonly antrean = new AntreanSerial()
  private status: StatusMesin = 'baru'
  private penantian: Penantian | null = null
  private aktif: PencarianAktif | null = null
  private multiPvSaatIni = 1

  constructor(saluran: SaluranUci, opsi: OpsiMesin = {}) {
    this.saluran = saluran
    this.opsi = {
      hashMb: opsi.hashMb ?? HASH_MB,
      batasWaktuMulaiMs: opsi.batasWaktuMulaiMs ?? BATAS_WAKTU_MULAI_MS,
      batasWaktuCariMs: opsi.batasWaktuCariMs ?? batasWaktuCariBawaan,
      tenggangStopMs: opsi.tenggangStopMs ?? TENGGANG_STOP_MS,
      sekarang: opsi.sekarang ?? (() => performance.now()),
    }
    saluran.padaBaris((b) => this.terimaBaris(b))
    saluran.padaGalat((e) => this.rusak(new GalatEngine('Rusak', e.message)))
  }

  get rusakAtauTertutup(): boolean {
    return this.status === 'rusak' || this.status === 'tertutup'
  }

  async mulai(): Promise<void> {
    if (this.status !== 'baru') throw new GalatEngine('GagalMulai', `status ${this.status}`)
    this.status = 'memulai'
    try {
      await this.kirimDanTunggu('uci', (b) => b === 'uciok', this.opsi.batasWaktuMulaiMs)
      this.saluran.kirim('setoption name Threads value 1')
      this.saluran.kirim(`setoption name Hash value ${this.opsi.hashMb}`)
      this.saluran.kirim('setoption name MultiPV value 1')
      await this.kirimDanTunggu('isready', (b) => b === 'readyok', this.opsi.batasWaktuMulaiMs)
      this.status = 'siap'
    } catch (e) {
      this.rusak(e instanceof GalatEngine ? e : new GalatEngine('GagalMulai', String(e)))
      throw e instanceof GalatEngine ? new GalatEngine('GagalMulai', e.message) : e
    }
  }

  cari(permintaan: PermintaanCari, signal?: AbortSignal): Promise<HasilCari> {
    return this.antrean.jalankan(() => this.cariSekarang(permintaan, signal))
  }

  /** Menghentikan pencarian berjalan; janji cari() ditolak dengan GalatEngine 'Dibatalkan'. */
  hentikan(): void {
    if (!this.aktif || this.aktif.alasanBatal) return
    this.aktif.alasanBatal = new GalatEngine('Dibatalkan')
    this.saluran.kirim('stop')
    this.pasangTenggangStop()
  }

  tutup(): void {
    if (this.status === 'tertutup') return
    this.akhiriSemua(new GalatEngine('Tertutup'))
    this.status = 'tertutup'
    this.saluran.tutup()
  }

  private async cariSekarang(p: PermintaanCari, signal?: AbortSignal): Promise<HasilCari> {
    if (this.status !== 'siap')
      throw new GalatEngine(this.status === 'tertutup' ? 'Tertutup' : 'Rusak')
    if (signal?.aborted) throw new GalatEngine('Dibatalkan')
    if (!POLA_FEN_AMAN.test(p.fen.trim()))
      throw new GalatEngine('MasukanTidakValid', `FEN: ${p.fen}`)
    if (!Number.isInteger(p.nodes) || p.nodes <= 0)
      throw new GalatEngine('MasukanTidakValid', 'nodes')
    if (!Number.isInteger(p.multiPv) || p.multiPv < 1)
      throw new GalatEngine('MasukanTidakValid', 'multiPv')

    let perluSiap = false
    if (p.multiPv !== this.multiPvSaatIni) {
      this.saluran.kirim(`setoption name MultiPV value ${p.multiPv}`)
      this.multiPvSaatIni = p.multiPv
      perluSiap = true
    }
    if (p.ucinewgame) {
      this.saluran.kirim('ucinewgame')
      perluSiap = true
    }
    if (perluSiap) {
      await this.kirimDanTunggu('isready', (b) => b === 'readyok', this.opsi.batasWaktuMulaiMs)
    }
    if (signal?.aborted) throw new GalatEngine('Dibatalkan')

    const batal = () => this.hentikan()
    signal?.addEventListener('abort', batal, { once: true })
    try {
      return await new Promise<HasilCari>((selesai, gagal) => {
        const pewaktu = setTimeout(() => {
          if (!this.aktif || this.aktif.alasanBatal) return
          this.aktif.alasanBatal = new GalatEngine('Timeout', `nodes ${p.nodes}`)
          this.saluran.kirim('stop')
          this.pasangTenggangStop()
        }, this.opsi.batasWaktuCariMs(p.nodes))
        this.aktif = {
          pengumpul: new PengumpulInfo(),
          permintaan: p,
          mulai: this.opsi.sekarang(),
          pewaktu,
          selesai,
          gagal,
        }
        this.saluran.kirim(`position fen ${p.fen.trim()}`)
        this.saluran.kirim(`go nodes ${p.nodes}`)
      })
    } finally {
      signal?.removeEventListener('abort', batal)
    }
  }

  private pasangTenggangStop(): void {
    const aktif = this.aktif
    setTimeout(() => {
      if (this.aktif === aktif && aktif) {
        this.rusak(new GalatEngine('Rusak', 'tidak ada bestmove setelah stop'))
      }
    }, this.opsi.tenggangStopMs)
  }

  private kirimDanTunggu(
    perintah: string,
    cocok: (b: string) => boolean,
    batasMs: number,
  ): Promise<void> {
    return new Promise((selesai, gagal) => {
      const pewaktu = setTimeout(() => {
        this.penantian = null
        gagal(new GalatEngine('Timeout', `menunggu jawaban "${perintah}"`))
      }, batasMs)
      this.penantian = { cocok, selesai, gagal, pewaktu }
      this.saluran.kirim(perintah)
    })
  }

  private terimaBaris(baris: string): void {
    const teks = baris.trim()
    const penantian = this.penantian
    if (penantian?.cocok(teks)) {
      clearTimeout(penantian.pewaktu)
      this.penantian = null
      penantian.selesai()
      return
    }
    const aktif = this.aktif
    if (!aktif) return
    const info = uraiBarisInfo(teks)
    if (info) {
      aktif.pengumpul.tambah(info)
      return
    }
    const bestmove = uraiBestmove(teks)
    if (!bestmove) return
    clearTimeout(aktif.pewaktu)
    this.aktif = null
    if (aktif.alasanBatal) {
      aktif.gagal(aktif.alasanBatal)
      return
    }
    aktif.selesai({
      fen: aktif.permintaan.fen,
      nodesDiminta: aktif.permintaan.nodes,
      multiPv: aktif.permintaan.multiPv,
      garis: aktif.pengumpul.hasil(),
      langkahTerbaik: bestmove.langkah,
      ponder: bestmove.ponder,
      nodes: aktif.pengumpul.nodesTerakhir,
      kedalaman: aktif.pengumpul.kedalamanTerakhir,
      waktuMs: this.opsi.sekarang() - aktif.mulai,
      versiEngine: VERSI_ENGINE,
    })
  }

  private rusak(galat: GalatEngine): void {
    if (this.status === 'tertutup') return
    this.status = 'rusak'
    this.akhiriSemua(galat)
  }

  private akhiriSemua(galat: GalatEngine): void {
    if (this.penantian) {
      clearTimeout(this.penantian.pewaktu)
      this.penantian.gagal(galat)
      this.penantian = null
    }
    if (this.aktif) {
      clearTimeout(this.aktif.pewaktu)
      this.aktif.gagal(this.aktif.alasanBatal ?? galat)
      this.aktif = null
    }
  }
}
