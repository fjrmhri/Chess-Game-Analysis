import type { ButtonHTMLAttributes } from 'react'
import '../../gaya/interaksi.css'
import './Tombol.css'

export type VarianTombol = 'utama' | 'kedua' | 'bahaya' | 'ghost'
export type UkuranTombol = 'kecil' | 'sedang' | 'besar'

export interface PropsTombol extends ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: VarianTombol
  ukuran?: UkuranTombol
}

export function Tombol({
  varian = 'utama',
  ukuran = 'sedang',
  type = 'button',
  className,
  ...sisa
}: PropsTombol) {
  const kelas = [
    'tombol',
    'interaktif',
    varian !== 'utama' && `tombol--${varian}`,
    ukuran !== 'sedang' && `tombol--${ukuran}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <button type={type} className={kelas} {...sisa} />
}
