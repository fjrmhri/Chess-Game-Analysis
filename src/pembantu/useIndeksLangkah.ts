import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { uraiIndeksLangkah } from './indeksLangkah'

export const PARAMETER_LANGKAH = 'move'

export function useIndeksLangkah(): [number | null, (indeks: number) => void] {
  const [parameter, setParameter] = useSearchParams()
  const indeks = uraiIndeksLangkah(parameter.get(PARAMETER_LANGKAH))

  const aturIndeks = useCallback(
    (indeksBaru: number) => {
      setParameter(
        (sebelumnya) => {
          const berikutnya = new URLSearchParams(sebelumnya)
          berikutnya.set(PARAMETER_LANGKAH, String(indeksBaru))
          return berikutnya
        },
        { replace: true },
      )
    },
    [setParameter],
  )

  return [indeks, aturIndeks]
}
