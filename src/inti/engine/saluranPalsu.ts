import type { SaluranUci } from './saluran'

export interface PerilakuPalsu {
  /** Jeda (ms) sebelum menjawab "go"; bawaan 1 ms. */
  jedaCari?: (fen: string) => number
  /** Tidak pernah menjawab "go" (untuk menguji timeout). */
  abaikanGo?: boolean
  /** Tidak menjawab "stop" dengan bestmove (engine macet). */
  abaikanStop?: boolean
  /** Tidak menjawab apa pun (engine gagal dimuat). */
  diam?: boolean
}

/** Engine palsu untuk tes: pv berisi penanda FEN sehingga hasil bisa dicocokkan dengan permintaan. */
export class SaluranPalsu implements SaluranUci {
  readonly terkirim: string[] = []
  aktifBersamaan = 0
  aktifMaks = 0
  private pendengar: (b: string) => void = () => undefined
  private fen = ''
  private multiPv = 1
  private pewaktu: ReturnType<typeof setTimeout> | undefined
  private mencari = false
  ditutup = false

  private readonly perilaku: PerilakuPalsu

  constructor(perilaku: PerilakuPalsu = {}) {
    this.perilaku = perilaku
  }

  static penanda(fen: string): string {
    return fen.split(' ')[0]?.replace(/\//g, '') ?? ''
  }

  kirim(perintah: string): void {
    this.terkirim.push(perintah)
    if (this.perilaku.diam) return
    if (perintah === 'uci') this.jawab('uciok')
    else if (perintah === 'isready') this.jawab('readyok')
    else if (perintah.startsWith('setoption name MultiPV value '))
      this.multiPv = Number(perintah.split(' ').pop())
    else if (perintah.startsWith('position fen ')) this.fen = perintah.slice('position fen '.length)
    else if (perintah.startsWith('go nodes ')) this.go(Number(perintah.split(' ').pop()))
    else if (perintah === 'stop' && this.mencari && !this.perilaku.abaikanStop) {
      clearTimeout(this.pewaktu)
      this.selesaiCari()
    }
  }

  padaBaris(p: (b: string) => void): void {
    this.pendengar = p
  }

  padaGalat(): void {}

  tutup(): void {
    this.ditutup = true
    clearTimeout(this.pewaktu)
  }

  private jawab(baris: string): void {
    queueMicrotask(() => {
      if (!this.ditutup) this.pendengar(baris)
    })
  }

  private go(nodes: number): void {
    this.mencari = true
    this.aktifBersamaan++
    this.aktifMaks = Math.max(this.aktifMaks, this.aktifBersamaan)
    if (this.perilaku.abaikanGo) return
    const fen = this.fen
    this.pewaktu = setTimeout(
      () => {
        for (let mpv = 1; mpv <= this.multiPv; mpv++) {
          this.jawab(
            `info depth 5 seldepth 7 multipv ${mpv} score cp ${10 * mpv} nodes ${nodes} nps 100000 time 5 pv e2e4 ${SaluranPalsu.penanda(fen)}`,
          )
        }
        this.selesaiCari()
      },
      this.perilaku.jedaCari?.(fen) ?? 1,
    )
  }

  private selesaiCari(): void {
    this.mencari = false
    this.aktifBersamaan--
    this.jawab('bestmove e2e4 ponder e7e5')
  }
}
