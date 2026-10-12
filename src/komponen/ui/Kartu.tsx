import type { HTMLAttributes, ReactNode } from 'react'
import './Kartu.css'

export type AksenKartu = 'tanpa' | 'utama' | 'kedua' | 'ketiga'

export interface PropsKartu extends HTMLAttributes<HTMLElement> {
  judul?: ReactNode
  aksen?: AksenKartu
}

export function Kartu({ judul, aksen = 'tanpa', className, children, ...sisa }: PropsKartu) {
  const kelas = ['kartu', className].filter(Boolean).join(' ')
  return (
    <section className={kelas} {...sisa}>
      {judul !== undefined && (
        <header className={`kartu__kepala kartu__kepala--${aksen}`}>
          <h3 className="kartu__judul">{judul}</h3>
        </header>
      )}
      <div className="kartu__isi">{children}</div>
    </section>
  )
}
