import {
  GalatEngine,
  MesinCatur,
  type HasilCari,
  type OpsiMesin,
  type PermintaanCari,
} from './mesinCatur'
import type { SaluranUci } from './saluran'

export interface OpsiKolam {
  pabrikSaluran: () => SaluranUci
  jumlah: number
  opsiMesin?: OpsiMesin
}

interface Tugas {
  id: number
  permintaan: PermintaanCari
  pengendali: AbortController
  selesai: (h: HasilCari & { idTugas: number }) => void
  gagal: (e: unknown) => void
}

interface Slot {
  mesin: MesinCatur
  tugas: Tugas | null
}

/** N mesin, satu antrean FIFO. Setiap janji cari() diselesaikan oleh pencarian miliknya sendiri. */
export class KolamMesin {
  private readonly opsi: OpsiKolam
  private readonly slot: Slot[] = []
  private readonly antrean: Tugas[] = []
  private idBerikut = 1
  private tertutup = false

  constructor(opsi: OpsiKolam) {
    if (!Number.isInteger(opsi.jumlah) || opsi.jumlah < 1) {
      throw new GalatEngine('MasukanTidakValid', 'jumlah mesin')
    }
    this.opsi = opsi
  }

  get jumlahMesin(): number {
    return this.slot.length
  }

  get statistik(): { sibuk: number; antre: number } {
    return { sibuk: this.slot.filter((s) => s.tugas).length, antre: this.antrean.length }
  }

  async mulai(): Promise<void> {
    const baru = Array.from({ length: this.opsi.jumlah }, () => this.buatMesin())
    try {
      await Promise.all(baru.map((m) => m.mulai()))
    } catch (e) {
      baru.forEach((m) => m.tutup())
      throw e
    }
    this.slot.push(...baru.map((mesin) => ({ mesin, tugas: null })))
  }

  cari(permintaan: PermintaanCari, signal?: AbortSignal): Promise<HasilCari & { idTugas: number }> {
    if (this.tertutup) return Promise.reject(new GalatEngine('Tertutup'))
    if (signal?.aborted) return Promise.reject(new GalatEngine('Dibatalkan'))
    return new Promise((selesai, gagal) => {
      const tugas: Tugas = {
        id: this.idBerikut++,
        permintaan,
        pengendali: new AbortController(),
        selesai,
        gagal,
      }
      signal?.addEventListener(
        'abort',
        () => {
          const i = this.antrean.indexOf(tugas)
          if (i >= 0) {
            this.antrean.splice(i, 1)
            gagal(new GalatEngine('Dibatalkan'))
          } else {
            tugas.pengendali.abort()
          }
        },
        { once: true },
      )
      this.antrean.push(tugas)
      this.jadwalkan()
    })
  }

  tutup(): void {
    this.tertutup = true
    for (const t of this.antrean.splice(0)) t.gagal(new GalatEngine('Tertutup'))
    for (const s of this.slot) s.mesin.tutup()
  }

  private buatMesin(): MesinCatur {
    return new MesinCatur(this.opsi.pabrikSaluran(), this.opsi.opsiMesin)
  }

  private jadwalkan(): void {
    for (const s of this.slot) {
      if (s.tugas || this.tertutup) continue
      const tugas = this.antrean.shift()
      if (!tugas) return
      s.tugas = tugas
      void this.jalankan(s, tugas)
    }
  }

  private async jalankan(s: Slot, tugas: Tugas): Promise<void> {
    try {
      const hasil = await s.mesin.cari(tugas.permintaan, tugas.pengendali.signal)
      tugas.selesai({ ...hasil, idTugas: tugas.id })
    } catch (e) {
      tugas.gagal(e)
    }
    // Slot tetap terisi selama mesin rusak diganti agar tidak menerima tugas baru
    if (s.mesin.rusakAtauTertutup && !this.tertutup) {
      await this.gantiMesin(s)
    }
    s.tugas = null
    this.jadwalkan()
  }

  private async gantiMesin(s: Slot): Promise<void> {
    s.mesin.tutup()
    const pengganti = this.buatMesin()
    try {
      await pengganti.mulai()
      s.mesin = pengganti
    } catch {
      pengganti.tutup()
      const i = this.slot.indexOf(s)
      if (i >= 0) this.slot.splice(i, 1)
      if (this.slot.length === 0) {
        for (const t of this.antrean.splice(0))
          t.gagal(new GalatEngine('Rusak', 'semua mesin gagal'))
      }
    }
  }
}
