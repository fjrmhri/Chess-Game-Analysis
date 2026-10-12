import { jumlahWorkerBawaan } from './konfigurasiEngine'

export interface AnggaranTahap {
  nodes: number
  multiPv: number
}

export interface KonfigurasiAnalisis {
  tahapA: AnggaranTahap
  tahapB: AnggaranTahap & { batasPosisi: number }
  jumlahWorker: number
  /** KEPUTUSAN P4: ucinewgame per posisi agar hasil tidak bergantung urutan pencarian. */
  ucinewgamePerPosisi: boolean
}

export type PengaturanAnalisis = {
  tahapA?: Partial<AnggaranTahap>
  tahapB?: Partial<KonfigurasiAnalisis['tahapB']>
  jumlahWorker?: number
  ucinewgamePerPosisi?: boolean
}

// Blueprint §4 (ASUMSI dari praktik ChessGrader): Tahap A 100k MultiPV 2, Tahap B 600k MultiPV 2–3
const TAHAP_A: AnggaranTahap = { nodes: 100_000, multiPv: 2 }
// ASUMSI: batas posisi kritis per game; HP dibatasi lebih ketat (KEPUTUSAN butir 7), angka final setelah benchmark HP
const TAHAP_B_LAPTOP = { nodes: 600_000, multiPv: 3, batasPosisi: 12 }
const TAHAP_B_SELULER = { nodes: 600_000, multiPv: 3, batasPosisi: 6 }

export const BATAS_JUMLAH_WORKER = 8
export const BATAS_MULTI_PV = 5

export function konfigurasiBawaan(
  hardwareConcurrency: number,
  seluler: boolean,
): KonfigurasiAnalisis {
  return {
    tahapA: { ...TAHAP_A },
    tahapB: { ...(seluler ? TAHAP_B_SELULER : TAHAP_B_LAPTOP) },
    jumlahWorker: jumlahWorkerBawaan(hardwareConcurrency, seluler),
    ucinewgamePerPosisi: true,
  }
}

function bulatPositif(nilai: number | undefined, cadangan: number, maks = Infinity): number {
  if (nilai === undefined || !Number.isFinite(nilai)) return cadangan
  return Math.min(maks, Math.max(1, Math.round(nilai)))
}

/** Pengaturan pengguna menimpa bawaan; nilai tidak sah diganti bawaan atau dibatasi. */
export function gabungKonfigurasi(
  dasar: KonfigurasiAnalisis,
  pengaturan: PengaturanAnalisis = {},
): KonfigurasiAnalisis {
  return {
    tahapA: {
      nodes: bulatPositif(pengaturan.tahapA?.nodes, dasar.tahapA.nodes),
      multiPv: bulatPositif(pengaturan.tahapA?.multiPv, dasar.tahapA.multiPv, BATAS_MULTI_PV),
    },
    tahapB: {
      nodes: bulatPositif(pengaturan.tahapB?.nodes, dasar.tahapB.nodes),
      multiPv: bulatPositif(pengaturan.tahapB?.multiPv, dasar.tahapB.multiPv, BATAS_MULTI_PV),
      batasPosisi:
        pengaturan.tahapB?.batasPosisi === 0
          ? 0
          : bulatPositif(pengaturan.tahapB?.batasPosisi, dasar.tahapB.batasPosisi),
    },
    jumlahWorker: bulatPositif(pengaturan.jumlahWorker, dasar.jumlahWorker, BATAS_JUMLAH_WORKER),
    ucinewgamePerPosisi: pengaturan.ucinewgamePerPosisi ?? dasar.ucinewgamePerPosisi,
  }
}
