import type { LabelLangkah } from '../penilaian/label'

export type Warna = 'putih' | 'hitam'
export type HasilSaya = 'menang' | 'kalah' | 'remis' | 'tidak-diketahui'

export interface Pemain {
  username: string
  daftarArsip: string[]
  diperbaruiPada: number
}

export interface Permainan {
  /** uuid PubAPI; `url` bila uuid tidak ada (KEPUTUSAN P5-K2). */
  id: string
  uuid?: string
  url: string
  username: string
  warnaSaya: Warna
  lawan: string
  namaPutih: string
  namaHitam: string
  ratingPutih: number
  ratingHitam: number
  /** Kode hasil mentah chess.com (win, checkmated, resigned, ...). */
  hasilPutih: string
  hasilHitam: string
  hasilSaya: HasilSaya
  timeClass: string
  timeControl: string
  rated: boolean
  rules: string
  didukung: boolean
  alasanTidakDidukung?: string
  endTime: number
  /** Jumlah langkah penuh (1. e4 e5 = 1). */
  jumlahLangkah: number
  jumlahPly: number
  /** Kode ECO dari tag PGN [ECO]; field `eco` PubAPI berisi URL, disimpan di ecoUrl. */
  eco?: string
  ecoUrl?: string
  pgn: string
  akurasiChessCom?: { putih: number; hitam: number }
}

export interface Posisi {
  idPermainan: string
  /** 0 = posisi awal; ply n = setelah langkah ke-n. */
  ply: number
  fen: string
  langkahUci: string | null
  langkahSan: string | null
  giliran: 'w' | 'b'
  isBook: boolean
  isTerminal: boolean
  /** Sisa jam pemain yang baru melangkah, dari komentar [%clk]. */
  sisaWaktuMs?: number
}

/** Skor dari sudut pandang pemain yang melangkah; tepat satu dari skorCp/skorMat terisi. */
export interface GarisEngine {
  multiPv: number
  skorCp?: number
  skorMat?: number
  batas?: 'bawah' | 'atas'
  pvUci: string[]
  kedalaman: number
  nodes?: number
}

export interface Evaluasi {
  /** 4 field pertama FEN (KEPUTUSAN butir 6). */
  fen4: string
  anggaranNodes: number
  multiPv: number
  versiEngine: string
  garis: GarisEngine[]
  langkahTerbaik: string | null
  dibuatPada: number
}

export interface LabelLangkahTersimpan {
  idPermainan: string
  ply: number
  label: LabelLangkah
  poinHilang: number
  epSebelum: number
  epSesudah: number
  langkahTerbaik: string | null
  pvTerbaik: string[]
  alasan: string[]
}

export type RingkasanLabel = Partial<Record<LabelLangkah, number>>

export interface HasilAnalisis {
  idPermainan: string
  versiAlgoritma: string
  akurasi: { putih: number; hitam: number }
  ratingPermainan?: { putih: number; hitam: number }
  ringkasan: { putih: RingkasanLabel; hitam: RingkasanLabel }
  /** Expected points putih per ply. */
  kurvaEvaluasi: number[]
  selesaiPada: number
}

export interface DataKalibrasi {
  idPermainan: string
  ply: number
  labelChessCom?: LabelLangkah
  labelSaya?: LabelLangkah
  akurasiChessCom?: number
  ratingChessCom?: number
}

export interface Variasi {
  idVariasi: string
  idPermainan: string
  plyInduk: number
  langkah: string[]
  label: (LabelLangkah | null)[]
  dibuatPada: number
}
