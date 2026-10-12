import { useId, type InputHTMLAttributes } from 'react'
import './Medan.css'

export interface PropsKolomIsian extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  bantuan?: string
  galat?: string
}

export function KolomIsian({ label, bantuan, galat, id, className, ...sisa }: PropsKolomIsian) {
  const idOtomatis = useId()
  const idKolom = id ?? idOtomatis
  const idBantuan = bantuan ? `${idKolom}-bantuan` : undefined
  const idGalat = galat ? `${idKolom}-galat` : undefined
  const keterangan = [idBantuan, idGalat].filter(Boolean).join(' ') || undefined

  return (
    <div className={['medan', className].filter(Boolean).join(' ')}>
      <label className="medan__label" htmlFor={idKolom}>
        {label}
      </label>
      <input
        id={idKolom}
        className="medan__kontrol"
        aria-invalid={galat ? true : undefined}
        aria-describedby={keterangan}
        {...sisa}
      />
      {bantuan && (
        <span id={idBantuan} className="medan__bantuan">
          {bantuan}
        </span>
      )}
      {galat && (
        <span id={idGalat} className="medan__galat">
          {galat}
        </span>
      )}
    </div>
  )
}
