import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { daftarRute } from './ruteAplikasi'

function renderRute(url: string) {
  const router = createMemoryRouter(daftarRute, { initialEntries: [url] })
  render(<RouterProvider router={router} />)
}

afterEach(cleanup)

describe('daftarRute', () => {
  it.each([
    ['/', 'Telaah'],
    ['/pemain/fjrmhrii', 'Daftar game'],
    ['/review/abc', 'Review'],
    ['/kalibrasi', 'Kalibrasi'],
    ['/pengaturan', 'Pengaturan'],
    ['/gaya', 'Gaya'],
    ['/poc/api', 'PoC API'],
    ['/poc/engine', 'PoC Engine'],
    ['/tidak-ada', 'Halaman tidak ditemukan'],
  ])('%s menampilkan judul %s', async (url, judul) => {
    renderRute(url)
    expect(await screen.findByRole('heading', { level: 1, name: judul })).toBeDefined()
  })

  it('meneruskan parameter rute dan ?move=N ke halaman review', async () => {
    renderRute('/review/abc?move=12')
    expect(await screen.findByText('Permainan: abc')).toBeDefined()
    expect(screen.getByText('Indeks ply: 12')).toBeDefined()
  })

  it('menandai ?move tidak valid', async () => {
    renderRute('/review/abc?move=-3')
    expect(await screen.findByText('Indeks ply: tidak valid atau kosong')).toBeDefined()
  })

  it('memuat tautan ke kode sumber', async () => {
    renderRute('/')
    expect(await screen.findByRole('link', { name: 'Kode sumber' })).toBeDefined()
  })
})
