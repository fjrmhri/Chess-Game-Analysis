import { describe, expect, it } from 'vitest'
import { hitungSegmenTerisi } from './BilahProgres'

describe('hitungSegmenTerisi', () => {
  it('membulatkan ke bawah agar segmen penuh hanya saat selesai', () => {
    expect(hitungSegmenTerisi(13, 40, 20)).toBe(6)
    expect(hitungSegmenTerisi(39, 40, 20)).toBe(19)
    expect(hitungSegmenTerisi(40, 40, 20)).toBe(20)
  })

  it('membatasi nilai di luar rentang dan input tidak valid', () => {
    expect(hitungSegmenTerisi(-5, 40, 20)).toBe(0)
    expect(hitungSegmenTerisi(99, 40, 20)).toBe(20)
    expect(hitungSegmenTerisi(5, 0, 20)).toBe(0)
    expect(hitungSegmenTerisi(Number.NaN, 40, 20)).toBe(0)
  })
})
