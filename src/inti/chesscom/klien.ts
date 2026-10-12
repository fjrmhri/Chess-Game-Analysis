import { AntreanSerial, tidur as tidurBawaan, uraiRetryAfter } from './antrean'
import type { PenyimpananCache } from './cache'
import { adalahGalatChesscom, GalatChesscom, type JenisGalatChesscom } from './galat'
import {
  BATAS_RETRY_AFTER_MS,
  JEDA_DASAR_MS,
  MAKS_PERCOBAAN,
  TTL_CACHE_MS,
  URL_DASAR_PUBAPI,
} from './konfigurasiChesscom'
import {
  validasiResponsArsip,
  validasiResponsPermainan,
  type ResponsArsip,
  type ResponsPermainanBulanan,
} from './tipe'
import { normalisasiUsername } from './username'

export type SumberData = 'cache' | 'langsung' | 'proxy'

export interface CatatanPermintaan {
  url: string
  sumber: SumberData
  percobaan: number
  status: number | null
  mulai: number
  selesai: number
  /** null bila header tidak ada ATAU tidak diekspos browser (bukan header CORS-safelisted). */
  headerAcao: string | null
  galat?: JenisGalatChesscom
}

export interface OpsiKlien {
  cache: PenyimpananCache
  /** Bagikan antar klien agar seluruh aplikasi tetap serial. */
  antrean?: AntreanSerial
  ambil?: typeof fetch
  urlProxy?: string
  sekarang?: () => number
  tidur?: (ms: number, signal?: AbortSignal) => Promise<void>
  daring?: () => boolean
  padaCatat?: (catatan: CatatanPermintaan) => void
}

export interface OpsiPermintaan {
  signal?: AbortSignal
  /** Lewati cache (tombol "Muat ulang" manual); hasil tetap disimpan ke cache. */
  abaikanCache?: boolean
}

export interface IdArsipBulanan {
  username: string
  tahun: number
  bulan: number
}

export function urlDaftarArsip(username: string): string {
  return `${URL_DASAR_PUBAPI}/pub/player/${normalisasiUsername(username)}/games/archives`
}

export function urlArsipBulanan({ username, tahun, bulan }: IdArsipBulanan): string {
  const bulanDuaDigit = String(bulan).padStart(2, '0')
  return `${URL_DASAR_PUBAPI}/pub/player/${normalisasiUsername(username)}/games/${tahun}/${bulanDuaDigit}`
}

function pastikanUrlPubApi(url: string): string {
  if (!url.startsWith(`${URL_DASAR_PUBAPI}/pub/`)) {
    throw new GalatChesscom('ResponsTidakValid', undefined, `URL di luar PubAPI: ${url}`)
  }
  return url
}

function keUrlProxy(url: string, urlProxy: string): string {
  const u = new URL(url)
  return `${urlProxy.replace(/\/+$/, '')}${u.pathname}${u.search}`
}

function galatDibatalkan(): GalatChesscom {
  return new GalatChesscom('Dibatalkan')
}

