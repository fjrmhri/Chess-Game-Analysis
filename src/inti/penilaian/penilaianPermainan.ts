import type { HasilAnalisis, LabelLangkahTersimpan, RingkasanLabel } from '../data/tipe'
import type { GarisHasil } from '../engine/uci'
import { cpPutihDariSkor, hitungAkurasiLichess, KONSTANTA_LICHESS } from './akurasiLichess'
import { klasifikasiLangkah, PENENTU_KHUSUS_MVP, type PenentuKhusus } from './klasifikasi'
import type { KonfigurasiPenilaian } from './konfigurasiPenilaian'
import type { LabelLangkah } from './label'
import { hitungPeluangMenang, hitungPoinHilang } from './peluangMenang'

const FEN_AWAL_STANDAR = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -'

export interface EvaluasiPosisi {
  ply: number
  garis: GarisHasil[]
  paksa: boolean
}

export interface PosisiPenilaian {
  ply: number
  fen: string
  langkahUci: string | null
  giliran: 'w' | 'b'
}

export interface LabelPly {
  ply: number
  warna: 'w' | 'b'
  langkahUci: string
  label: LabelLangkah
  alasan: string[]
  poinHilang: number
  epSebelum: number
  epSesudah: number
  langkahTerbaik: string | null
  pvTerbaik: string[]
}

export interface HasilPenilaian {
  versiAlgoritma: string
  label: LabelPly[]
  /** Expected points putih per ply (indeks = ply). */
  kurvaEvaluasi: number[]
  akurasi: { putih: number | undefined; hitam: number | undefined }
  akurasiPerLangkah: number[]
  ringkasan: { putih: RingkasanLabel; hitam: RingkasanLabel }
}

export class GalatPenilaian extends Error {
  constructor(pesan: string) {
    super(pesan)
    this.name = 'GalatPenilaian'
  }
}

/**
 * Fungsi murni dan deterministik: evaluasi per ply (0..n) + posisi -> label, kurva EP, akurasi, ringkasan.
 * Dipakai juga untuk klasifikasi ulang dari evaluasi tersimpan tanpa engine.
 */
