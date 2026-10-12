import { Dexie, type EntityTable } from 'dexie'
import type { EntriCache, PenyimpananCache } from '../chesscom/cache'

export const NAMA_BASIS_DATA = 'TelaahDB'

export type BasisDataTelaah = Dexie & {
  cacheApi: EntityTable<EntriCache, 'url'>
}

export function bukaBasisData(nama = NAMA_BASIS_DATA): BasisDataTelaah {
  const db = new Dexie(nama) as BasisDataTelaah
  // Versi 1: cache PubAPI. Tabel lain menyusul (P5) sebagai versi baru.
  db.version(1).stores({
    cacheApi: 'url, kedaluwarsaPada',
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
