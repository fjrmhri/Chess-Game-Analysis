// @vitest-environment node
// Tes integrasi dengan engine asli (stockfish lite-single di Node). Berkas JS karena memakai API Node.
// Satu proses anak per engine: modul Node stockfish berbagi state sehingga tidak bisa dibuat dua kali per proses.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createInterface } from 'node:readline'
import { afterAll, describe, expect, it } from 'vitest'
import { KolamMesin } from './kolamMesin'
import { MesinCatur } from './mesinCatur'

const require = createRequire(import.meta.url)
const jalurEngine = require('stockfish').findEngine('lite-single')

function buatSaluranNode() {
  let pendengar = () => undefined
  let pendengarGalat = () => undefined
  const anak = spawn(process.execPath, [jalurEngine], { stdio: ['pipe', 'pipe', 'inherit'] })
  createInterface({ input: anak.stdout }).on('line', (b) => b && pendengar(b))
  anak.on('error', (e) => pendengarGalat(e))
  return {
    kirim: (perintah) => anak.stdin.write(`${perintah}\n`),
    padaBaris: (p) => {
      pendengar = p
    },
    padaGalat: (p) => {
      pendengarGalat = p
    },
    tutup: () => anak.kill(),
  }
}

const FEN_ITALIA = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
const FEN_MAT_1 = '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1'

describe('MesinCatur dengan stockfish asli', () => {
  const mesin = new MesinCatur(buatSaluranNode())
  afterAll(() => mesin.tutup())

  it('mulai, cari MultiPV 2, dan menemukan mat dalam 1', async () => {
    await mesin.mulai()
    const h = await mesin.cari({ fen: FEN_ITALIA, nodes: 20000, multiPv: 2, ucinewgame: true })
    expect(h.garis).toHaveLength(2)
    expect(h.garis[0].pv[0]).toBe(h.langkahTerbaik)
    expect(h.nodes).toBeGreaterThanOrEqual(20000)
    expect(h.garis[0].skor.jenis).toBe('cp')

    const mat = await mesin.cari({ fen: FEN_MAT_1, nodes: 20000, multiPv: 1, ucinewgame: true })
    expect(mat.langkahTerbaik).toBe('d1d8')
    expect(mat.garis[0].skor).toEqual({ jenis: 'mat', nilai: 1 })
  }, 30_000)

  it('deterministik: ucinewgame + go nodes memberi hasil sama', async () => {
    const a = await mesin.cari({ fen: FEN_ITALIA, nodes: 30000, multiPv: 2, ucinewgame: true })
    const b = await mesin.cari({ fen: FEN_ITALIA, nodes: 30000, multiPv: 2, ucinewgame: true })
    expect(b.garis).toEqual(a.garis)
    expect(b.langkahTerbaik).toBe(a.langkahTerbaik)
  }, 30_000)
})

describe('KolamMesin dengan 2 engine asli', () => {
  it('4 posisi selesai dan hasil cocok dengan permintaan', async () => {
    const kolam = new KolamMesin({ jumlah: 2, pabrikSaluran: buatSaluranNode })
    await kolam.mulai()
    const daftarFen = [FEN_ITALIA, FEN_MAT_1, FEN_ITALIA.replace(' w ', ' w '), FEN_MAT_1]
    const hasil = await Promise.all(
      daftarFen.map((fen) => kolam.cari({ fen, nodes: 10000, multiPv: 1, ucinewgame: true })),
    )
    expect(hasil.map((h) => h.fen)).toEqual(daftarFen)
    expect(hasil[1].langkahTerbaik).toBe('d1d8')
    expect(hasil[3].langkahTerbaik).toBe('d1d8')
    kolam.tutup()
  }, 30_000)
})
