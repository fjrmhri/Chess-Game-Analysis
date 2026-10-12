export interface EntriCache {
  url: string
  data: unknown
  diambilPada: number
  kedaluwarsaPada: number
}

export interface PenyimpananCache {
  baca(url: string): Promise<EntriCache | undefined>
  tulis(entri: EntriCache): Promise<void>
}

export class CacheMemori implements PenyimpananCache {
  readonly isi = new Map<string, EntriCache>()

  baca(url: string): Promise<EntriCache | undefined> {
    return Promise.resolve(this.isi.get(url))
  }

  tulis(entri: EntriCache): Promise<void> {
    this.isi.set(entri.url, entri)
    return Promise.resolve()
  }
}
