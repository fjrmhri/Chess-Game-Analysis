import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Tombol } from './Tombol'
import './Dialog.css'

export interface PropsDialog {
  terbuka: boolean
  judul: string
  padaTutup: () => void
  children: ReactNode
  aksi?: ReactNode
}

/** <dialog> modal bawaan browser: perangkap fokus, Escape, dan inert latar ditangani browser. */
export function Dialog({ terbuka, judul, padaTutup, children, aksi }: PropsDialog) {
  const ref = useRef<HTMLDialogElement>(null)
  const idJudul = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (terbuka && !el.open) el.showModal()
    if (!terbuka && el.open) el.close()
  }, [terbuka])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={idJudul}
      onClose={padaTutup}
      onCancel={(e) => {
        e.preventDefault()
        padaTutup()
      }}
    >
      <header className="dialog__kepala">
        <h2 id={idJudul} className="dialog__judul">
          {judul}
        </h2>
        <Tombol varian="ghost" ukuran="kecil" onClick={padaTutup} aria-label="Tutup dialog">
          ✕
        </Tombol>
      </header>
      <div className="dialog__isi">{children}</div>
      {aksi && <footer className="dialog__aksi">{aksi}</footer>}
    </dialog>
  )
}
