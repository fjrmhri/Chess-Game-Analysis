// Proxy GET /pub/* ke PubAPI chess.com hanya untuk origin yang diizinkan. Cadangan bila CORS langsung gagal.
const ASAL_HULU = 'https://api.chess.com'
const HEADER_DITERUSKAN = [
  'content-type',
  'cache-control',
  'etag',
  'last-modified',
  'expires',
  'retry-after',
]

function originDiizinkan(env) {
  return String(env.ORIGIN_DIIZINKAN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function headerCors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Expose-Headers': 'Retry-After',
    Vary: 'Origin',
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const diizinkan = origin !== null && originDiizinkan(env).includes(origin)

    if (!diizinkan) {
      return new Response('Origin tidak diizinkan', { status: 403, headers: { Vary: 'Origin' } })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...headerCors(origin),
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    if (request.method !== 'GET') {
      return new Response('Metode tidak didukung', {
        status: 405,
        headers: { ...headerCors(origin), Allow: 'GET, OPTIONS' },
      })
    }

    if (!url.pathname.startsWith('/pub/')) {
      return new Response('Hanya /pub/*', { status: 404, headers: headerCors(origin) })
    }

    const hulu = await fetch(`${ASAL_HULU}${url.pathname}${url.search}`, {
      headers: {
        'User-Agent': String(env.USER_AGENT ?? 'Telaah-proxy'),
        Accept: 'application/json',
      },
    })

    const headers = new Headers(headerCors(origin))
    for (const nama of HEADER_DITERUSKAN) {
      const nilai = hulu.headers.get(nama)
      if (nilai !== null) headers.set(nama, nilai)
    }
    return new Response(hulu.body, { status: hulu.status, headers })
  },
}
