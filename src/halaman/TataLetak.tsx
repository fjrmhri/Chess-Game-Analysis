import { NavLink, Outlet } from 'react-router'
import { URL_SUMBER } from '../konfigurasiAplikasi'
import { PenyediaToast } from '../komponen/ui/Toast'
import './TataLetak.css'

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
    <PenyediaToast>
      <a className="lewati-ke-konten" href="#konten">
        Lewati ke konten
      </a>
      <header className="tata-letak__kepala">
        <NavLink to="/" className="tata-letak__merek">
          Telaah
        </NavLink>
        <nav aria-label="Navigasi utama">
          <ul className="tata-letak__navigasi">
            {TAUTAN_NAVIGASI.map(({ ke, label }) => (
              <li key={ke}>
                <NavLink to={ke} end className="tata-letak__tautan">
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="konten" className="tata-letak__isi" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="tata-letak__kaki">
        <p>
          Perangkat lunak bebas berlisensi GPL-3.0. <a href={URL_SUMBER}>Kode sumber</a>
        </p>
      </footer>
    </PenyediaToast>
  )
}
