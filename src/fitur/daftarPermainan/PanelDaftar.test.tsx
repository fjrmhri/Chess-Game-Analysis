import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it } from 'vitest'
import type { Permainan } from '../../inti/data/tipe'
import { PanelDaftar } from './PanelDaftar'

afterEach(cleanup)

const game = (i: number, ubah: Partial<Permainan> = {}): Permainan => ({
  id: `g${i}`,
  url: `u${i}`,
  username: 'saya',
  warnaSaya: 'putih',
  lawan: `lawan${String(i).padStart(2, '0')}`,
  namaPutih: 'saya',
  namaHitam: `lawan${i}`,
  ratingPutih: 500,
  ratingHitam: 600 + i,
  hasilPutih: i % 2 ? 'win' : 'checkmated',
  hasilHitam: i % 2 ? 'resigned' : 'win',
  hasilSaya: i % 2 ? 'menang' : 'kalah',
  timeClass: 'rapid',
  timeControl: '600',
  rated: true,
  rules: 'chess',
  didukung: true,
  endTime: Date.UTC(2026, 9, 1) / 1000 + i * 3600,
  jumlahLangkah: 20 + i,
  jumlahPly: 40 + 2 * i,
  pgn: '',
  ...ubah,
})

function pasang(daftar: Permainan[], url = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <PanelDaftar
            permainan={daftar}
            sudahDianalisis={new Set(['g3'])}
            bulanArsip={['2026-10', '2026-09']}
          />
        ),
      },
      { path: '/review/:id', element: <p>halaman review</p> },
    ],
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const tabel = () => within(screen.getByRole('region', { name: 'Daftar game' }))
const barisData = () => tabel().getAllByRole('row').slice(1)

describe('PanelDaftar', () => {
  const daftar = Array.from({ length: 25 }, (_, i) => game(i + 1))

  it('20 per halaman, terbaru dulu, paginasi tercermin di URL', () => {
    const router = pasang(daftar)
    expect(barisData()).toHaveLength(20)
    expect(barisData()[0]?.textContent).toContain('lawan25')
    expect(screen.getByText(/25 game · halaman 1 dari 2/)).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
    expect(router.state.location.search).toBe('?hal=2')
    expect(barisData()).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Berikutnya' }).hasAttribute('disabled')).toBe(true)
  })

  it('filter hasil dan cari lawan memperbarui URL dan mengembalikan ke halaman 1', () => {
    const router = pasang(daftar, '/?hal=2')
    fireEvent.change(screen.getByLabelText('Hasil'), { target: { value: 'kalah' } })
    expect(router.state.location.search).toBe('?hasil=kalah')
    expect(barisData()).toHaveLength(12)
    expect(barisData().every((b) => b.textContent?.includes('Kalah'))).toBe(true)

    fireEvent.change(screen.getByLabelText('Cari lawan'), { target: { value: 'lawan0' } })
    expect(router.state.location.search).toBe('?hasil=kalah&lawan=lawan0')
    expect(barisData().map((b) => b.textContent?.match(/lawan\d+/)?.[0])).toEqual([
      'lawan08',
      'lawan06',
      'lawan04',
      'lawan02',
    ])
  })

  it('URL dengan filter dimuat langsung (dapat dibagikan) dan reset menghapusnya', () => {
    const router = pasang(daftar, '/?warna=hitam')
    expect(screen.getByRole('heading', { name: 'Tidak ada game' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Reset filter' }))
    expect(router.state.location.search).toBe('')
    expect(barisData()).toHaveLength(20)
  })

  it('status analisis, akurasi chess.com, dan Review nonaktif untuk rules lain', () => {
    pasang([
      game(3, { akurasiChessCom: { putih: 81.25, hitam: 70 } }),
      game(4, {
        didukung: false,
        rules: 'chess960',
        alasanTidakDidukung: 'Aturan "chess960" belum didukung.',
      }),
    ])
    const [g4, g3] = barisData()
    expect(g3?.textContent).toContain('Sudah')
    expect(g3?.textContent).toContain('81.3 / 70.0')
    expect(
      within(g3 as HTMLElement)
        .getByRole('link', { name: 'Review' })
        .getAttribute('href'),
    ).toBe('/review/g3')
    const tombol = within(g4 as HTMLElement).getByRole('button', { name: 'Review' })
    expect(tombol.hasAttribute('disabled')).toBe(true)
    expect(g4?.textContent).toContain('chess960')
  })
})
