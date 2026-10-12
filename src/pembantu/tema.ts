export type PilihanTema = 'terang' | 'gelap' | 'sistem'

export const DAFTAR_TEMA: readonly PilihanTema[] = ['terang', 'gelap', 'sistem']
export const KUNCI_TEMA = 'telaah.tema'
export const TEMA_BAWAAN: PilihanTema = 'sistem'

type PenyimpananMinimal = Pick<Storage, 'getItem' | 'setItem'>

function adalahPilihanTema(nilai: unknown): nilai is PilihanTema {
  return typeof nilai === 'string' && (DAFTAR_TEMA as readonly string[]).includes(nilai)
}

/** localStorage bisa melempar (mode privat, situs diblokir); null berarti tidak tersedia. */
export function ambilPenyimpanan(): PenyimpananMinimal | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function bacaTema(penyimpanan: PenyimpananMinimal | null): PilihanTema {
  try {
    const nilai = penyimpanan?.getItem(KUNCI_TEMA)
    return adalahPilihanTema(nilai) ? nilai : TEMA_BAWAAN
  } catch {
    return TEMA_BAWAAN
  }
}

export function simpanTema(penyimpanan: PenyimpananMinimal | null, tema: PilihanTema): boolean {
  try {
    if (!penyimpanan) return false
    penyimpanan.setItem(KUNCI_TEMA, tema)
    return true
  } catch {
    return false
  }
}

export function terapkanTema(akar: HTMLElement, tema: PilihanTema): void {
  akar.dataset.tema = tema
}
