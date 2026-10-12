import type { Posisi } from '../../inti/data/tipe'
import type { LabelPly } from '../../inti/penilaian/penilaianPermainan'

export interface SelLangkah {
  san: string
  label: LabelPly
}

export interface BarisLangkahPenuh {
  nomor: number
  putih?: SelLangkah
  hitam?: SelLangkah
}

/** Nomor langkah penuh dan giliran dari FEN posisi awal. */
export function awalDariFen(fen: string): { nomor: number; giliran: 'w' | 'b' } {
  const bagian = fen.trim().split(/\s+/)
  const nomor = Number(bagian[5])
  return {
    nomor: Number.isInteger(nomor) && nomor > 0 ? nomor : 1,
    giliran: bagian[1] === 'b' ? 'b' : 'w',
  }
}

/** Mengelompokkan label per langkah penuh: satu baris = langkah putih + langkah hitam. */
export function kelompokkanPerLangkah(
  label: readonly LabelPly[],
  posisi: readonly Posisi[],
): BarisLangkahPenuh[] {
  const awal = posisi.find((p) => p.ply === 0)
  const { nomor: nomorAwal, giliran } = awalDariFen(awal?.fen ?? '')
  const sanPer = new Map(posisi.map((p) => [p.ply, p.langkahSan]))
  const baris = new Map<number, BarisLangkahPenuh>()
  for (const l of label) {
    // Indeks setengah langkah dihitung dari putih pada nomor awal
    const indeks = l.ply - 1 + (giliran === 'b' ? 1 : 0)
    const nomor = nomorAwal + Math.floor(indeks / 2)
    const b = baris.get(nomor) ?? { nomor }
    const sel = { san: sanPer.get(l.ply) ?? l.langkahUci, label: l }
    if (l.warna === 'w') b.putih = sel
    else b.hitam = sel
    baris.set(nomor, b)
  }
  return [...baris.values()].sort((a, b) => a.nomor - b.nomor)
}
