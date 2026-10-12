import { Dexie } from 'dexie'
import { IDBKeyRange, indexedDB } from 'fake-indexeddb'
import { afterEach, describe, expect, it } from 'vitest'
import { normalisasiPermainan } from '../chesscom/normalisasiPermainan'
import type { PermainanPubApi } from '../chesscom/tipe'
import type { HasilCari } from '../engine/mesinCatur'
import permainanNyata from '../pgn/fixture/permainan-nyata.json'
import { uraiPgn } from '../pgn/uraiPgn'
import { bukaBasisData, type BasisDataTelaah } from './basisData'
import { eksporBasisData, GalatImpor, imporBasisData } from './eksporImpor'
import {
  ambilEvaluasi,
  ambilHasilAnalisis,
  ambilPermainanPemain,
  ambilPosisiPermainan,
  garisDariTersimpan,
  garisKeTersimpan,
  simpanEvaluasi,
  simpanHasilAnalisis,
  simpanPermainan,
} from './penyimpanan'
import type { Permainan } from './tipe'

const opsiDexie = { indexedDB, IDBKeyRange }
let nomor = 0
const terbuka: Dexie[] = []

function dbBaru(): BasisDataTelaah {
  const db = bukaBasisData(`uji-${Date.now()}-${nomor++}`, opsiDexie)
  terbuka.push(db)
  return db
}

afterEach(async () => {
  for (const db of terbuka.splice(0)) await db.delete()
})

const milikSaya = permainanNyata.filter((f) => f.username === 'fjrmhrii')
const daftarPermainan = (): Permainan[] =>
  milikSaya.map((f) => normalisasiPermainan(f.game as PermainanPubApi, f.username))

function hasilCari(fen: string, nodes: number, multiPv: number, versi = 'v1'): HasilCari {
  return {
    fen,
    nodesDiminta: nodes,
    multiPv,
    garis: [
      { multiPv: 1, skor: { jenis: 'cp', nilai: 35 }, pv: ['e2e4', 'e7e5'], kedalaman: 12, nodes },
      {
        multiPv: 2,
        skor: { jenis: 'mat', nilai: -3 },
        batas: 'bawah',
        pv: ['d2d4'],
        kedalaman: 11,
      },
    ].slice(0, multiPv) as HasilCari['garis'],
    langkahTerbaik: 'e2e4',
    waktuMs: 10,
    versiEngine: versi,
  }
}

const FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('skema Dexie', () => {
  it('migrasi v1 -> v2 mempertahankan cache', async () => {
    const nama = `uji-migrasi-${nomor++}`
    const lama = new Dexie(nama, opsiDexie)
    lama.version(1).stores({ cacheApi: 'url, kedaluwarsaPada' })
    await lama.table('cacheApi').put({ url: 'u', data: 1, diambilPada: 0, kedaluwarsaPada: 9 })
    lama.close()

    const db = bukaBasisData(nama, opsiDexie)
    terbuka.push(db)
    await db.open()
    expect(db.verno).toBe(2)
    expect(await db.cacheApi.get('u')).toMatchObject({ data: 1 })
    expect(await db.permainan.count()).toBe(0)
  })
})

describe('permainan dan posisi', () => {
  it('menyimpan permainan beserta posisi per ply', async () => {
    const db = dbBaru()
    const f = milikSaya[0]
    if (!f) throw new Error('fixture')
    const p = normalisasiPermainan(f.game, f.username)
    const urai = uraiPgn(p.pgn)
    await simpanPermainan(db, p, urai.posisi)
    expect(await db.permainan.get(p.id)).toEqual(p)
    const posisi = await ambilPosisiPermainan(db, p.id)
    expect(posisi.map((x) => x.ply)).toEqual(urai.posisi.map((x) => x.ply))
    expect(posisi.every((x) => x.idPermainan === p.id && x.isBook === false)).toBe(true)

    await simpanPermainan(db, p, urai.posisi.slice(0, 3))
    expect(await ambilPosisiPermainan(db, p.id)).toHaveLength(3)
  })

  it('ambilPermainanPemain: terbaru dulu, filter, dan paginasi', async () => {
    const db = dbBaru()
    const semua = daftarPermainan()
    for (const p of semua) await simpanPermainan(db, p)

    const terurut = [...semua].sort((a, b) => b.endTime - a.endTime)
    const halaman1 = await ambilPermainanPemain(db, 'FJRMHRII', { limit: 2 })
    expect(halaman1.total).toBe(semua.length)
    expect(halaman1.data.map((p) => p.id)).toEqual(terurut.slice(0, 2).map((p) => p.id))
    const halaman2 = await ambilPermainanPemain(db, 'fjrmhrii', { offset: 2, limit: 2 })
    expect(halaman2.data.map((p) => p.id)).toEqual(terurut.slice(2, 4).map((p) => p.id))

    const rapid = await ambilPermainanPemain(db, 'fjrmhrii', { timeClass: 'rapid' })
    expect(rapid.total).toBe(semua.filter((p) => p.timeClass === 'rapid').length)
    expect(rapid.data.every((p) => p.timeClass === 'rapid')).toBe(true)

    const kalah = await ambilPermainanPemain(db, 'fjrmhrii', { hasilSaya: 'kalah' })
    expect(kalah.total).toBe(semua.filter((p) => p.hasilSaya === 'kalah').length)
    expect(kalah.total).toBeGreaterThan(0)

    expect((await ambilPermainanPemain(db, 'orang-lain')).total).toBe(0)
  })
})

