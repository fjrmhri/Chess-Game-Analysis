// @vitest-environment node
// Kriteria P6: satu game nyata dianalisis engine asli, evaluasi tersimpan, analisis kedua < 1 detik dari cache.
import { IDBKeyRange, indexedDB } from 'fake-indexeddb'
import { afterAll, describe, expect, it } from 'vitest'
import { normalisasiPermainan } from '../chesscom/normalisasiPermainan'
import { bukaBasisData } from '../data/basisData'
import { ambilPosisiPermainan, cacheEvaluasiDexie, simpanPermainan } from '../data/penyimpanan'
import permainanNyata from '../pgn/fixture/permainan-nyata.json'
import { uraiPgn } from '../pgn/uraiPgn'
import { gabungKonfigurasi, konfigurasiBawaan } from './konfigurasiAnalisis'
import { VERSI_ENGINE } from './konfigurasiEngine'
import { KolamMesin } from './kolamMesin'
import { KONFIGURASI_PENILAIAN } from '../penilaian/konfigurasiPenilaian'
import { kelasPenilaianPermainan } from '../penilaian/penilaianPermainan'
import { mulaiPipeline } from './pipelineAnalisis'
import { buatSaluranNode } from './saluranNode.uji.js'

// KEPUTUSAN P6-K3: 20.000 node di tes otomatis; 100.000 diuji di halaman PoC
const konfigurasi = gabungKonfigurasi(konfigurasiBawaan(4, false), {
  tahapA: { nodes: 20000 },
  jumlahWorker: 2,
})

describe('pipeline dengan engine asli dan Dexie', () => {
  const db = bukaBasisData(`uji-pipeline-${Date.now()}`, { indexedDB, IDBKeyRange })
  const kolam = new KolamMesin({ jumlah: 2, pabrikSaluran: buatSaluranNode })
  afterAll(async () => {
    kolam.tutup()
    await db.delete()
  })

  it('analisis game nyata tersimpan; analisis kedua dari cache < 1 detik tanpa engine', async () => {
    const fixture = permainanNyata.find((f) => f.nama === 'mat-saya-kalah')
    const permainan = normalisasiPermainan(fixture.game, fixture.username)
    await simpanPermainan(db, permainan, uraiPgn(permainan.pgn).posisi)
    const posisi = await ambilPosisiPermainan(db, permainan.id)
    await kolam.mulai()

    let panggilanEngine = 0
    const penyedia = {
      cari: (p, s) => {
        panggilanEngine++
        return kolam.cari(p, s)
      },
    }
    const cache = cacheEvaluasiDexie(db)
    const opsi = { posisi, penyedia, cache, konfigurasi, versiEngine: VERSI_ENGINE }

    const pertama = await mulaiPipeline(opsi).hasil
    const nonTerminal = posisi.filter((p) => !p.isTerminal).length
    expect(pertama).toHaveLength(posisi.length)
    expect(panggilanEngine).toBe(nonTerminal)
    expect(pertama.at(-1)).toMatchObject({
      sumber: 'sintetis',
      garis: [{ skor: { jenis: 'mat', nilai: 0 } }],
    })
    expect(await db.evaluasi.count()).toBeGreaterThan(0)
    expect(await db.evaluasi.count()).toBeLessThanOrEqual(nonTerminal)

    panggilanEngine = 0
    const mulai = performance.now()
    const kedua = await mulaiPipeline(opsi).hasil
    const durasi = performance.now() - mulai
    expect(panggilanEngine).toBe(0)
    expect(durasi).toBeLessThan(1000)
    expect(kedua.map((h) => h.garis)).toEqual(pertama.map((h) => h.garis))
    console.log(`P6: ${posisi.length} posisi; run kedua ${durasi.toFixed(0)} ms dari cache`)

    // P7 end-to-end: PGN -> engine -> label + akurasi, lalu klasifikasi ulang tanpa engine
    const penilaian = kelasPenilaianPermainan(
      kedua,
      posisi,
      permainan.ratingPutih,
      permainan.ratingHitam,
      KONFIGURASI_PENILAIAN,
    )
    expect(penilaian.label).toHaveLength(posisi.length - 1)
    expect(penilaian.akurasi.putih).toBeGreaterThan(0)
    expect(penilaian.akurasi.hitam).toBeGreaterThan(0)
    expect(penilaian.kurvaEvaluasi.at(-1)).toBe(permainan.hasilPutih === 'win' ? 1 : 0)
    console.log(
      `P7: label ${JSON.stringify(penilaian.ringkasan)}; akurasi ${penilaian.akurasi.putih?.toFixed(1)}/${penilaian.akurasi.hitam?.toFixed(1)}`,
    )
  }, 60_000)
})
