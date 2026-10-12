import type { RouteObject } from 'react-router'
import {
  HalamanKalibrasi,
  HalamanPengaturan,
  HalamanReview,
  HalamanMemuat,
  HalamanTidakDitemukan,
} from './halaman/halaman'
import { HalamanMasuk } from './halaman/HalamanMasuk'
import { TataLetak } from './halaman/TataLetak'

export const daftarRute: RouteObject[] = [
  {
    path: '/',
    Component: TataLetak,
    HydrateFallback: HalamanMemuat,
    children: [
      { index: true, Component: HalamanMasuk },
      {
        path: 'pemain/:username',
        lazy: async () => ({
          Component: (await import('./halaman/HalamanDaftarPermainan')).HalamanDaftarPermainan,
        }),
      },
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
      {
        path: 'poc/engine',
        lazy: async () => ({
          Component: (await import('./halaman/HalamanPocEngine')).HalamanPocEngine,
        }),
      },
      { path: '*', Component: HalamanTidakDitemukan },
    ],
  },
]
