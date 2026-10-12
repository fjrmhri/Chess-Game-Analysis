import { describe, expect, it } from 'vitest'
import { tidur, uraiRetryAfter } from './antrean'
import { CacheMemori } from './cache'
import arsipFixture from './fixture/arsip.json'
import permainanFixture from './fixture/permainan-2026-10.json'
import { adalahGalatChesscom, GalatChesscom } from './galat'
import { buatKlienChesscom, type CatatanPermintaan } from './klien'
import { TTL_CACHE_MS } from './konfigurasiChesscom'
import { normalisasiUsername } from './username'

const URL_ARSIP = 'https://api.chess.com/pub/player/fjrmhrii/games/archives'
const URL_OKT = 'https://api.chess.com/pub/player/fjrmhrii/games/2026/10'

type Jawaban =
  { status: number; body?: unknown; headers?: Record<string, string> } | 'galat-jaringan'

function json(status: number, body?: unknown, headers: Record<string, string> = {}): Jawaban {
  return { status, body, headers }
}

/** fetch palsu: jawaban per URL diambil berurutan; mencatat konkurensi maksimum. */
function buatLingkungan(
  jawaban: Record<string, Jawaban[]>,
  opsiTambahan: { urlProxy?: string; daring?: boolean } = {},
) {
  let waktu = 1_000_000
  let aktif = 0
  const log = {
    panggilan: [] as string[],
    konkurensiMaks: 0,
    jeda: [] as number[],
    catatan: [] as CatatanPermintaan[],
  }
  const cache = new CacheMemori()

  const ambil = async (masukan: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = masukan instanceof Request ? masukan.url : masukan.toString()
    log.panggilan.push(url)
    aktif++
    log.konkurensiMaks = Math.max(log.konkurensiMaks, aktif)
    try {
      await new Promise((r) => setTimeout(r, 1))
      if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const antre = jawaban[url]
      const j = antre?.shift()
      if (!j) throw new Error(`Tidak ada jawaban untuk ${url}`)
      if (j === 'galat-jaringan') throw new TypeError('Failed to fetch')
      return new Response(j.body === undefined ? null : JSON.stringify(j.body), {
        status: j.status,
        headers: { 'content-type': 'application/json', ...j.headers },
      })
    } finally {
      aktif--
    }
  }

  const klien = buatKlienChesscom({
    cache,
    ambil,
    urlProxy: opsiTambahan.urlProxy,
    sekarang: () => waktu,
    tidur: (ms, signal) => {
      log.jeda.push(ms)
      if (signal?.aborted) return Promise.reject(new Error('dibatalkan'))
      waktu += ms
      return Promise.resolve()
    },
    daring: () => opsiTambahan.daring ?? true,
    padaCatat: (c) => log.catatan.push(c),
  })

  return { klien, log, cache, majukanWaktu: (ms: number) => (waktu += ms) }
}

async function tangkap(p: Promise<unknown>): Promise<GalatChesscom> {
  try {
    await p
  } catch (e) {
    if (e instanceof GalatChesscom) return e
    throw e
  }
  throw new Error('Diharapkan gagal')
}

describe('normalisasiUsername', () => {
  it('mengecilkan huruf dan memangkas spasi', () => {
    expect(normalisasiUsername('  FjrMhrii ')).toBe('fjrmhrii')
  })

  it.each(['', 'ab', 'a b c', 'nama/../x', 'x'.repeat(26), 'ünï'])('menolak %j', (u) => {
    expect(() => normalisasiUsername(u)).toThrow(GalatChesscom)
  })
})

describe('tidur', () => {
  it('berhenti lebih awal saat dibatalkan', async () => {
    const pengendali = new AbortController()
    const mulai = Date.now()
    const janji = tidur(10_000, pengendali.signal)
    setTimeout(() => pengendali.abort(), 5)
    await expect(janji).rejects.toBeDefined()
    expect(Date.now() - mulai).toBeLessThan(1000)
  })
})

describe('uraiRetryAfter', () => {
  it('detik dan tanggal HTTP', () => {
    expect(uraiRetryAfter('3', 0)).toBe(3000)
    expect(uraiRetryAfter('Thu, 01 Jan 1970 00:00:05 GMT', 0)).toBe(5000)
    expect(uraiRetryAfter('Thu, 01 Jan 1970 00:00:05 GMT', 9000)).toBe(0)
    expect(uraiRetryAfter(null, 0)).toBeUndefined()
    expect(uraiRetryAfter('nanti', 0)).toBeUndefined()
  })
})

