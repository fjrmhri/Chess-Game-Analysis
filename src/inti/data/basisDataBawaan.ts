import { bukaBasisData, type BasisDataTelaah } from './basisData'

let db: BasisDataTelaah | undefined

/** Satu instance Dexie untuk seluruh aplikasi. */
export function ambilBasisData(): BasisDataTelaah {
  db ??= bukaBasisData()
  return db
}
