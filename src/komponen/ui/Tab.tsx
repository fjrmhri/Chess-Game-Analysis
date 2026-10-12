import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import './Tab.css'

export interface ItemTab {
  kunci: string
  label: string
  isi: ReactNode
}

export interface PropsTab {
  label: string
  item: readonly ItemTab[]
  kunciAwal?: string
}

/** Pola WAI-ARIA Tabs: panah kiri/kanan, Home, End; aktivasi otomatis. */
export function Tab({ label, item, kunciAwal }: PropsTab) {
  const awalan = useId()
  const [aktif, setAktif] = useState(kunciAwal ?? item[0]?.kunci)
  const refTombol = useRef<Record<string, HTMLButtonElement | null>>({})

  function pindah(indeks: number) {
    const tujuan = item[(indeks + item.length) % item.length]
    if (!tujuan) return
    setAktif(tujuan.kunci)
    refTombol.current[tujuan.kunci]?.focus()
  }

  function tanganiTombol(e: KeyboardEvent<HTMLButtonElement>, indeks: number) {
    const peta: Record<string, number> = {
      ArrowRight: indeks + 1,
      ArrowLeft: indeks - 1,
      Home: 0,
      End: item.length - 1,
    }
    const tujuan = peta[e.key]
    if (tujuan === undefined) return
    e.preventDefault()
    pindah(tujuan)
  }

  return (
    <div className="tab">
      <div role="tablist" aria-label={label} className="tab__daftar">
        {item.map((t, i) => {
          const dipilih = t.kunci === aktif
          return (
            <button
              key={t.kunci}
              ref={(el) => {
                refTombol.current[t.kunci] = el
              }}
              id={`${awalan}-tab-${t.kunci}`}
              type="button"
              role="tab"
              aria-selected={dipilih}
              aria-controls={`${awalan}-panel-${t.kunci}`}
              tabIndex={dipilih ? 0 : -1}
              className="tab__tombol"
              onClick={() => setAktif(t.kunci)}
              onKeyDown={(e) => tanganiTombol(e, i)}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {item.map((t) => (
        <div
          key={t.kunci}
          id={`${awalan}-panel-${t.kunci}`}
          role="tabpanel"
          aria-labelledby={`${awalan}-tab-${t.kunci}`}
          hidden={t.kunci !== aktif}
          tabIndex={0}
          className="tab__panel"
        >
          {t.isi}
        </div>
      ))}
    </div>
  )
}
