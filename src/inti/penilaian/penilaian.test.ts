import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import type { GarisHasil, Skor } from '../engine/uci'
import {
  akurasiLangkahLichess,
  cpPutihDariSkor,
  hitungAkurasiLichess,
  winPercentLichess,
} from './akurasiLichess'
import { klasifikasiLangkah, labelDariPita, type KonteksLangkah } from './klasifikasi'
import { KONFIGURASI_PENILAIAN, type KonfigurasiPenilaian } from './konfigurasiPenilaian'
import { hitungPeluangMenang, hitungPoinHilang } from './peluangMenang'
import {
  kelasPenilaianPermainan,
  klasifikasiUlang,
  type EvaluasiPosisi,
  type PosisiPenilaian,
} from './penilaianPermainan'

const K = KONFIGURASI_PENILAIAN
const cp = (nilai: number): Skor => ({ jenis: 'cp', nilai })
const mat = (nilai: number): Skor => ({ jenis: 'mat', nilai })

describe('hitungPeluangMenang', () => {
  it('cp 0 = 0,5; monoton; simetris putih/hitam', () => {
    expect(hitungPeluangMenang(cp(0), 1500, K.kurva)).toBe(0.5)
    expect(hitungPeluangMenang(cp(100), 1500, K.kurva)).toBeGreaterThan(
      hitungPeluangMenang(cp(50), 1500, K.kurva),
    )
    for (const c of [1, 37, 250, 900]) {
      expect(
        hitungPeluangMenang(cp(c), 1500, K.kurva) + hitungPeluangMenang(cp(-c), 1500, K.kurva),
      ).toBeCloseTo(1, 12)
    }
  })

  it('nilai acuan: 1 / (1 + exp(-0,00368208 * 100)) = 0,591026', () => {
    expect(hitungPeluangMenang(cp(100), 1500, K.kurva)).toBeCloseTo(0.591026, 6)
  })

  it('mat: menang 1, dimat 0, mate 0 = 0', () => {
    expect(hitungPeluangMenang(mat(3), 1500, K.kurva)).toBe(1)
    expect(hitungPeluangMenang(mat(-1), 1500, K.kurva)).toBe(0)
    expect(hitungPeluangMenang(mat(0), 1500, K.kurva)).toBe(0)
  })

  it('cp ekstrem dibatasi ±1500', () => {
    expect(hitungPeluangMenang(cp(99999), 1500, K.kurva)).toBe(
      hitungPeluangMenang(cp(1500), 1500, K.kurva),
    )
    expect(hitungPeluangMenang(cp(-99999), 1500, K.kurva)).toBe(
      hitungPeluangMenang(cp(-1500), 1500, K.kurva),
    )
    expect(hitungPeluangMenang(cp(1500), 1500, K.kurva)).toBeLessThan(1)
  })

  it('beta 0: rating tidak berpengaruh; beta > 0: rating tinggi lebih curam', () => {
    expect(hitungPeluangMenang(cp(80), 800, K.kurva)).toBe(
      hitungPeluangMenang(cp(80), 2500, K.kurva),
    )
    const kurva = { ...K.kurva, beta: 0.5 }
    expect(hitungPeluangMenang(cp(80), 2500, kurva)).toBeGreaterThan(
      hitungPeluangMenang(cp(80), 800, kurva),
    )
  })

  it('poinHilang tidak pernah negatif', () => {
    expect(hitungPoinHilang(0.6, 0.65)).toBe(0)
    expect(hitungPoinHilang(0.6, 0.45)).toBeCloseTo(0.15, 12)
  })
})

describe('pita resmi', () => {
  it.each([
    [0, 'best'],
    [0.003, 'best'],
    [0.0031, 'excellent'],
    [0.02, 'excellent'],
    [0.0201, 'good'],
    [0.05, 'good'],
    [0.0501, 'inaccuracy'],
    [0.1, 'inaccuracy'],
    [0.1001, 'mistake'],
    [0.2, 'mistake'],
    [0.2001, 'blunder'],
    [1, 'blunder'],
  ] as const)('poinHilang %f -> %s (batas atas inklusif)', (poin, label) => {
    expect(labelDariPita(poin, false, K)).toBe(label)
  })

  it('bestmove engine selalu Best walau poinHilang > toleransi', () => {
    expect(labelDariPita(0.01, true, K)).toBe('best')
  })
})

