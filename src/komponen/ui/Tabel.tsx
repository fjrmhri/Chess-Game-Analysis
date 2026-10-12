import type { ReactNode } from 'react'
import './Tabel.css'

export interface KolomTabel<T> {
  kunci: keyof T & string
  judul: string
  angka?: boolean
}

export interface PropsTabel<T> {
  judul: string
  kolom: readonly KolomTabel<T>[]
  baris: readonly T[]
  kunciBaris: (baris: T) => string
}

export function Tabel<T extends Record<string, ReactNode>>({
  judul,
  kolom,
  baris,
  kunciBaris,
}: PropsTabel<T>) {
  return (
    <div className="tabel" role="region" aria-label={judul} tabIndex={0}>
      <table>
        <caption>{judul}</caption>
        <thead>
          <tr>
            {kolom.map((k) => (
              <th key={k.kunci} scope="col" className={k.angka ? 'tabel__angka' : undefined}>
                {k.judul}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.map((b) => (
            <tr key={kunciBaris(b)}>
              {kolom.map((k) => (
                <td key={k.kunci} className={k.angka ? 'tabel__angka' : undefined}>
                  {b[k.kunci]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
