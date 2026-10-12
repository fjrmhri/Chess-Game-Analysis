import { bukaBasisData, CacheDexie } from '../data/basisData'
import { AntreanSerial } from './antrean'
import { buatKlienChesscom, type KlienChesscom, type OpsiKlien } from './klien'

const antreanBersama = new AntreanSerial()
let cacheBersama: CacheDexie | undefined
let klienBersama: KlienChesscom | undefined

function opsiBawaan(): OpsiKlien {
  cacheBersama ??= new CacheDexie(bukaBasisData())
  const urlProxy = import.meta.env.VITE_URL_PROXY?.trim()
  return { cache: cacheBersama, antrean: antreanBersama, urlProxy: urlProxy || undefined }
}

/** Semua klien memakai antrean dan cache yang sama sehingga request ke PubAPI tetap serial. */
export function ambilKlienChesscom(padaCatat?: OpsiKlien['padaCatat']): KlienChesscom {
  if (padaCatat) return buatKlienChesscom({ ...opsiBawaan(), padaCatat })
  klienBersama ??= buatKlienChesscom(opsiBawaan())
  return klienBersama
}
