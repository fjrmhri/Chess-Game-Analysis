import { useParams } from 'react-router'
import { useIndeksLangkah } from '../pembantu/useIndeksLangkah'
import { HalamanSementara } from './HalamanSementara'

export function HalamanBeranda() {
  return <HalamanSementara judul="Telaah" />
}

export function HalamanPemain() {
  const { username } = useParams()
  return (
    <HalamanSementara judul="Daftar game">
      <p>Pemain: {username}</p>
    </HalamanSementara>
  )
}

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

export function HalamanGaya() {
  return <HalamanSementara judul="Gaya" />
}

export function HalamanPocApi() {
  return <HalamanSementara judul="PoC API" />
}

export function HalamanPocEngine() {
  return <HalamanSementara judul="PoC Engine" />
}

export function HalamanTidakDitemukan() {
  return <HalamanSementara judul="Halaman tidak ditemukan" />
}