describe('klasifikasiLangkah', () => {
  const dasar: KonteksLangkah = {
    ply: 1,
    langkahUci: 'e2e4',
    paksa: false,
    epTerbaik: 0.6,
    epDimainkan: 0.3,
    poinHilang: 0.3,
    langkahTerbaik: 'd2d4',
    ratingPemain: 1200,
  }

  it('langkah paksa = Best dengan alasan paksa, walau poinHilang besar', () => {
    expect(klasifikasiLangkah({ ...dasar, paksa: true }, K)).toEqual({
      label: 'best',
      alasan: ['paksa'],
    })
  })

  it('penentu khusus didahulukan; null diteruskan ke pita', () => {
    const book = () => ({ label: 'book' as const, alasan: ['buku'] })
    expect(klasifikasiLangkah(dasar, K, [() => null, book]).label).toBe('book')
    expect(klasifikasiLangkah(dasar, K, [() => null]).label).toBe('blunder')
  })
})

describe('akurasi Lichess', () => {
  it('Win%: cp 0 = 50, dibatasi ±1000, mat = plafon', () => {
    expect(winPercentLichess(0)).toBe(50)
    expect(winPercentLichess(5000)).toBe(winPercentLichess(1000))
    expect(cpPutihDariSkor(mat(2), 'b')).toBe(-1000)
    expect(cpPutihDariSkor(mat(0), 'w')).toBe(-1000)
    expect(cpPutihDariSkor(cp(-40), 'b')).toBe(40)
  })

  it('akurasi langkah: tidak turun = 100; turun 0 dibatasi 100 (bonus +1); turun besar = 0', () => {
    expect(akurasiLangkahLichess(40, 60)).toBe(100)
    expect(akurasiLangkahLichess(50, 50)).toBe(100)
    expect(akurasiLangkahLichess(50, 49.999999)).toBe(100)
    expect(akurasiLangkahLichess(100, 0)).toBe(0)
    expect(akurasiLangkahLichess(60, 50)).toBeCloseTo(
      103.1668100711649 * Math.exp(-0.4354415386753951) - 2.166924740191411,
      10,
    )
  })
})

// Fixture tangan: 1. e4 e5 2. Bc4 Nc6 3. Qh5, evaluasi sintetis (cp sudut pandang pemain yang melangkah).
// Nilai harapan dihitung terpisah dengan rumus blueprint/Lichess, bukan dengan kode ini.
function fixtureTangan() {
  const papan = new Chess()
  const posisi: PosisiPenilaian[] = [{ ply: 0, fen: papan.fen(), langkahUci: null, giliran: 'w' }]
  for (const [i, san] of ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5'].entries()) {
    const m = papan.move(san)
    posisi.push({ ply: i + 1, fen: papan.fen(), langkahUci: m.lan, giliran: papan.turn() })
  }
  const g = (multiPv: number, nilai: number, langkah: string): GarisHasil => ({
    multiPv,
    skor: cp(nilai),
    pv: [langkah],
    kedalaman: 10,
  })
  const evaluasi: EvaluasiPosisi[] = [
    { ply: 0, paksa: false, garis: [g(1, 30, 'e2e4'), g(2, 25, 'd2d4')] },
    { ply: 1, paksa: false, garis: [g(1, -30, 'e7e5'), g(2, -40, 'c7c5')] },
    { ply: 2, paksa: false, garis: [g(1, 40, 'g1f3'), g(2, 30, 'b1c3')] },
    { ply: 3, paksa: false, garis: [g(1, -20, 'g8f6'), g(2, -25, 'b8c6')] },
    { ply: 4, paksa: false, garis: [g(1, 30, 'b1c3'), g(2, 25, 'd2d3')] },
    { ply: 5, paksa: false, garis: [g(1, 150, 'g8f6'), g(2, 120, 'd7d6')] },
  ]
  return { posisi, evaluasi }
}

