import type { HTMLAttributes } from 'react'
import './Lencana.css'

export type VarianLencana = 'netral' | 'utama' | 'kedua' | 'ketiga' | 'bahaya'

export interface PropsLencana extends HTMLAttributes<HTMLSpanElement> {
  varian?: VarianLencana
}

export function Lencana({ varian = 'netral', className, ...sisa }: PropsLencana) {
  const kelas = ['lencana', `lencana--${varian}`, className].filter(Boolean).join(' ')
  return <span className={kelas} {...sisa} />
}