export function kelasPenilaianPermainan(
  evaluasi: readonly EvaluasiPosisi[],
  posisi: readonly PosisiPenilaian[],
  ratingPutih: number,
  ratingHitam: number,
  konfigurasi: KonfigurasiPenilaian,
  penentuKhusus: readonly PenentuKhusus[] = PENENTU_KHUSUS_MVP,
): HasilPenilaian {
  const evPerPly = new Map(evaluasi.map((e) => [e.ply, e]))
  const urut = [...posisi].sort((a, b) => a.ply - b.ply)
  const rating = (g: 'w' | 'b') => (g === 'w' ? ratingPutih : ratingHitam)
  const ep = (g: GarisHasil | undefined, giliran: 'w' | 'b') => {
    if (!g) throw new GalatPenilaian('garis evaluasi kosong')
    return hitungPeluangMenang(g.skor, rating(giliran), konfigurasi.kurva)
  }
  const evDari = (ply: number) => {
    const e = evPerPly.get(ply)
    if (!e || e.garis.length === 0) throw new GalatPenilaian(`evaluasi ply ${ply} tidak ada`)
    return e
  }

  const kurvaEvaluasi = urut.map((p) => {
    const epPemain = ep(evDari(p.ply).garis[0], p.giliran)
    return p.giliran === 'w' ? epPemain : 1 - epPemain
  })

  const label: LabelPly[] = []
  let poinHilangSebelumnya: number | undefined
  for (let i = 1; i < urut.length; i++) {
    const sebelum = urut[i - 1]
    const sesudah = urut[i]
    if (!sebelum || !sesudah || !sesudah.langkahUci) continue
    const evSebelum = evDari(sebelum.ply)
    const evSesudah = evDari(sesudah.ply)
    const mover = sebelum.giliran
    const garisTerbaik = evSebelum.garis[0]
    const epTerbaik = ep(garisTerbaik, mover)
    const garisDimainkan = evSebelum.garis.find((g) => g.pv[0] === sesudah.langkahUci)
    // Langkah ada di MultiPV posisi sebelumnya: pakai skor dari pencarian yang sama (blueprint §2)
    const epDimainkan = garisDimainkan
      ? ep(garisDimainkan, mover)
      : 1 -
        hitungPeluangMenang(
          evSesudah.garis[0]?.skor ?? { jenis: 'cp', nilai: 0 },
          rating(mover),
          konfigurasi.kurva,
        )
    const garisKedua = evSebelum.garis[1]
    const poinHilang = hitungPoinHilang(epTerbaik, epDimainkan)
    const langkahTerbaik = garisTerbaik?.pv[0] ?? null

    const hasil = klasifikasiLangkah(
      {
        ply: sesudah.ply,
        langkahUci: sesudah.langkahUci,
        paksa: evSebelum.paksa,
        epTerbaik,
        epDimainkan,
        ...(garisKedua ? { epAlternatifKedua: ep(garisKedua, mover) } : {}),
        poinHilang,
        langkahTerbaik,
        ...(poinHilangSebelumnya === undefined
          ? {}
          : { poinHilangLawanSebelumnya: poinHilangSebelumnya }),
        ratingPemain: rating(mover),
      },
      konfigurasi,
      penentuKhusus,
    )
    label.push({
      ply: sesudah.ply,
      warna: mover,
      langkahUci: sesudah.langkahUci,
      label: hasil.label,
      alasan: hasil.alasan,
      poinHilang,
      epSebelum: epTerbaik,
      epSesudah: epDimainkan,
      langkahTerbaik,
      pvTerbaik: garisTerbaik?.pv ?? [],
    })
    poinHilangSebelumnya = poinHilang
  }

  const awal = urut[0]
  if (!awal) throw new GalatPenilaian('posisi kosong')
  const cpAwal = awal.fen.startsWith(FEN_AWAL_STANDAR)
    ? KONSTANTA_LICHESS.cpAwalPutih
    : cpPutihDariSkor(evDari(awal.ply).garis[0]?.skor ?? { jenis: 'cp', nilai: 0 }, awal.giliran)
  const cpPutih = urut
    .slice(1)
    .map((p) =>
      cpPutihDariSkor(evDari(p.ply).garis[0]?.skor ?? { jenis: 'cp', nilai: 0 }, p.giliran),
    )
  const akurasi = hitungAkurasiLichess(cpPutih, awal.giliran, cpAwal)

  return {
    versiAlgoritma: konfigurasi.versiAlgoritma,
    label,
    kurvaEvaluasi,
    akurasi: { putih: akurasi.putih, hitam: akurasi.hitam },
    akurasiPerLangkah: akurasi.perLangkah,
    ringkasan: ringkasanLabel(label),
  }
}

/** Klasifikasi ulang dari evaluasi tersimpan dengan konfigurasi baru; tidak memanggil engine. */
export const klasifikasiUlang = kelasPenilaianPermainan

export function ringkasanLabel(label: readonly LabelPly[]): HasilPenilaian['ringkasan'] {
  const hasil: HasilPenilaian['ringkasan'] = { putih: {}, hitam: {} }
  for (const l of label) {
    const r = l.warna === 'w' ? hasil.putih : hasil.hitam
    r[l.label] = (r[l.label] ?? 0) + 1
  }
  return hasil
}

export function keHasilAnalisis(
  idPermainan: string,
  hasil: HasilPenilaian,
  selesaiPada: number,
): HasilAnalisis {
  return {
    idPermainan,
    versiAlgoritma: hasil.versiAlgoritma,
    akurasi: { putih: hasil.akurasi.putih ?? Number.NaN, hitam: hasil.akurasi.hitam ?? Number.NaN },
    ringkasan: hasil.ringkasan,
    kurvaEvaluasi: hasil.kurvaEvaluasi,
    selesaiPada,
  }
}

export function keLabelTersimpan(
  idPermainan: string,
  hasil: HasilPenilaian,
): LabelLangkahTersimpan[] {
  return hasil.label.map((l) => ({
    idPermainan,
    ply: l.ply,
    label: l.label,
    poinHilang: l.poinHilang,
    epSebelum: l.epSebelum,
    epSesudah: l.epSesudah,
    langkahTerbaik: l.langkahTerbaik,
    pvTerbaik: l.pvTerbaik,
    alasan: l.alasan,
  }))
}
