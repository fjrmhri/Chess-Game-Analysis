import { TABEL_DATA, type BasisDataTelaah, type NamaTabelData } from './basisData'

export const FORMAT_EKSPOR = 'telaah-ekspor'

export interface BerkasEkspor {
  format: typeof FORMAT_EKSPOR
  versiSkema: number
  dibuatPada: number
  tabel: Record<NamaTabelData, unknown[]>
}

export class GalatImpor extends Error {
  constructor(pesan: string) {
    super(pesan)
    this.name = 'GalatImpor'
  }
}

export async function eksporBasisData(
  db: BasisDataTelaah,
  dibuatPada = Date.now(),
): Promise<BerkasEkspor> {
  const isi = await db.transaction(
    'r',
    TABEL_DATA.map((t) => db.table(t)),
    async () => Promise.all(TABEL_DATA.map((t) => db.table(t).toArray())),
  )
  const tabel = Object.fromEntries(TABEL_DATA.map((t, i) => [t, isi[i] ?? []])) as Record<
    NamaTabelData,
    unknown[]
  >
  return { format: FORMAT_EKSPOR, versiSkema: db.verno, dibuatPada, tabel }
}

function validasiBerkas(data: unknown, versiSaatIni: number): BerkasEkspor {
  if (typeof data !== 'object' || data === null) throw new GalatImpor('Berkas bukan objek JSON.')
  const b = data as Partial<BerkasEkspor>
  if (b.format !== FORMAT_EKSPOR) throw new GalatImpor('Bukan berkas ekspor Telaah.')
  if (typeof b.versiSkema !== 'number' || b.versiSkema > versiSaatIni) {
    throw new GalatImpor(
      `Versi skema ${String(b.versiSkema)} tidak didukung (aplikasi: ${versiSaatIni}).`,
    )
  }
  if (typeof b.tabel !== 'object' || b.tabel === null)
    throw new GalatImpor('Bagian "tabel" tidak ada.')
  for (const t of TABEL_DATA) {
    const isi = (b.tabel as Partial<Record<string, unknown>>)[t]
    if (isi !== undefined && !Array.isArray(isi)) throw new GalatImpor(`Tabel "${t}" bukan array.`)
  }
  return b as BerkasEkspor
}

/** mode 'ganti' mengosongkan tabel data lebih dulu; 'gabung' menimpa baris dengan kunci sama. */
export async function imporBasisData(
  db: BasisDataTelaah,
  data: unknown,
  mode: 'ganti' | 'gabung' = 'ganti',
): Promise<void> {
  const berkas = validasiBerkas(data, db.verno)
  await db.transaction(
    'rw',
    TABEL_DATA.map((t) => db.table(t)),
    async () => {
      for (const t of TABEL_DATA) {
        const tabel = db.table(t)
        if (mode === 'ganti') await tabel.clear()
        const baris = berkas.tabel[t] ?? []
        if (baris.length) await tabel.bulkPut(baris)
      }
    },
  )
}