export function buatKlienChesscom(opsi: OpsiKlien) {
  const antrean = opsi.antrean ?? new AntreanSerial()
  const ambil = opsi.ambil ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const sekarang = opsi.sekarang ?? Date.now
  const tidur = opsi.tidur ?? tidurBawaan
  const daring = opsi.daring ?? (() => navigator.onLine)
  const catat = opsi.padaCatat ?? (() => undefined)

  async function ambilDenganUlang(
    urlAsli: string,
    urlTarget: string,
    sumber: SumberData,
    signal?: AbortSignal,
  ): Promise<unknown> {
    for (let percobaan = 1; ; percobaan++) {
      if (signal?.aborted) throw galatDibatalkan()
      const mulai = sekarang()
      let respons: Response
      try {
        respons = await ambil(urlTarget, { signal })
      } catch {
        if (signal?.aborted) throw galatDibatalkan()
        const jenis: JenisGalatChesscom = daring() ? 'CorsGagal' : 'JaringanGagal'
        catat({
          url: urlAsli,
          sumber,
          percobaan,
          status: null,
          mulai,
          selesai: sekarang(),
          headerAcao: null,
          galat: jenis,
        })
        throw new GalatChesscom(jenis)
      }

      const dasarCatatan = {
        url: urlAsli,
        sumber,
        percobaan,
        status: respons.status,
        mulai,
        selesai: sekarang(),
        headerAcao: respons.headers.get('access-control-allow-origin'),
      }

      if (respons.ok) {
        try {
          const data: unknown = await respons.json()
          catat(dasarCatatan)
          return data
        } catch {
          catat({ ...dasarCatatan, galat: 'ResponsTidakValid' })
          throw new GalatChesscom('ResponsTidakValid', respons.status, 'JSON')
        }
      }

      // 404 = tidak ada data; 410 = data tidak akan pernah tersedia (dokumentasi PubAPI)
      if (respons.status === 404 || respons.status === 410) {
        catat({ ...dasarCatatan, galat: 'PemainTidakDitemukan' })
        throw new GalatChesscom('PemainTidakDitemukan', respons.status)
      }

      const bisaDiulang = respons.status === 429 || respons.status >= 500
      const jenis: JenisGalatChesscom =
        respons.status === 429
          ? 'TerbatasiLaju'
          : respons.status >= 500
            ? 'ServerGagal'
            : 'ResponsTidakValid'
      catat({ ...dasarCatatan, galat: jenis })
      if (!bisaDiulang || percobaan >= MAKS_PERCOBAAN) {
        throw new GalatChesscom(jenis, respons.status)
      }

      const jedaHeader = uraiRetryAfter(respons.headers.get('retry-after'), sekarang())
      const jeda = Math.min(
        BATAS_RETRY_AFTER_MS,
        jedaHeader ?? JEDA_DASAR_MS * 2 ** (percobaan - 1),
      )
      try {
        await tidur(jeda, signal)
      } catch {
        throw galatDibatalkan()
      }
    }
  }

  async function ambilJson(url: string, opsiPermintaan: OpsiPermintaan): Promise<unknown> {
    const { signal, abaikanCache = false } = opsiPermintaan
    return antrean.jalankan(async () => {
      if (signal?.aborted) throw galatDibatalkan()

      if (!abaikanCache) {
        const entri = await opsi.cache.baca(url).catch(() => undefined)
        if (entri && entri.kedaluwarsaPada > sekarang()) {
          const t = sekarang()
          catat({
            url,
            sumber: 'cache',
            percobaan: 0,
            status: null,
            mulai: t,
            selesai: t,
            headerAcao: null,
          })
          return entri.data
        }
      }

      let data: unknown
      try {
        data = await ambilDenganUlang(url, url, 'langsung', signal)
      } catch (e) {
        if (!opsi.urlProxy || !adalahGalatChesscom(e, 'CorsGagal')) throw e
        data = await ambilDenganUlang(url, keUrlProxy(url, opsi.urlProxy), 'proxy', signal)
      }

      const diambilPada = sekarang()
      await opsi.cache
        .tulis({ url, data, diambilPada, kedaluwarsaPada: diambilPada + TTL_CACHE_MS })
        .catch(() => undefined)
      return data
    })
  }

  return {
    async ambilDaftarArsip(username: string, o: OpsiPermintaan = {}): Promise<ResponsArsip> {
      return validasiResponsArsip(await ambilJson(urlDaftarArsip(username), o))
    },

    async ambilPermainanBulanan(
      arsip: string | IdArsipBulanan,
      o: OpsiPermintaan = {},
    ): Promise<ResponsPermainanBulanan> {
      const url = typeof arsip === 'string' ? pastikanUrlPubApi(arsip) : urlArsipBulanan(arsip)
      return validasiResponsPermainan(await ambilJson(url, o))
    },
  }
}

export type KlienChesscom = ReturnType<typeof buatKlienChesscom>
