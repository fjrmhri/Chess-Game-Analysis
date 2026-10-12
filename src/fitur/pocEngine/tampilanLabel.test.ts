import { describe, expect, it } from 'vitest'
import type { Posisi } from '../../inti/data/tipe'
import type { LabelPly } from '../../inti/penilaian/penilaianPermainan'
import { awalDariFen, kelompokkanPerLangkah } from './tampilanLabel'

const lbl = (ply: number, warna: 'w' | 'b'): LabelPly => ({
  ply,
  warna,
  langkahUci: `u${ply}`,
  label: 'best',
  alasan: [],
  poinHilang: 0,
  epSebelum: 0.5,
  epSesudah: 0.5,
  langkahTerbaik: null,
  pvTerbaik: [],
})

const pos = (ply: number, fen: string, san: string | null): Posisi => ({
  idPermainan: 'x',
  ply,
  fen,
  langkahUci: null,
  langkahSan: san,
  giliran: 'w',
  isBook: false,
  isTerminal: false,
})

describe('kelompokkanPerLangkah', () => {
  it('putih dan hitam dalam satu baris per langkah penuh', () => {
    const posisi = [
      pos(0, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', null),
      pos(1, 'x', 'e4'),
      pos(2, 'x', 'e5'),
      pos(3, 'x', 'Nf3'),
    ]
    const b = kelompokkanPerLangkah([lbl(1, 'w'), lbl(2, 'b'), lbl(3, 'w')], posisi)
    expect(b.map((x) => [x.nomor, x.putih?.san, x.hitam?.san])).toEqual([
      [1, 'e4', 'e5'],
      [2, 'Nf3', undefined],
    ])
  })

  it('posisi awal giliran hitam: baris pertama hanya berisi langkah hitam', () => {
    const posisi = [
      pos(0, '8/8/8/8/8/8/8/K6k b - - 0 12', null),
      pos(1, 'x', 'Kg2'),
      pos(2, 'x', 'Kb2'),
    ]
    const b = kelompokkanPerLangkah([lbl(1, 'b'), lbl(2, 'w')], posisi)
    expect(b.map((x) => [x.nomor, x.putih?.san, x.hitam?.san])).toEqual([
      [12, undefined, 'Kg2'],
      [13, 'Kb2', undefined],
    ])
  })

  it('awalDariFen dengan FEN rusak jatuh ke 1/w', () => {
    expect(awalDariFen('')).toEqual({ nomor: 1, giliran: 'w' })
  })
})
