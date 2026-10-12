// Saluran UCI ke engine asli lewat proses anak Node; hanya untuk tes integrasi.
// Satu proses per engine: modul Node stockfish berbagi state sehingga tidak bisa dibuat dua kali per proses.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createInterface } from 'node:readline'

const require = createRequire(import.meta.url)
const jalurEngine = require('stockfish').findEngine('lite-single')

export function buatSaluranNode() {
  let pendengar = () => undefined
  let pendengarGalat = () => undefined
  const anak = spawn(process.execPath, [jalurEngine], { stdio: ['pipe', 'pipe', 'inherit'] })
  createInterface({ input: anak.stdout }).on('line', (b) => b && pendengar(b))
  anak.on('error', (e) => pendengarGalat(e))
  return {
    kirim: (perintah) => anak.stdin.write(`${perintah}\n`),
    padaBaris: (p) => {
      pendengar = p
    },
    padaGalat: (p) => {
      pendengarGalat = p
    },
    tutup: () => anak.kill(),
  }
}
