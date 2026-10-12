import { useId, type SelectHTMLAttributes } from 'react'
import './Medan.css'

export interface OpsiPilihan {
  nilai: string
  label: string
}

export interface PropsPilihan extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  opsi: readonly OpsiPilihan[]
  bantuan?: string
}

export function Pilihan({ label, opsi, bantuan, id, className, ...sisa }: PropsPilihan) {
  const idOtomatis = useId()
  const idPilihan = id ?? idOtomatis
  const idBantuan = bantuan ? `${idPilihan}-bantuan` : undefined

  return (
    <div className={['medan', className].filter(Boolean).join(' ')}>
      <label className="medan__label" htmlFor={idPilihan}>
        {label}
      </label>
      <div className="medan__bungkus-pilihan">
        <select id={idPilihan} className="medan__kontrol" aria-describedby={idBantuan} {...sisa}>
          {opsi.map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {bantuan && (
        <span id={idBantuan} className="medan__bantuan">
          {bantuan}
        </span>
      )}
    </div>
  )
}
