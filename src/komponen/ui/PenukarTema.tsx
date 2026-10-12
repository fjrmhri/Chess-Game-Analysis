import { useState } from 'react'
import {
  ambilPenyimpanan,
  bacaTema,
  simpanTema,
  terapkanTema,
  type PilihanTema,
} from '../../pembantu/tema'
import './PenukarTema.css'

const LABEL_TEMA: Record<PilihanTema, string> = {
  terang: 'Terang',
  gelap: 'Gelap',
  sistem: 'Sistem',
}

export function PenukarTema() {
  const [tema, setTema] = useState<PilihanTema>(() => bacaTema(ambilPenyimpanan()))

  function ubah(baru: PilihanTema) {
    setTema(baru)
    terapkanTema(document.documentElement, baru)
    simpanTema(ambilPenyimpanan(), baru)
  }

  return (
    <fieldset className="penukar-tema">
      <legend className="penukar-tema__legenda">Tema</legend>
      {(Object.keys(LABEL_TEMA) as PilihanTema[]).map((t) => (
        <label key={t} className="penukar-tema__opsi">
          <input
            type="radio"
            name="tema"
            value={t}
            checked={tema === t}
            onChange={() => ubah(t)}
            className="penukar-tema__radio"
          />
          <span className="penukar-tema__teks">{LABEL_TEMA[t]}</span>
        </label>
      ))}
    </fieldset>
  )
}
