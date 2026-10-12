import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { KonteksToast, type JenisToast } from './konteksToast'
import './Toast.css'

interface ItemToast {
  id: number
  pesan: string
  jenis: JenisToast
}

const SIMBOL_JENIS: Record<JenisToast, string> = { info: 'i', sukses: '✓', galat: '!' }
const NAMA_JENIS: Record<JenisToast, string> = { info: 'Info', sukses: 'Berhasil', galat: 'Galat' }
// Durasi tampil toast sebelum hilang otomatis
const DURASI_TOAST_MS = 5000

export function PenyediaToast({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<ItemToast[]>([])
  const idBerikut = useRef(0)
  const pewaktu = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const tutup = useCallback((id: number) => {
    setDaftar((d) => d.filter((t) => t.id !== id))
    clearTimeout(pewaktu.current.get(id))
    pewaktu.current.delete(id)
  }, [])

  const tampilkan = useCallback(
    (pesan: string, jenis: JenisToast = 'info') => {
      const id = idBerikut.current++
      setDaftar((d) => [...d, { id, pesan, jenis }])
      pewaktu.current.set(
        id,
        setTimeout(() => tutup(id), DURASI_TOAST_MS),
      )
    },
    [tutup],
  )

  useEffect(() => {
    const peta = pewaktu.current
    return () => peta.forEach(clearTimeout)
  }, [])

  const nilai = useMemo(() => ({ tampilkan }), [tampilkan])

  return (
    <KonteksToast.Provider value={nilai}>
      {children}
      <div className="toast-wadah" role="status" aria-live="polite">
        {daftar.map((t) => (
          <div key={t.id} className={`toast toast--${t.jenis}`}>
            <span className="toast__simbol" aria-hidden="true">
              {SIMBOL_JENIS[t.jenis]}
            </span>
            <span className="toast__pesan">
              <span className="hanya-pembaca-layar">{NAMA_JENIS[t.jenis]}: </span>
              {t.pesan}
            </span>
            <button
              type="button"
              className="toast__tutup"
              onClick={() => tutup(t.id)}
              aria-label="Tutup notifikasi"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </KonteksToast.Provider>
  )
}
