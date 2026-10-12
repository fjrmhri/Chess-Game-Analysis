import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { GalatChesscom } from '../inti/chesscom/galat'
import { normalisasiUsername } from '../inti/chesscom/username'
import { Kartu } from '../komponen/ui/Kartu'
import { KolomIsian } from '../komponen/ui/KolomIsian'
import { Tombol } from '../komponen/ui/Tombol'
import { ambilPenyimpanan } from '../pembantu/tema'
import { bacaUsernameTerakhir, catatUsername } from '../pembantu/usernameTerakhir'
import './HalamanMasuk.css'

export function HalamanMasuk() {
  const navigasi = useNavigate()
  const [masukan, setMasukan] = useState('')
  const [galat, setGalat] = useState<string | undefined>()
  const [terakhir] = useState(() => bacaUsernameTerakhir(ambilPenyimpanan()))

  function kirim(e: FormEvent) {
    e.preventDefault()
    try {
      const username = normalisasiUsername(masukan)
      catatUsername(ambilPenyimpanan(), username)
      void navigasi(`/pemain/${encodeURIComponent(username)}`)
    } catch (err) {
      setGalat(err instanceof GalatChesscom ? err.message : 'Username tidak valid.')
    }
  }

  return (
    <div className="halaman-masuk">
      <header>
        <h1>Telaah</h1>
        <p className="halaman-masuk__lead">
          Review game catur dari arsip publik chess.com. Analisis berjalan di browser Anda.
        </p>
      </header>

      <Kartu judul="Muat riwayat" aksen="utama">
        <form className="halaman-masuk__form" onSubmit={kirim} noValidate>
          <KolomIsian
            label="Username chess.com"
            value={masukan}
            onChange={(e) => {
              setMasukan(e.target.value)
              setGalat(undefined)
            }}
            galat={galat}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <Tombol type="submit" ukuran="besar">
            Muat riwayat
          </Tombol>
        </form>
      </Kartu>

      {terakhir.length > 0 && (
        <section aria-labelledby="judul-terakhir">
          <h2 id="judul-terakhir">Terakhir dibuka</h2>
          <ul className="halaman-masuk__terakhir">
            {terakhir.map((u) => (
              <li key={u}>
                <Link
                  className="tombol tombol--ghost tombol--kecil interaktif"
                  to={`/pemain/${encodeURIComponent(u)}`}
                >
                  {u}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
