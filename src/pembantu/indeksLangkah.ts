const POLA_BILANGAN_BULAT = /^\d+$/

/** Indeks ply dari query `?move=N`; 0 = posisi awal. Selain bilangan bulat >= 0 menghasilkan null. */
export function uraiIndeksLangkah(teks: string | null): number | null {
  if (teks === null || !POLA_BILANGAN_BULAT.test(teks)) return null
  const indeks = Number(teks)
  return Number.isSafeInteger(indeks) ? indeks : null
}
