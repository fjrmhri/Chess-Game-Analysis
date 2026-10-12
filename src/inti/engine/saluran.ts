/** Jalur teks dua arah ke engine UCI (Worker di browser, modul Node di tes). */
export interface SaluranUci {
  kirim(perintah: string): void
  padaBaris(pendengar: (baris: string) => void): void
  padaGalat(pendengar: (galat: Error) => void): void
  tutup(): void
}

/** Saluran Web Worker: berkas stockfish lite-single adalah skrip Worker itu sendiri. */
export function buatSaluranWorker(url: string): SaluranUci {
  const pekerja = new Worker(url)
  let pendengarBaris: (baris: string) => void = () => undefined
  let pendengarGalat: (galat: Error) => void = () => undefined

  pekerja.onmessage = (e: MessageEvent<unknown>) => {
    if (typeof e.data !== 'string') return
    for (const baris of e.data.split('\n')) if (baris) pendengarBaris(baris)
  }
  pekerja.onerror = (e: ErrorEvent) => {
    pendengarGalat(new Error(e.message || 'Worker engine gagal dimuat'))
  }

  return {
    kirim: (perintah) => pekerja.postMessage(perintah),
    padaBaris: (p) => {
      pendengarBaris = p
    },
    padaGalat: (p) => {
      pendengarGalat = p
    },
    tutup: () => pekerja.terminate(),
  }
}
