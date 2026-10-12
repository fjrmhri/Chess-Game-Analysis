import { describe, expect, it } from 'vitest'
import { KolamMesin } from './kolamMesin'
import { GalatEngine, MesinCatur } from './mesinCatur'
import { SaluranPalsu } from './saluranPalsu'

const FEN_AWAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const FEN_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

async function mesinSiap(perilaku = {}, opsi = {}) {
  const saluran = new SaluranPalsu(perilaku)
  const mesin = new MesinCatur(saluran, { batasWaktuCariMs: () => 50, tenggangStopMs: 30, ...opsi })
  await mesin.mulai()
  return { saluran, mesin }
}

async function tangkap(p: Promise<unknown>): Promise<GalatEngine> {
  try {
    await p
  } catch (e) {
    if (e instanceof GalatEngine) return e
    throw e
  }
  throw new Error('Diharapkan gagal')
}

describe('MesinCatur', () => {
  it('mulai: uci, Threads=1, Hash, isready', async () => {
    const { saluran } = await mesinSiap({}, { hashMb: 32 })
    expect(saluran.terkirim).toEqual([
      'uci',
      'setoption name Threads value 1',
      'setoption name Hash value 32',
      'setoption name MultiPV value 1',
      'isready',
    ])
  })

  it('cari memakai go nodes dan mengembalikan garis MultiPV', async () => {
    const { saluran, mesin } = await mesinSiap()
    const h = await mesin.cari({ fen: FEN_AWAL, nodes: 100000, multiPv: 2 })
    expect(saluran.terkirim.slice(-4)).toEqual([
      'setoption name MultiPV value 2',
      'isready',
      `position fen ${FEN_AWAL}`,
      'go nodes 100000',
    ])
    expect(h.garis.map((g) => g.multiPv)).toEqual([1, 2])
    expect(h.langkahTerbaik).toBe('e2e4')
    expect(h.ponder).toBe('e7e5')
    expect(h.nodes).toBe(100000)
    expect(h.versiEngine).toContain('stockfish.js')
  })

  it('MultiPV hanya dikirim saat berubah; ucinewgame diikuti isready', async () => {
    const { saluran, mesin } = await mesinSiap()
    await mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 1 })
    const sebelum = saluran.terkirim.length
    await mesin.cari({ fen: FEN_E4, nodes: 10, multiPv: 1, ucinewgame: true })
    expect(saluran.terkirim.slice(sebelum)).toEqual([
      'ucinewgame',
      'isready',
      `position fen ${FEN_E4}`,
      'go nodes 10',
    ])
  })

  it('pencarian berurutan pada satu mesin (tidak pernah dua go bersamaan)', async () => {
    const { saluran, mesin } = await mesinSiap({ jedaCari: () => 5 })
    const hasil = await Promise.all([
      mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 1 }),
      mesin.cari({ fen: FEN_E4, nodes: 10, multiPv: 1 }),
    ])
    expect(saluran.aktifMaks).toBe(1)
    expect(hasil.map((h) => h.garis[0]?.pv[1])).toEqual([
      SaluranPalsu.penanda(FEN_AWAL),
      SaluranPalsu.penanda(FEN_E4),
    ])
  })

  it('menolak FEN berisi baris baru/perintah dan parameter tidak valid', async () => {
    const { saluran, mesin } = await mesinSiap()
    const n = saluran.terkirim.length
    expect(
      (await tangkap(mesin.cari({ fen: `${FEN_AWAL}\nquit`, nodes: 10, multiPv: 1 }))).jenis,
    ).toBe('MasukanTidakValid')
    expect((await tangkap(mesin.cari({ fen: FEN_AWAL, nodes: 0, multiPv: 1 }))).jenis).toBe(
      'MasukanTidakValid',
    )
    expect((await tangkap(mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 0 }))).jenis).toBe(
      'MasukanTidakValid',
    )
    expect(saluran.terkirim.length).toBe(n)
  })

  it('timeout: kirim stop, tolak dengan Timeout, mesin tetap bisa dipakai', async () => {
    const saluran = new SaluranPalsu({ jedaCari: (fen) => (fen === FEN_AWAL ? 10_000 : 1) })
    const mesin = new MesinCatur(saluran, { batasWaktuCariMs: () => 20, tenggangStopMs: 50 })
    await mesin.mulai()
    expect((await tangkap(mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 1 }))).jenis).toBe(
      'Timeout',
    )
    expect(saluran.terkirim).toContain('stop')
    const h = await mesin.cari({ fen: FEN_E4, nodes: 10, multiPv: 1 })
    expect(h.garis[0]?.pv[1]).toBe(SaluranPalsu.penanda(FEN_E4))
  })

  it('engine macet setelah stop: mesin ditandai rusak', async () => {
    const { mesin } = await mesinSiap({ abaikanGo: true, abaikanStop: true })
    expect((await tangkap(mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 1 }))).jenis).toBe(
      'Timeout',
    )
    expect(mesin.rusakAtauTertutup).toBe(true)
    expect((await tangkap(mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 1 }))).jenis).toBe(
      'Rusak',
    )
  })

  it('AbortSignal dan hentikan() menolak dengan Dibatalkan', async () => {
    const { saluran, mesin } = await mesinSiap(
      { jedaCari: () => 10_000 },
      { batasWaktuCariMs: () => 60_000 },
    )
    const p = new AbortController()
    const janji = mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 1 }, p.signal)
    setTimeout(() => p.abort(), 5)
    expect((await tangkap(janji)).jenis).toBe('Dibatalkan')
    expect(saluran.terkirim.at(-1)).toBe('stop')

    const janji2 = mesin.cari({ fen: FEN_E4, nodes: 10, multiPv: 1 })
    setTimeout(() => mesin.hentikan(), 5)
    expect((await tangkap(janji2)).jenis).toBe('Dibatalkan')
  })

  it('tutup menolak pencarian berjalan dan berikutnya', async () => {
    const { saluran, mesin } = await mesinSiap(
      { jedaCari: () => 10_000 },
      { batasWaktuCariMs: () => 60_000 },
    )
    const janji = mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 1 })
    setTimeout(() => mesin.tutup(), 5)
    expect((await tangkap(janji)).jenis).toBe('Tertutup')
    expect(saluran.ditutup).toBe(true)
    expect((await tangkap(mesin.cari({ fen: FEN_AWAL, nodes: 10, multiPv: 1 }))).jenis).toBe(
      'Tertutup',
    )
  })
})

