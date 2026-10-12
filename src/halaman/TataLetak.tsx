import { Link, Outlet } from 'react-router'
import { URL_SUMBER } from '../konfigurasiAplikasi'

const TAUTAN_NAVIGASI = [
  { ke: '/', label: 'Beranda' },
  { ke: '/kalibrasi', label: 'Kalibrasi' },
  { ke: '/pengaturan', label: 'Pengaturan' },
  { ke: '/gaya', label: 'Gaya' },
  { ke: '/poc/api', label: 'PoC API' },
  { ke: '/poc/engine', label: 'PoC Engine' },
]

export function TataLetak() {
  return (
    <>
      <header>
        <nav aria-label="Navigasi utama">
          <ul>
            {TAUTAN_NAVIGASI.map(({ ke, label }) => (
              <li key={ke}>
                <Link to={ke}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>
          Perangkat lunak bebas berlisensi GPL-3.0. <a href={URL_SUMBER}>Kode sumber</a>
        </p>
      </footer>
    </>
  )
}
