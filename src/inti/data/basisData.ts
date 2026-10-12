import { Dexie, type DexieOptions, type EntityTable, type Table } from 'dexie'
import type { EntriCache, PenyimpananCache } from '../chesscom/cache'
import type {
  DataKalibrasi,
  Evaluasi,
  HasilAnalisis,
  LabelLangkahTersimpan,
  Pemain,
  Permainan,
  Posisi,
  Variasi,
} from './tipe'

export const NAMA_BASIS_DATA = 'TelaahDB'

export type BasisDataTelaah = Dexie & {
  cacheApi: EntityTable<EntriCache, 'url'>
  pemain: EntityTable<Pemain, 'username'>
  permainan: EntityTable<Permainan, 'id'>
  posisi: Table<Posisi, [string, number]>
  evaluasi: Table<Evaluasi, [string, number, number, string]>
  labelLangkah: Table<LabelLangkahTersimpan, [string, number]>
  hasilAnalisis: Table<HasilAnalisis, [string, string]>
  kalibrasi: Table<DataKalibrasi, [string, number]>
  variasi: EntityTable<Variasi, 'idVariasi'>
}

/** Tabel yang ikut ekspor/impor (cacheApi dikecualikan, KEPUTUSAN P5-K6). */
export const TABEL_DATA = [
  'pemain',
  'permainan',
  'posisi',
  'evaluasi',
  'labelLangkah',
  'hasilAnalisis',
  'kalibrasi',
  'variasi',
] as const

export type NamaTabelData = (typeof TABEL_DATA)[number]

export function bukaBasisData(nama = NAMA_BASIS_DATA, opsi?: DexieOptions): BasisDataTelaah {
  const db = new Dexie(nama, opsi) as BasisDataTelaah
  // Versi 1 (P3): cache PubAPI.
  db.version(1).stores({
    cacheApi: 'url, kedaluwarsaPada',
  })
  // Versi 2 (P5): data permainan dan analisis. Tabel baru, tanpa transformasi data lama.
  db.version(2).stores({
    pemain: 'username',
    permainan: 'id, uuid, url, [username+endTime], [username+timeClass+endTime]',
    posisi: '[idPermainan+ply], idPermainan',
    evaluasi: '[fen4+anggaranNodes+multiPv+versiEngine], fen4',
    labelLangkah: '[idPermainan+ply], idPermainan',
    hasilAnalisis: '[idPermainan+versiAlgoritma], idPermainan',
    kalibrasi: '[idPermainan+ply], idPermainan',
    variasi: 'idVariasi, idPermainan',
  })
  return db
}

/** Cache di IndexedDB; bila IndexedDB tidak tersedia (mode privat), baca = miss dan tulis diabaikan. */
export class CacheDexie implements PenyimpananCache {
  private readonly db: BasisDataTelaah

  constructor(db: BasisDataTelaah) {
    this.db = db
  }

  async baca(url: string): Promise<EntriCache | undefined> {
    try {
      return await this.db.cacheApi.get(url)
    } catch {
      return undefined
    }
  }

  async tulis(entri: EntriCache): Promise<void> {
    try {
      await this.db.cacheApi.put(entri)
    } catch {
      // Penyimpanan penuh atau diblokir: aplikasi tetap jalan tanpa cache
    }
  }
}
