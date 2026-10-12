import { describe, expect, it } from 'vitest'
import tokenCss from './token.css?raw'
import {
  hitungRasioKontras,
  periksaKontras,
  selesaikanWarna,
  uraiTokenCss,
  type HasilKontras,
} from './kontras'

describe('hitungRasioKontras', () => {
  it('hitam vs putih = 21:1', () => {
    expect(hitungRasioKontras('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })

  it('warna sama = 1:1 dan simetris', () => {
    expect(hitungRasioKontras('#777', '#777777')).toBeCloseTo(1, 5)
    expect(hitungRasioKontras('#4d9de0', '#fff8e7')).toBeCloseTo(
      hitungRasioKontras('#fff8e7', '#4d9de0'),
      10,
    )
  })

  it('#767676 di atas putih ~4.54:1 (nilai acuan umum WCAG)', () => {
    expect(hitungRasioKontras('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })
})

describe('token.css', () => {
  const token = uraiTokenCss(tokenCss)

  it('blok gelap media query identik dengan blok data-tema gelap', () => {
    expect(token.gelapMedia).toEqual(token.gelap)
  })

  it('menyelesaikan rujukan var()', () => {
    expect(selesaikanWarna(token.terang, '--fokus')).toBe(selesaikanWarna(token.terang, '--tinta'))
  })

  const semua: HasilKontras[] = [
    ...periksaKontras(token.terang, 'terang'),
    ...periksaKontras(token.gelap, 'gelap'),
  ]

  it('semua pasangan memenuhi ambang WCAG AA', () => {
    console.table(
      semua.map((h) => ({
        tema: h.tema,
        jenis: h.jenis,
        pasangan: `${h.depan} | ${h.belakang}`,
        rasio: h.rasio.toFixed(2),
        status: h.lulus ? 'LULUS' : 'GAGAL',
      })),
    )
    expect(semua.filter((h) => !h.lulus)).toEqual([])
  })
})
