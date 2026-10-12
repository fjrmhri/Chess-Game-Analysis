import { describe, expect, it } from 'vitest'
import { uraiIndeksLangkah } from './indeksLangkah'

describe('uraiIndeksLangkah', () => {
  it('menerima 0 sebagai posisi awal', () => {
    expect(uraiIndeksLangkah('0')).toBe(0)
  })

  it('menerima bilangan bulat positif', () => {
    expect(uraiIndeksLangkah('12')).toBe(12)
    expect(uraiIndeksLangkah('007')).toBe(7)
  })

  it.each([null, '', ' ', '-1', '1.5', '1e3', 'abc', '12a', '+3', '99999999999999999999'])(
    'menolak %j',
    (masukan) => {
      expect(uraiIndeksLangkah(masukan)).toBeNull()
    },
  )
})
