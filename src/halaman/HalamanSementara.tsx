import type { ReactNode } from 'react'

interface PropsHalamanSementara {
  judul: string
  children?: ReactNode
}

export function HalamanSementara({ judul, children }: PropsHalamanSementara) {
  return (
    <section>
      <h1>{judul}</h1>
      <p>Halaman sementara. Isi menyusul.</p>
      {children}
    </section>
  )
}
