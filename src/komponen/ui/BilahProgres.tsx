import './BilahProgres.css'

export interface PropsBilahProgres {
  label: string
  nilai: number
  maks: number
  jumlahSegmen?: number
}

export function hitungSegmenTerisi(nilai: number, maks: number, jumlahSegmen: number): number {
  if (maks <= 0 || !Number.isFinite(nilai)) return 0
  const rasio = Math.min(1, Math.max(0, nilai / maks))
  return Math.floor(rasio * jumlahSegmen)
}

export function BilahProgres({ label, nilai, maks, jumlahSegmen = 20 }: PropsBilahProgres) {
  const terisi = hitungSegmenTerisi(nilai, maks, jumlahSegmen)
  const persen = maks > 0 ? Math.round((Math.min(nilai, maks) / maks) * 100) : 0
  return (
    <div className="bilah-progres">
      <div className="bilah-progres__kepala">
        <span className="bilah-progres__label">{label}</span>
        <span className="bilah-progres__angka">
          {Math.min(nilai, maks)}/{maks}
        </span>
      </div>
      <div
        className="bilah-progres__jalur"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={maks}
        aria-valuenow={Math.min(nilai, maks)}
        aria-valuetext={`${persen}%`}
      >
        {Array.from({ length: jumlahSegmen }, (_, i) => (
          <span key={i} className="bilah-progres__segmen" data-terisi={i < terisi} />
        ))}
      </div>
    </div>
  )
}
