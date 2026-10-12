import { createContext, useContext } from 'react'

export type JenisToast = 'info' | 'sukses' | 'galat'

export interface NilaiToast {
  tampilkan: (pesan: string, jenis?: JenisToast) => void
}

export const KonteksToast = createContext<NilaiToast | null>(null)

export function useToast(): NilaiToast {
  const nilai = useContext(KonteksToast)
  if (!nilai) throw new Error('useToast harus dipakai di dalam PenyediaToast')
  return nilai
}
