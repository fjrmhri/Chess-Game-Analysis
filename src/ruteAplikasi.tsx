import type { RouteObject } from 'react-router'
import {
  HalamanBeranda,
  HalamanKalibrasi,
  HalamanPemain,
  HalamanPengaturan,
  HalamanPocEngine,
  HalamanReview,
  HalamanMemuat,
  HalamanTidakDitemukan,
} from './halaman/halaman'
import { TataLetak } from './halaman/TataLetak'

export const daftarRute: RouteObject[] = [
  {
    path: '/',
    Component: TataLetak,
    HydrateFallback: HalamanMemuat,
    children: [
      { index: true, Component: HalamanBeranda },
      { path: 'pemain/:username', Component: HalamanPemain },
      { path: 'review/:idPermainan', Component: HalamanReview },
      { path: 'kalibrasi', Component: HalamanKalibrasi },
      { path: 'pengaturan', Component: HalamanPengaturan },
      {
        path: 'gaya',
        lazy: async () => ({ Component: (await import('./halaman/HalamanGaya')).HalamanGaya }),
      },
      {
        path: 'poc/api',
        lazy: async () => ({ Component: (await import('./halaman/HalamanPocApi')).HalamanPocApi }),
      },
      { path: 'poc/engine', Component: HalamanPocEngine },
      { path: '*', Component: HalamanTidakDitemukan },
    ],
  },
]
