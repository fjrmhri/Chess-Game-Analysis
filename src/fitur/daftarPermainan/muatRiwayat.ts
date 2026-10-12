import type { KlienChesscom } from '../../inti/chesscom/klien'
import { normalisasiPermainan } from '../../inti/chesscom/normalisasiPermainan'
import type { BasisDataTelaah } from '../../inti/data/basisData'
import type { Permainan } from '../../inti/data/tipe'

/** Daftar arsip bulanan, terbaru dulu. */
export async function ambilArsipTerbaruDulu(
  klien: KlienChesscom,
  username: string,
  signal?: AbortSignal,
  abaikanCache = false,
): Promise<string[]> {
  const { archives } = await klien.ambilDaftarArsip(username, { signal, abaikanCache })
  return [...archives].reverse()
}

/** Ambil satu bulan, normalisasi, simpan metadata ke Dexie (KEPUTUSAN P8-K1). Game yang gagal dinormalisasi dilewati. */
export async function muatBulan(
  klien: KlienChesscom,
  db: BasisDataTelaah,
  username: string,
  urlArsip: string,
  signal?: AbortSignal,
  abaikanCache = false,
): Promise<Permainan[]> {
  const { games } = await klien.ambilPermainanBulanan(urlArsip, { signal, abaikanCache })
  const hasil: Permainan[] = []
  for (const g of games) {
    try {
      hasil.push(normalisasiPermainan(g, username))
    } catch {
      // Game tanpa username ini (tidak seharusnya terjadi) dilewati
    }
  }
  await db.permainan.bulkPut(hasil).catch(() => undefined)
  return hasil
}

export async function ambilStatusAnalisis(
  db: BasisDataTelaah,
  idPermainan: readonly string[],
  versiAlgoritma: string,
): Promise<Set<string>> {
  if (idPermainan.length === 0) return new Set()
  try {
    const kunci = idPermainan.map((id) => [id, versiAlgoritma] as [string, string])
    const ada = await db.hasilAnalisis.bulkGet(kunci)
    return new Set(ada.flatMap((h) => (h ? [h.idPermainan] : [])))
  } catch {
    return new Set()
  }
}