describe('kelasPenilaianPermainan dengan fixture tangan (5 langkah)', () => {
  const { posisi, evaluasi } = fixtureTangan()
  const hasil = kelasPenilaianPermainan(evaluasi, posisi, 1200, 1200, K)

  it('poinHilang dan label per langkah', () => {
    expect(hasil.label.map((l) => l.label)).toEqual([
      'best',
      'best',
      'excellent',
      'excellent',
      'mistake',
    ])
    const harapan = [0, 0, 0.018352, 0.004595, 0.162259]
    hasil.label.forEach((l, i) => expect(l.poinHilang).toBeCloseTo(harapan[i] ?? NaN, 6))
    expect(hasil.label.map((l) => l.warna)).toEqual(['w', 'b', 'w', 'b', 'w'])
    expect(hasil.label[2]).toMatchObject({ langkahUci: 'f1c4', langkahTerbaik: 'g1f3' })
  })

  it('kurva EP putih per ply', () => {
    const harapan = [0.527588, 0.527588, 0.536754, 0.518402, 0.527588, 0.365328]
    hasil.kurvaEvaluasi.forEach((v, i) => expect(v).toBeCloseTo(harapan[i] ?? NaN, 6))
  })

  it('akurasi Lichess per langkah dan per warna', () => {
    const harapan = [100, 96.962965, 93.076279, 96.95492, 48.729997]
    hasil.akurasiPerLangkah.forEach((v, i) => expect(v).toBeCloseTo(harapan[i] ?? NaN, 5))
    expect(hasil.akurasi.putih).toBeCloseTo(64.626229, 5)
    expect(hasil.akurasi.hitam).toBeCloseTo(96.958942, 5)
  })

  it('ringkasan label per pemain', () => {
    expect(hasil.ringkasan).toEqual({
      putih: { best: 1, excellent: 1, mistake: 1 },
      hitam: { best: 1, excellent: 1 },
    })
  })

  it('deterministik dan tidak mengubah masukan', () => {
    const salinan = JSON.stringify({ posisi, evaluasi })
    expect(kelasPenilaianPermainan(evaluasi, posisi, 1200, 1200, K)).toEqual(hasil)
    expect(JSON.stringify({ posisi, evaluasi })).toBe(salinan)
  })

  it('klasifikasi ulang dari evaluasi tersimpan dengan konfigurasi baru (tanpa engine)', () => {
    const baru: KonfigurasiPenilaian = { ...K, versiAlgoritma: 'uji-2', toleransiBest: 0.005 }
    const ulang = klasifikasiUlang(evaluasi, posisi, 1200, 1200, baru)
    expect(ulang.versiAlgoritma).toBe('uji-2')
    expect(ulang.label[3]?.label).toBe('best')
    expect(ulang.label[2]?.label).toBe('excellent')
  })
})

