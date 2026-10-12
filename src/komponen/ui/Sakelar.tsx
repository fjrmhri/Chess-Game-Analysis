import { useId, type ButtonHTMLAttributes } from 'react'
import '../../gaya/interaksi.css'
import './Sakelar.css'

export interface PropsSakelar extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'children'
> {
  label: string
  aktif: boolean
  padaUbah: (aktif: boolean) => void
}

export function Sakelar({ label, aktif, padaUbah, id, className, ...sisa }: PropsSakelar) {
  const idOtomatis = useId()
  const idSakelar = id ?? idOtomatis
  return (
    <div className={['sakelar', className].filter(Boolean).join(' ')}>
      <button
        id={idSakelar}
        type="button"
        role="switch"
        aria-checked={aktif}
        className="sakelar__tombol interaktif"
        onClick={() => padaUbah(!aktif)}
        {...sisa}
      >
        <span className="sakelar__jalur" aria-hidden="true">
          <span className="sakelar__kenop" />
        </span>
        <span className="sakelar__status" aria-hidden="true">
          {aktif ? 'Ya' : 'Tidak'}
        </span>
      </button>
      <label className="sakelar__label" htmlFor={idSakelar}>
        {label}
      </label>
    </div>
  )
}