describe('evaluasi', () => {
  it('konversi garis bolak-balik tanpa kehilangan data', () => {
    const garis = hasilCari(FEN, 100, 2).garis
    expect(garis.map(garisKeTersimpan).map(garisDariTersimpan)).toEqual(garis)
  })

  it('kunci fen4: transposisi dengan penghitung berbeda tetap kena', async () => {
    const db = dbBaru()
    await simpanEvaluasi(db, hasilCari(FEN, 100000, 2), 1)
    const lain = FEN.replace(/ 0 1$/, ' 4 3')
    expect(await ambilEvaluasi(db, lain, 100000, 2, 'v1')).toMatchObject({ anggaranNodes: 100000 })
  })

  it('memakai ulang nodes/MultiPV lebih besar, menolak lebih kecil atau versi lain', async () => {
    const db = dbBaru()
    await simpanEvaluasi(db, hasilCari(FEN, 100000, 2), 1)
    await simpanEvaluasi(db, hasilCari(FEN, 600000, 3), 2)
    expect(await ambilEvaluasi(db, FEN, 100000, 2, 'v1')).toMatchObject({
      anggaranNodes: 100000,
      multiPv: 2,
    })
    expect(await ambilEvaluasi(db, FEN, 100000, 1, 'v1')).toMatchObject({ anggaranNodes: 600000 })
    expect(await ambilEvaluasi(db, FEN, 200000, 2, 'v1')).toMatchObject({ anggaranNodes: 600000 })
    expect(await ambilEvaluasi(db, FEN, 1000000, 2, 'v1')).toBeUndefined()
    expect(await ambilEvaluasi(db, FEN, 100000, 2, 'v2')).toBeUndefined()
  })
})

describe('ekspor dan impor', () => {
  async function isiData(db: BasisDataTelaah) {
    for (const p of daftarPermainan()) await simpanPermainan(db, p, uraiPgn(p.pgn).posisi)
    await simpanEvaluasi(db, hasilCari(FEN, 100000, 2), 5)
    await db.pemain.put({ username: 'fjrmhrii', daftarArsip: ['a', 'b'], diperbaruiPada: 7 })
    await simpanHasilAnalisis(db, {
      idPermainan: daftarPermainan()[0]?.id ?? '',
      versiAlgoritma: 'mvp-1',
      akurasi: { putih: 81.2, hitam: 64.9 },
      ringkasan: { putih: { best: 3, blunder: 1 }, hitam: { mistake: 2 } },
      kurvaEvaluasi: [0.5, 0.52, 0.31],
      selesaiPada: 9,
    })
    await db.labelLangkah.put({
      idPermainan: 'x',
      ply: 1,
      label: 'best',
      poinHilang: 0,
      epSebelum: 0.5,
      epSesudah: 0.5,
      langkahTerbaik: 'e2e4',
      pvTerbaik: ['e2e4'],
      alasan: [],
    })
    await db.kalibrasi.put({ idPermainan: 'x', ply: 1, labelChessCom: 'book' })
    await db.variasi.put({
      idVariasi: 'v1',
      idPermainan: 'x',
      plyInduk: 3,
      langkah: ['e2e4'],
      label: [null],
      dibuatPada: 1,
    })
    await db.cacheApi.put({ url: 'cache', data: {}, diambilPada: 0, kedaluwarsaPada: 1 })
  }

  it('ekspor -> impor ke basis data kosong -> ekspor menghasilkan data identik', async () => {
    const asal = dbBaru()
    await isiData(asal)
    const berkas = await eksporBasisData(asal, 123)
    expect(berkas.versiSkema).toBe(2)
    expect(Object.keys(berkas.tabel)).not.toContain('cacheApi')
    expect(berkas.tabel.permainan.length).toBe(milikSaya.length)

    const tujuan = dbBaru()
    await imporBasisData(tujuan, JSON.parse(JSON.stringify(berkas)))
    expect(await eksporBasisData(tujuan, 123)).toEqual(berkas)
    expect(await ambilHasilAnalisis(tujuan, daftarPermainan()[0]?.id ?? '', 'mvp-1')).toMatchObject(
      {
        akurasi: { putih: 81.2 },
      },
    )
    expect(await tujuan.cacheApi.count()).toBe(0)
  })

  it('mode ganti menghapus data lama; mode gabung mempertahankannya', async () => {
    const db = dbBaru()
    await db.pemain.put({ username: 'lama', daftarArsip: [], diperbaruiPada: 1 })
    const berkas = {
      format: 'telaah-ekspor',
      versiSkema: 2,
      dibuatPada: 0,
      tabel: { pemain: [{ username: 'baru', daftarArsip: [], diperbaruiPada: 2 }] },
    }
    await imporBasisData(db, berkas, 'gabung')
    expect((await db.pemain.toArray()).map((p) => p.username).sort()).toEqual(['baru', 'lama'])
    await imporBasisData(db, berkas, 'ganti')
    expect((await db.pemain.toArray()).map((p) => p.username)).toEqual(['baru'])
  })

  it.each([
    [null, 'objek'],
    [{ format: 'lain' }, 'Bukan berkas'],
    [{ format: 'telaah-ekspor', versiSkema: 99, tabel: {} }, 'tidak didukung'],
    [{ format: 'telaah-ekspor', versiSkema: 2, tabel: { pemain: 'x' } }, 'bukan array'],
  ])('menolak berkas tidak valid %#', async (data, pesan) => {
    const db = dbBaru()
    await expect(imporBasisData(db, data)).rejects.toThrow(GalatImpor)
    await expect(imporBasisData(db, data)).rejects.toThrow(pesan)
  })
})
