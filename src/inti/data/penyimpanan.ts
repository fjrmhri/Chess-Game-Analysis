import { Dexie } from 'dexie'
import type { HasilCari } from '../engine/mesinCatur'
import type { CacheEvaluasi } from '../engine/pipelineAnalisis'
import type { GarisHasil } from '../engine/uci'
import { fen4 } from '../pgn/fen'
import type { LangkahPgn } from '../pgn/uraiPgn'
import type { BasisDataTelaah } from './basisData'
import type {
  Evaluasi,
  GarisEngine,
  HasilAnalisis,
  HasilSaya,
  Permainan,
  Posisi,
  Warna,
} from './tipe'

export async function simpanPermainan(
  db: BasisDataTelaah,
  permainan: Permainan,
  posisi?: readonly LangkahPgn[],
): Promise<void> {
  await db.transaction('rw', db.permainan, db.posisi, async () => {
    await db.permainan.put(permainan)
    if (!posisi) return
    await db.posisi.where('idPermainan').equals(permainan.id).delete()
    await db.posisi.bulkPut(
      posisi.map((p): Posisi => ({ ...p, idPermainan: permainan.id, isBook: false })),
    )
  })
}

export async function ambilPosisiPermainan(
  db: BasisDataTelaah,
  idPermainan: string,
): Promise<Posisi[]> {
  return db.posisi
    .where('[idPermainan+ply]')
    .between([idPermainan, Dexie.minKey], [idPermainan, Dexie.maxKey])
    .toArray()
}

export interface FilterPermainan {
  timeClass?: string
  hasilSaya?: HasilSaya
  warnaSaya?: Warna
  offset?: number
  limit?: number
}

export interface HalamanPermainan {
  data: Permainan[]
  total: number
}

/** Terbaru dulu. Rentang indeks [username(+timeClass)+endTime]; filter lain di cursor Dexie. */
export async function ambilPermainanPemain(
  db: BasisDataTelaah,
  username: string,
  filter: FilterPermainan = {},
): Promise<HalamanPermainan> {
  const u = username.trim().toLowerCase()
  const { timeClass, hasilSaya, warnaSaya, offset = 0, limit = 50 } = filter
  const buatKoleksi = () => {
    const dasar = timeClass
      ? db.permainan
          .where('[username+timeClass+endTime]')
          .between([u, timeClass, Dexie.minKey], [u, timeClass, Dexie.maxKey])
      : db.permainan.where('[username+endTime]').between([u, Dexie.minKey], [u, Dexie.maxKey])
    const terurut = dasar.reverse()
    return hasilSaya || warnaSaya
      ? terurut.filter(
          (p) =>
            (!hasilSaya || p.hasilSaya === hasilSaya) && (!warnaSaya || p.warnaSaya === warnaSaya),
        )
      : terurut
  }
  const [total, data] = await Promise.all([
    buatKoleksi().count(),
    buatKoleksi().offset(offset).limit(limit).toArray(),
  ])
  return { data, total }
}

export function garisKeTersimpan(g: GarisHasil): GarisEngine {
  return {
    multiPv: g.multiPv,
    ...(g.skor.jenis === 'cp' ? { skorCp: g.skor.nilai } : { skorMat: g.skor.nilai }),
    ...(g.batas ? { batas: g.batas } : {}),
    pvUci: g.pv,
    kedalaman: g.kedalaman,
    ...(g.nodes === undefined ? {} : { nodes: g.nodes }),
  }
}

export function garisDariTersimpan(g: GarisEngine): GarisHasil {
  return {
    multiPv: g.multiPv,
    skor:
      g.skorMat === undefined
        ? { jenis: 'cp', nilai: g.skorCp ?? 0 }
        : { jenis: 'mat', nilai: g.skorMat },
    ...(g.batas ? { batas: g.batas } : {}),
    pv: g.pvUci,
    kedalaman: g.kedalaman,
    nodes: g.nodes,
  }
}

export async function simpanEvaluasi(
  db: BasisDataTelaah,
  hasil: HasilCari,
  dibuatPada = Date.now(),
): Promise<Evaluasi> {
  const evaluasi: Evaluasi = {
    fen4: fen4(hasil.fen),
    anggaranNodes: hasil.nodesDiminta,
    multiPv: hasil.multiPv,
    versiEngine: hasil.versiEngine,
    garis: hasil.garis.map(garisKeTersimpan),
    langkahTerbaik: hasil.langkahTerbaik,
    dibuatPada,
  }
  await db.evaluasi.put(evaluasi)
  return evaluasi
}

/**
 * Evaluasi dengan nodes dan MultiPV >= yang diminta dan versi engine sama boleh dipakai ulang.
 * Prioritas: kecocokan persis, lalu anggaran nodes terbesar.
 */
export async function ambilEvaluasi(
  db: BasisDataTelaah,
  fen: string,
  anggaranNodes: number,
  multiPv: number,
  versiEngine: string,
): Promise<Evaluasi | undefined> {
  const calon = await db.evaluasi
    .where('fen4')
    .equals(fen4(fen))
    .filter(
      (e) =>
        e.versiEngine === versiEngine && e.anggaranNodes >= anggaranNodes && e.multiPv >= multiPv,
    )
    .toArray()
  const persis = calon.find((e) => e.anggaranNodes === anggaranNodes && e.multiPv === multiPv)
  if (persis) return persis
  return calon.sort((a, b) => b.anggaranNodes - a.anggaranNodes || b.multiPv - a.multiPv)[0]
}

export async function simpanHasilAnalisis(
  db: BasisDataTelaah,
  hasil: HasilAnalisis,
): Promise<void> {
  await db.hasilAnalisis.put(hasil)
}

export async function ambilHasilAnalisis(
  db: BasisDataTelaah,
  idPermainan: string,
  versiAlgoritma: string,
): Promise<HasilAnalisis | undefined> {
  return db.hasilAnalisis.get([idPermainan, versiAlgoritma])
}

export function cacheEvaluasiDexie(db: BasisDataTelaah): CacheEvaluasi {
  return {
    ambil: (fen, nodes, multiPv, versiEngine) =>
      ambilEvaluasi(db, fen, nodes, multiPv, versiEngine),
    simpan: async (hasil) => {
      await simpanEvaluasi(db, hasil)
    },
    keGaris: (evaluasi) => evaluasi.garis.map(garisDariTersimpan),
  }
}
