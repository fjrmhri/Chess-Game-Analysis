/** Menjalankan tugas satu per satu sesuai urutan masuk; kegagalan satu tugas tidak menghentikan antrean. */
export class AntreanSerial {
  private ekor: Promise<unknown> = Promise.resolve()

  jalankan<T>(tugas: () => Promise<T>): Promise<T> {
    const hasil = this.ekor.then(tugas)
    this.ekor = hasil.catch(() => undefined)
    return hasil
  }
}

function alasanBatal(signal: AbortSignal): Error {
  const alasan: unknown = signal.reason
  return alasan instanceof Error ? alasan : new DOMException('Dibatalkan', 'AbortError')
}

export function tidur(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((selesai, gagal) => {
    if (signal?.aborted) {
      gagal(alasanBatal(signal))
      return
    }
    const pewaktu = setTimeout(() => {
      signal?.removeEventListener('abort', batal)
      selesai()
    }, ms)
    function batal() {
      clearTimeout(pewaktu)
      if (signal) gagal(alasanBatal(signal))
    }
    signal?.addEventListener('abort', batal, { once: true })
  })
}

/** Retry-After: detik (bilangan) atau tanggal HTTP. Hasil ms >= 0, atau undefined bila tidak terbaca. */
export function uraiRetryAfter(nilai: string | null, sekarang: number): number | undefined {
  if (nilai === null || nilai.trim() === '') return undefined
  if (/^\d+$/.test(nilai.trim())) return Number(nilai.trim()) * 1000
  const waktu = Date.parse(nilai)
  return Number.isNaN(waktu) ? undefined : Math.max(0, waktu - sekarang)
}
