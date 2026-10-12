import { describe, expect, it } from 'vitest'
import { bacaTema, KUNCI_TEMA, simpanTema, terapkanTema } from './tema'

function penyimpananPalsu(awal: Record<string, string> = {}) {
  const isi = new Map(Object.entries(awal))
  return {
    getItem: (k: string) => isi.get(k) ?? null,
    setItem: (k: string, v: string) => void isi.set(k, v),
    isi,
  }
}

const penyimpananRusak = {
  getItem: (): string | null => {
    throw new Error('SecurityError')
  },
  setItem: (): void => {
    throw new Error('QuotaExceededError')
  },
}

describe('tema', () => {
  it('bawaan sistem bila kosong, tidak valid, atau penyimpanan tidak ada', () => {
    expect(bacaTema(penyimpananPalsu())).toBe('sistem')
    expect(bacaTema(penyimpananPalsu({ [KUNCI_TEMA]: 'ungu' }))).toBe('sistem')
    expect(bacaTema(null)).toBe('sistem')
  })

  it('membaca tema tersimpan', () => {
    expect(bacaTema(penyimpananPalsu({ [KUNCI_TEMA]: 'gelap' }))).toBe('gelap')
  })

  it('simpan lalu baca menghasilkan nilai sama', () => {
    const p = penyimpananPalsu()
    expect(simpanTema(p, 'terang')).toBe(true)
    expect(bacaTema(p)).toBe('terang')
  })

  it('tidak melempar saat penyimpanan melempar', () => {
    expect(bacaTema(penyimpananRusak)).toBe('sistem')
    expect(simpanTema(penyimpananRusak, 'gelap')).toBe(false)
    expect(simpanTema(null, 'gelap')).toBe(false)
  })

  it('menulis atribut data-tema', () => {
    const el = document.createElement('html')
    terapkanTema(el, 'gelap')
    expect(el.getAttribute('data-tema')).toBe('gelap')
  })
})
