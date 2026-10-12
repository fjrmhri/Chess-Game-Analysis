/** Skor UCI selalu dari sudut pandang pemain yang melangkah. mat 0 = pemain yang melangkah sudah dimat. */
export type Skor = { jenis: 'cp'; nilai: number } | { jenis: 'mat'; nilai: number }

/** Skor dari sudut pandang putih; mat memakai jumlah langkah positif dan pemenang eksplisit. */
export type SkorPutih =
  { jenis: 'cp'; nilai: number } | { jenis: 'mat'; langkah: number; pemenang: 'w' | 'b' }

export type Batas = 'bawah' | 'atas'

export interface InfoUci {
  kedalaman: number
  kedalamanSeleksi?: number
  multiPv: number
  skor: Skor
  batas?: Batas
  nodes?: number
  nps?: number
  waktuMs?: number
  pv: string[]
}

export interface Bestmove {
  langkah: string | null
  ponder?: string
}

const KATA_KUNCI_ANGKA = new Map<string, keyof InfoUci>([
  ['depth', 'kedalaman'],
  ['seldepth', 'kedalamanSeleksi'],
  ['multipv', 'multiPv'],
  ['nodes', 'nodes'],
  ['nps', 'nps'],
  ['time', 'waktuMs'],
])

/** Mengurai baris "info ..." yang memuat skor. Baris lain (info string, currmove) menghasilkan null. */
export function uraiBarisInfo(baris: string): InfoUci | null {
  const token = baris.trim().split(/\s+/)
  if (token[0] !== 'info' || token[1] === 'string') return null

  const angka: Partial<Record<keyof InfoUci, number>> = {}
  let skor: Skor | undefined
  let batas: Batas | undefined
  let pv: string[] = []

  for (let i = 1; i < token.length; i++) {
    const kunci = token[i] ?? ''
    const pemetaan = KATA_KUNCI_ANGKA.get(kunci)
    if (pemetaan) {
      angka[pemetaan] = Number(token[++i])
    } else if (kunci === 'score') {
      const jenis = token[++i]
      const nilai = Number(token[++i])
      if ((jenis === 'cp' || jenis === 'mate') && Number.isFinite(nilai)) {
        skor = jenis === 'cp' ? { jenis: 'cp', nilai } : { jenis: 'mat', nilai }
      }
      const berikut = token[i + 1]
      if (berikut === 'lowerbound' || berikut === 'upperbound') {
        batas = berikut === 'lowerbound' ? 'bawah' : 'atas'
        i++
      }
    } else if (kunci === 'pv') {
      pv = token.slice(i + 1)
      break
    }
  }

  if (!skor || angka.kedalaman === undefined) return null
  return {
    kedalaman: angka.kedalaman,
    kedalamanSeleksi: angka.kedalamanSeleksi,
    multiPv: angka.multiPv ?? 1,
    skor,
    batas,
    nodes: angka.nodes,
    nps: angka.nps,
    waktuMs: angka.waktuMs,
    pv,
  }
}

export function uraiBestmove(baris: string): Bestmove | null {
  const token = baris.trim().split(/\s+/)
  if (token[0] !== 'bestmove') return null
  const langkah = token[1] && token[1] !== '(none)' ? token[1] : null
  const ponder = token[2] === 'ponder' ? token[3] : undefined
  return ponder ? { langkah, ponder } : { langkah }
}

export interface GarisHasil {
  multiPv: number
  skor: Skor
  batas?: Batas
  pv: string[]
  kedalaman: number
  nodes?: number
}

/**
 * Mengumpulkan info terakhir per multipv. Pencarian yang dihentikan batas nodes bisa berakhir dengan
 * baris lowerbound/upperbound; baris itu tetap dipakai (ditandai `batas`) karena bestmove engine
 * berasal darinya. Memakai baris tepat sebelumnya membuat pv[0] berbeda dari bestmove (terukur di
 * tes integrasi: tepat = b1c3, bestmove = d2d4).
 */
export class PengumpulInfo {
  private readonly terakhir = new Map<number, InfoUci>()
  private infoTerakhir: InfoUci | undefined

  tambah(info: InfoUci): void {
    this.terakhir.set(info.multiPv, info)
    this.infoTerakhir = info
  }

  get nodesTerakhir(): number | undefined {
    return this.infoTerakhir?.nodes
  }

  get kedalamanTerakhir(): number | undefined {
    return this.infoTerakhir?.kedalaman
  }

  hasil(): GarisHasil[] {
    return [...this.terakhir.keys()]
      .sort((a, b) => a - b)
      .map((mpv) => {
        const info = this.terakhir.get(mpv)
        if (!info) throw new Error(`multipv ${mpv} hilang`)
        return {
          multiPv: mpv,
          skor: info.skor,
          batas: info.batas,
          pv: info.pv,
          kedalaman: info.kedalaman,
          nodes: info.nodes,
        }
      })
  }
}

export function skorKeSudutPutih(skor: Skor, giliran: 'w' | 'b'): SkorPutih {
  if (skor.jenis === 'cp') return { jenis: 'cp', nilai: giliran === 'w' ? skor.nilai : -skor.nilai }
  const lawan = giliran === 'w' ? 'b' : 'w'
  return {
    jenis: 'mat',
    langkah: Math.abs(skor.nilai),
    pemenang: skor.nilai > 0 ? giliran : lawan,
  }
}

export function giliranDariFen(fen: string): 'w' | 'b' {
  const giliran = fen.trim().split(/\s+/)[1]
  if (giliran !== 'w' && giliran !== 'b') throw new Error(`FEN tanpa giliran: ${fen}`)
  return giliran
}
