import type { ReactNode } from 'react'
import './KartuKeadaan.css'

export type JenisKeadaan = 'memuat' | 'kosong' | 'galat'

const SIMBOL: Record<JenisKeadaan, string> = { memuat: '…', kosong: '∅', galat: '!' }

export interface PropsKartuKeadaan {
  jenis: JenisKeadaan
  judul: string
  children?: ReactNode
  aksi?: ReactNode
}

/** Keadaan memuat/kosong/galat bergaya neo-brutalism; simbol + judul, tidak hanya warna. */
export function KartuKeadaan({ jenis, judul, children, aksi }: PropsKartuKeadaan) {
  return (
    <section
      className={`kartu-keadaan kartu-keadaan--${jenis}`}
      role={jenis === 'galat' ? 'alert' : 'status'}
      aria-busy={jenis === 'memuat' || undefined}
    >
      <span className="kartu-keadaan__simbol" aria-hidden="true">
        {SIMBOL[jenis]}
      </span>
      <div className="kartu-keadaan__isi">
        <h2 className="kartu-keadaan__judul">{judul}</h2>
        {children}
        {aksi && <div className="kartu-keadaan__aksi">{aksi}</div>}
      </div>
    </section>
  )
}