describe('klien chess.com', () => {
  it('mengambil daftar arsip dan permainan bulanan dari fixture nyata', async () => {
    const { klien } = buatLingkungan({
      [URL_ARSIP]: [json(200, arsipFixture)],
      [URL_OKT]: [json(200, permainanFixture)],
    })
    const arsip = await klien.ambilDaftarArsip('FJRMHRII')
    expect(arsip.archives).toHaveLength(3)
    const bulan = await klien.ambilPermainanBulanan({
      username: 'fjrmhrii',
      tahun: 2026,
      bulan: 10,
    })
    expect(bulan.games).toHaveLength(3)
    const pertama = bulan.games[0]
    expect(pertama?.pgn).toContain('[Event')
    expect(pertama?.accuracies?.white).toBeTypeOf('number')
    expect(pertama?.white.rating).toBeTypeOf('number')
    expect(pertama?.uuid).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('menjalankan permintaan secara serial', async () => {
    const urlAgu = 'https://api.chess.com/pub/player/fjrmhrii/games/2026/08'
    const urlSep = 'https://api.chess.com/pub/player/fjrmhrii/games/2026/09'
    const { klien, log } = buatLingkungan({
      [urlAgu]: [json(200, { games: [] })],
      [urlSep]: [json(200, { games: [] })],
      [URL_OKT]: [json(200, permainanFixture)],
    })
    await Promise.all([
      klien.ambilPermainanBulanan(urlAgu),
      klien.ambilPermainanBulanan(urlSep),
      klien.ambilPermainanBulanan(URL_OKT),
    ])
    expect(log.konkurensiMaks).toBe(1)
    expect(log.panggilan).toEqual([urlAgu, urlSep, URL_OKT])
  })

  it('mengulang 429 dengan backoff lalu berhasil', async () => {
    const { klien, log } = buatLingkungan({
      [URL_ARSIP]: [json(429), json(429), json(200, arsipFixture)],
    })
    const arsip = await klien.ambilDaftarArsip('fjrmhrii')
    expect(arsip.archives).toHaveLength(3)
    expect(log.panggilan).toHaveLength(3)
    expect(log.jeda).toEqual([1000, 2000])
  })

  it('memakai Retry-After bila ada', async () => {
    const { klien, log } = buatLingkungan({
      [URL_ARSIP]: [json(429, undefined, { 'retry-after': '7' }), json(200, arsipFixture)],
    })
    await klien.ambilDaftarArsip('fjrmhrii')
    expect(log.jeda).toEqual([7000])
  })

  it('berhenti setelah 3 percobaan 429 dengan TerbatasiLaju', async () => {
    const { klien, log } = buatLingkungan({
      [URL_ARSIP]: [json(429), json(429), json(429), json(200, arsipFixture)],
    })
    const g = await tangkap(klien.ambilDaftarArsip('fjrmhrii'))
    expect(g.jenis).toBe('TerbatasiLaju')
    expect(log.panggilan).toHaveLength(3)
  })

  it('mengulang 5xx lalu ServerGagal', async () => {
    const { klien, log } = buatLingkungan({ [URL_ARSIP]: [json(503), json(502), json(500)] })
    const g = await tangkap(klien.ambilDaftarArsip('fjrmhrii'))
    expect(g.jenis).toBe('ServerGagal')
    expect(log.panggilan).toHaveLength(3)
  })

  it('404 menjadi PemainTidakDitemukan tanpa retry', async () => {
    const url = 'https://api.chess.com/pub/player/tidakada123/games/archives'
    const { klien, log } = buatLingkungan({ [url]: [json(404, { message: 'not found' })] })
    const g = await tangkap(klien.ambilDaftarArsip('tidakada123'))
    expect(g.jenis).toBe('PemainTidakDitemukan')
    expect(g.status).toBe(404)
    expect(log.panggilan).toHaveLength(1)
  })

  it('410 juga PemainTidakDitemukan tanpa retry', async () => {
    const { klien, log } = buatLingkungan({ [URL_ARSIP]: [json(410)] })
    const g = await tangkap(klien.ambilDaftarArsip('fjrmhrii'))
    expect(g.jenis).toBe('PemainTidakDitemukan')
    expect(g.status).toBe(410)
    expect(log.panggilan).toHaveLength(1)
  })

  it('cache hit tanpa request; kedaluwarsa setelah 12 jam; abaikanCache memaksa request', async () => {
    const { klien, log, majukanWaktu } = buatLingkungan({
      [URL_ARSIP]: [json(200, arsipFixture), json(200, arsipFixture), json(200, arsipFixture)],
    })
    await klien.ambilDaftarArsip('fjrmhrii')
    await klien.ambilDaftarArsip('fjrmhrii')
    expect(log.panggilan).toHaveLength(1)
    expect(log.catatan.at(-1)?.sumber).toBe('cache')

    majukanWaktu(TTL_CACHE_MS - 1)
    await klien.ambilDaftarArsip('fjrmhrii')
    expect(log.panggilan).toHaveLength(1)

    majukanWaktu(2)
    await klien.ambilDaftarArsip('fjrmhrii')
    expect(log.panggilan).toHaveLength(2)

    await klien.ambilDaftarArsip('fjrmhrii', { abaikanCache: true })
    expect(log.panggilan).toHaveLength(3)
  })

  it('galat jaringan saat daring = CorsGagal; luring = JaringanGagal', async () => {
    const a = buatLingkungan({ [URL_ARSIP]: ['galat-jaringan'] })
    expect((await tangkap(a.klien.ambilDaftarArsip('fjrmhrii'))).jenis).toBe('CorsGagal')
    const b = buatLingkungan({ [URL_ARSIP]: ['galat-jaringan'] }, { daring: false })
    expect((await tangkap(b.klien.ambilDaftarArsip('fjrmhrii'))).jenis).toBe('JaringanGagal')
  })

  it('jatuh ke proxy bila request langsung gagal di jaringan', async () => {
    const urlProxy = 'https://proxy.contoh.dev/pub/player/fjrmhrii/games/archives'
    const { klien, log } = buatLingkungan(
      { [URL_ARSIP]: ['galat-jaringan'], [urlProxy]: [json(200, arsipFixture)] },
      { urlProxy: 'https://proxy.contoh.dev/' },
    )
    const arsip = await klien.ambilDaftarArsip('fjrmhrii')
    expect(arsip.archives).toHaveLength(3)
    expect(log.panggilan).toEqual([URL_ARSIP, urlProxy])
    expect(log.catatan.at(-1)?.sumber).toBe('proxy')
  })

  it('tidak memakai proxy untuk 404', async () => {
    const { klien, log } = buatLingkungan(
      { [URL_ARSIP]: [json(404)] },
      { urlProxy: 'https://proxy.contoh.dev' },
    )
    await tangkap(klien.ambilDaftarArsip('fjrmhrii'))
    expect(log.panggilan).toEqual([URL_ARSIP])
  })

  it('dibatalkan lewat AbortSignal sebelum dan saat request berjalan', async () => {
    const pengendali = new AbortController()
    pengendali.abort()
    const a = buatLingkungan({ [URL_ARSIP]: [json(200, arsipFixture)] })
    const g1 = await tangkap(a.klien.ambilDaftarArsip('fjrmhrii', { signal: pengendali.signal }))
    expect(adalahGalatChesscom(g1, 'Dibatalkan')).toBe(true)
    expect(a.log.panggilan).toHaveLength(0)

    const p2 = new AbortController()
    const b = buatLingkungan({ [URL_ARSIP]: [json(429), json(200, arsipFixture)] })
    const janji = b.klien.ambilDaftarArsip('fjrmhrii', { signal: p2.signal })
    setTimeout(() => p2.abort(), 0)
    const g2 = await tangkap(janji)
    expect(g2.jenis).toBe('Dibatalkan')
  })

  it('dibatalkan saat menunggu backoff 429', async () => {
    const pengendali = new AbortController()
    let panggilan = 0
    const klien = buatKlienChesscom({
      cache: new CacheMemori(),
      ambil: () => {
        panggilan++
        return Promise.resolve(new Response(null, { status: 429 }))
      },
      tidur: (_ms, signal) => {
        setTimeout(() => pengendali.abort(), 0)
        return tidur(10_000, signal)
      },
      daring: () => true,
    })
    const g = await tangkap(klien.ambilDaftarArsip('fjrmhrii', { signal: pengendali.signal }))
    expect(g.jenis).toBe('Dibatalkan')
    expect(panggilan).toBe(1)
  })

  it('menolak URL arsip di luar PubAPI dan respons berbentuk salah', async () => {
    const { klien } = buatLingkungan({ [URL_ARSIP]: [json(200, { arsip: [] })] })
    expect((await tangkap(klien.ambilPermainanBulanan('https://contoh.com/pub/x'))).jenis).toBe(
      'ResponsTidakValid',
    )
    expect((await tangkap(klien.ambilDaftarArsip('fjrmhrii'))).jenis).toBe('ResponsTidakValid')
  })
})
