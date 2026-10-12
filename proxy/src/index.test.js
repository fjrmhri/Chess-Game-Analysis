import { afterEach, describe, expect, it, vi } from 'vitest'
import pekerja from './index.js'

const env = {
  ORIGIN_DIIZINKAN: 'http://localhost:5173, https://telaah.pages.dev',
  USER_AGENT: 'Telaah-uji',
}

function permintaan(path, { origin = 'http://localhost:5173', method = 'GET' } = {}) {
  const headers = origin ? { Origin: origin } : {}
  return new Request(`https://proxy.contoh.dev${path}`, { method, headers })
}

afterEach(() => vi.unstubAllGlobals())

describe('proxy PubAPI', () => {
  it('meneruskan GET /pub/* dengan User-Agent dan header CORS', async () => {
    const ambil = vi.fn(() =>
      Promise.resolve(
        new Response('{"archives":[]}', {
          status: 200,
          headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' },
        }),
      ),
    )
    vi.stubGlobal('fetch', ambil)
    const res = await pekerja.fetch(permintaan('/pub/player/fjrmhrii/games/archives'), env)
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    expect(res.headers.get('cache-control')).toBe('public, max-age=60')
    const [url, init] = ambil.mock.calls[0]
    expect(url).toBe('https://api.chess.com/pub/player/fjrmhrii/games/archives')
    expect(init.headers['User-Agent']).toBe('Telaah-uji')
  })

  it('menolak origin lain dan permintaan tanpa Origin', async () => {
    vi.stubGlobal('fetch', vi.fn())
    expect(
      (await pekerja.fetch(permintaan('/pub/x', { origin: 'https://jahat.dev' }), env)).status,
    ).toBe(403)
    expect((await pekerja.fetch(permintaan('/pub/x', { origin: null }), env)).status).toBe(403)
  })

  it('preflight OPTIONS, metode lain 405, path di luar /pub 404', async () => {
    const ambil = vi.fn()
    vi.stubGlobal('fetch', ambil)
    expect((await pekerja.fetch(permintaan('/pub/x', { method: 'OPTIONS' }), env)).status).toBe(204)
    expect((await pekerja.fetch(permintaan('/pub/x', { method: 'POST' }), env)).status).toBe(405)
    expect((await pekerja.fetch(permintaan('/admin'), env)).status).toBe(404)
    expect(ambil).not.toHaveBeenCalled()
  })

  it('meneruskan status 429 dan Retry-After', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(null, { status: 429, headers: { 'retry-after': '5' } })),
      ),
    )
    const res = await pekerja.fetch(permintaan('/pub/player/x/games/archives'), env)
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('5')
    expect(res.headers.get('access-control-expose-headers')).toBe('Retry-After')
  })
})