describe('KolamMesin', () => {
  function fenKe(i: number): string {
    return `8/8/8/8/8/8/8/${i}k${7 - i} w - - 0 1`.replace('/0k', '/k').replace('k0 ', 'k ')
  }

  it('memetakan setiap hasil ke permintaannya walau selesai tidak berurutan', async () => {
    const saluran: SaluranPalsu[] = []
    const kolam = new KolamMesin({
      jumlah: 3,
      pabrikSaluran: () => {
        const s = new SaluranPalsu({ jedaCari: (fen) => (fen.length * 7) % 13 })
        saluran.push(s)
        return s
      },
      opsiMesin: { batasWaktuCariMs: () => 5_000 },
    })
    await kolam.mulai()
    const daftarFen = Array.from({ length: 8 }, (_, i) => fenKe(i))
    const hasil = await Promise.all(
      daftarFen.map((fen) => kolam.cari({ fen, nodes: 10, multiPv: 1 })),
    )
    expect(hasil.map((h) => h.fen)).toEqual(daftarFen)
    expect(hasil.map((h) => h.garis[0]?.pv[1])).toEqual(
      daftarFen.map((f) => SaluranPalsu.penanda(f)),
    )
    expect(new Set(hasil.map((h) => h.idTugas)).size).toBe(8)
    expect(saluran).toHaveLength(3)
    expect(saluran.every((s) => s.aktifMaks <= 1)).toBe(true)
    expect(saluran.filter((s) => s.terkirim.some((p) => p.startsWith('go'))).length).toBe(3)
    kolam.tutup()
  })

  it('membatalkan tugas yang masih antre tanpa mengirim ke engine', async () => {
    const kolam = new KolamMesin({
      jumlah: 1,
      pabrikSaluran: () => new SaluranPalsu({ jedaCari: () => 20 }),
      opsiMesin: { batasWaktuCariMs: () => 5_000 },
    })
    await kolam.mulai()
    const p = new AbortController()
    const pertama = kolam.cari({ fen: fenKe(1), nodes: 10, multiPv: 1 })
    const kedua = kolam.cari({ fen: fenKe(2), nodes: 10, multiPv: 1 }, p.signal)
    expect(kolam.statistik).toEqual({ sibuk: 1, antre: 1 })
    p.abort()
    expect((await tangkap(kedua)).jenis).toBe('Dibatalkan')
    expect((await pertama).fen).toBe(fenKe(1))
    kolam.tutup()
  })

  it('mengganti mesin yang rusak lalu melanjutkan antrean', async () => {
    let dibuat = 0
    const kolam = new KolamMesin({
      jumlah: 1,
      pabrikSaluran: () => {
        dibuat++
        return new SaluranPalsu(dibuat === 1 ? { abaikanGo: true, abaikanStop: true } : {})
      },
      opsiMesin: { batasWaktuCariMs: () => 10, tenggangStopMs: 10 },
    })
    await kolam.mulai()
    const gagal = kolam.cari({ fen: fenKe(1), nodes: 10, multiPv: 1 })
    const berhasil = kolam.cari({ fen: fenKe(2), nodes: 10, multiPv: 1 })
    expect((await tangkap(gagal)).jenis).toBe('Timeout')
    expect((await berhasil).fen).toBe(fenKe(2))
    expect(dibuat).toBe(2)
    kolam.tutup()
  })

  it('tutup menolak tugas yang antre', async () => {
    const kolam = new KolamMesin({
      jumlah: 1,
      pabrikSaluran: () => new SaluranPalsu({ jedaCari: () => 50 }),
      opsiMesin: { batasWaktuCariMs: () => 5_000 },
    })
    await kolam.mulai()
    void kolam.cari({ fen: fenKe(1), nodes: 10, multiPv: 1 }).catch(() => undefined)
    const antre = kolam.cari({ fen: fenKe(2), nodes: 10, multiPv: 1 })
    kolam.tutup()
    expect((await tangkap(antre)).jenis).toBe('Tertutup')
  })
})
