import type { LabelLangkah } from '../penilaian/label'
import { NAMA_LABEL } from '../penilaian/label'

/** NAG standar PGN; label tanpa padanan (Best, Excellent, Good, Book, Miss) hanya di komentar. */
const NAG_LABEL: Partial<Record<LabelLangkah, string>> = {
  brilliant: '$3',
  great: '$1',
  inaccuracy: '$6',
  mistake: '$2',
  blunder: '$4',
}

export interface LangkahBeranotasi {
  ply: number
  langkahSan: string
  label: LabelLangkah
  poinHilang: number
  langkahTerbaik: string | null
}

export interface OpsiPgnBeranotasi {
  pgnAsli: string
  langkah: readonly LangkahBeranotasi[]
  /** Nomor langkah penuh dan giliran pada ply 0 (dari FEN awal). */
  nomorAwal?: number
  giliranAwal?: 'w' | 'b'
  versiAlgoritma: string
  akurasi?: { putih: number | undefined; hitam: number | undefined }
}

function bersihkanKomentar(teks: string): string {
  return teks.replace(/[{}]/g, '')
}

/** PGN dengan label Telaah sebagai NAG + komentar, header asli dipertahankan. */
export function buatPgnBeranotasi(opsi: OpsiPgnBeranotasi): string {
  const header = opsi.pgnAsli
    .split(/\r?\n/)
    .filter((b) => /^\[\w+ "/.test(b.trim()))
    .map((b) => b.trim())
  const hasil = /\[Result "([^"]*)"\]/.exec(opsi.pgnAsli)?.[1] ?? '*'
  const tambahan = [
    `[Annotator "Telaah ${opsi.versiAlgoritma}"]`,
    ...(opsi.akurasi?.putih === undefined
      ? []
      : [`[TelaahAkurasiPutih "${opsi.akurasi.putih.toFixed(1)}"]`]),
    ...(opsi.akurasi?.hitam === undefined
      ? []
      : [`[TelaahAkurasiHitam "${opsi.akurasi.hitam.toFixed(1)}"]`]),
  ]
  const tanpaAnnotator = header.filter((b) => !b.startsWith('[Annotator '))

  const urut = [...opsi.langkah].sort((a, b) => a.ply - b.ply)
  const nomorAwal = opsi.nomorAwal ?? 1
  const putihAwal = (opsi.giliranAwal ?? 'w') === 'w'
  const token: string[] = []
  urut.forEach((l, i) => {
    const putih = (i % 2 === 0) === putihAwal
    const nomor = nomorAwal + Math.floor((i + (putihAwal ? 0 : 1)) / 2)
    // Setelah komentar, langkah hitam ditulis ulang dengan "N..."
    token.push(putih ? `${nomor}.` : `${nomor}...`)
    token.push(l.langkahSan)
    const nag = NAG_LABEL[l.label]
    if (nag) token.push(nag)
    const terbaik = l.langkahTerbaik ? ` | terbaik ${l.langkahTerbaik}` : ''
    token.push(
      `{${bersihkanKomentar(`${NAMA_LABEL[l.label]} | hilang ${l.poinHilang.toFixed(3)}${terbaik}`)}}`,
    )
  })
  token.push(hasil)
  return `${[...tanpaAnnotator, ...tambahan].join('\n')}\n\n${token.join(' ')}\n`
}
