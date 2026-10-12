import { useParams } from 'react-router'
import { useIndeksLangkah } from '../pembantu/useIndeksLangkah'
import { HalamanSementara } from './HalamanSementara'

export function HalamanReview() {
  const { idPermainan } = useParams()
  const [indeksLangkah] = useIndeksLangkah()
  return (
    <HalamanSementara judul="Review">
      <p>Permainan: {idPermainan}</p>
      <p>Indeks ply: {indeksLangkah ?? 'tidak valid atau kosong'}</p>
    </HalamanSementara>
  )
}

export function HalamanKalibrasi() {
  return <HalamanSementara judul="Kalibrasi" />
}

export function HalamanPengaturan() {
  return <HalamanSementara judul="Pengaturan" />
}

export function HalamanTidakDitemukan() {
  return <HalamanSementara judul="Halaman tidak ditemukan" />
}

export function HalamanMemuat() {
  return (
    <p role="status" className="teks-mono">
      Memuat…
    </p>
  )
}
