import type { RouteObject } from 'react-router'
import {
  HalamanBeranda,
  HalamanKalibrasi,
  HalamanPemain,
  HalamanPengaturan,
  HalamanPocApi,
  HalamanPocEngine,
  HalamanReview,
  HalamanTidakDitemukan,
} from './halaman/halaman'
import { HalamanGaya } from './halaman/HalamanGaya'
import { TataLetak } from './halaman/TataLetak'

export const daftarRute: RouteObject[] = [
  {
    path: '/',
    Component: TataLetak,
    children: [
      { index: true, Component: HalamanBeranda },
      { path: 'pemain/:username', Component: HalamanPemain },
      { path: 'review/:idPermainan', Component: HalamanReview },
      { path: 'kalibrasi', Component: HalamanKalibrasi },
      { path: 'pengaturan', Component: HalamanPengaturan },
      { path: 'gaya', Component: HalamanGaya },
      { path: 'poc/api', Component: HalamanPocApi },
      { path: 'poc/engine', Component: HalamanPocEngine },
      { path: '*', Component: HalamanTidakDitemukan },
    ],
  },
]