describe('simetri, mat, dan langkah paksa', () => {
  it('menukar warna (cermin papan) menghasilkan label sama', () => {
    const { posisi, evaluasi } = fixtureTangan()
    const hasil = kelasPenilaianPermainan(evaluasi, posisi, 1200, 1200, K)
    const cermin = posisi.map((p) => ({
      ...p,
      giliran: p.giliran === 'w' ? ('b' as const) : ('w' as const),
    }))
    const hasilCermin = kelasPenilaianPermainan(evaluasi, cermin, 1200, 1200, K)
    expect(hasilCermin.label.map((l) => l.label)).toEqual(hasil.label.map((l) => l.label))
    expect(hasilCermin.kurvaEvaluasi.map((v) => 1 - v)).toEqual(hasil.kurvaEvaluasi.map((v) => v))
  })

  it('langkah mat: posisi akhir mate 0 sintetis; langkah pemenang Best, EP dimainkan 1', () => {
    const papan = new Chess('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1')
    const awal = papan.fen()
    const m = papan.move('Rd8#')
    const posisi: PosisiPenilaian[] = [
      { ply: 0, fen: awal, langkahUci: null, giliran: 'w' },
      { ply: 1, fen: papan.fen(), langkahUci: m.lan, giliran: 'b' },
    ]
    const evaluasi: EvaluasiPosisi[] = [
      { ply: 0, paksa: false, garis: [{ multiPv: 1, skor: mat(1), pv: ['d1d8'], kedalaman: 5 }] },
      { ply: 1, paksa: false, garis: [{ multiPv: 1, skor: mat(0), pv: [], kedalaman: 0 }] },
    ]
    const h = kelasPenilaianPermainan(evaluasi, posisi, 1500, 1500, K)
    expect(h.label[0]).toMatchObject({ label: 'best', epSebelum: 1, epSesudah: 1, poinHilang: 0 })
    expect(h.kurvaEvaluasi).toEqual([1, 1])
  })

  it('melewatkan mat (mat 1 -> cp 0 di luar MultiPV) = Blunder', () => {
    const papan = new Chess('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1')
    const awal = papan.fen()
    const m = papan.move('Kf1')
    const posisi: PosisiPenilaian[] = [
      { ply: 0, fen: awal, langkahUci: null, giliran: 'w' },
      { ply: 1, fen: papan.fen(), langkahUci: m.lan, giliran: 'b' },
    ]
    const evaluasi: EvaluasiPosisi[] = [
      { ply: 0, paksa: false, garis: [{ multiPv: 1, skor: mat(1), pv: ['d1d8'], kedalaman: 5 }] },
      { ply: 1, paksa: false, garis: [{ multiPv: 1, skor: cp(0), pv: ['h7h6'], kedalaman: 10 }] },
    ]
    expect(kelasPenilaianPermainan(evaluasi, posisi, 1500, 1500, K).label[0]?.label).toBe('blunder')
  })

  it('langkah paksa diberi Best walau evaluasi turun', () => {
    const posisi: PosisiPenilaian[] = [
      { ply: 0, fen: '7k/8/8/8/8/8/1q6/K7 w - - 0 1', langkahUci: null, giliran: 'w' },
      { ply: 1, fen: '7k/8/8/8/8/8/1K6/8 b - - 0 1', langkahUci: 'a1b2', giliran: 'b' },
    ]
    const evaluasi: EvaluasiPosisi[] = [
      { ply: 0, paksa: true, garis: [{ multiPv: 1, skor: cp(0), pv: ['a1b2'], kedalaman: 5 }] },
      { ply: 1, paksa: false, garis: [{ multiPv: 1, skor: cp(-900), pv: [], kedalaman: 5 }] },
    ]
    expect(kelasPenilaianPermainan(evaluasi, posisi, 1500, 1500, K).label[0]).toMatchObject({
      label: 'best',
      alasan: ['paksa'],
    })
  })

  it('evaluasi yang hilang: galat jelas', () => {
    const { posisi, evaluasi } = fixtureTangan()
    expect(() => kelasPenilaianPermainan(evaluasi.slice(0, 3), posisi, 1200, 1200, K)).toThrow(
      /ply 3/,
    )
  })
})

describe('hitungAkurasiLichess', () => {
  it('tanpa kesalahan: kedua pihak 100', () => {
    const a = hitungAkurasiLichess([15, 15, 15, 15], 'w', 15)
    expect(a.putih).toBeCloseTo(100, 10)
    expect(a.hitam).toBeCloseTo(100, 10)
  })

  it('ukuran jendela = jumlah/10 dibatasi [2, 8]: 40 langkah memakai jendela 4', () => {
    const cps = Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 20 : -20 * (i % 5)))
    const a = hitungAkurasiLichess(cps, 'w')
    expect(a.perLangkah).toHaveLength(40)
    expect(a.putih).toBeGreaterThan(0)
    expect(a.putih).toBeLessThanOrEqual(100)
  })
})
