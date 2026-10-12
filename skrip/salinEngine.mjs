// Menyalin engine stockfish lite single-thread dari node_modules ke public/engine/ (KEPUTUSAN P4-K1).
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const akar = join(dirname(fileURLToPath(import.meta.url)), '..')
const paket = join(akar, 'node_modules', 'stockfish')
const tujuan = join(akar, 'public', 'engine')

const konfigurasi = readFileSync(
  join(akar, 'src', 'inti', 'engine', 'konfigurasiEngine.ts'),
  'utf8',
)
const versiDiharapkan = /VERSI_PAKET_ENGINE = '([^']+)'/.exec(konfigurasi)?.[1]
const berkasJs = /BERKAS_ENGINE = '([^']+)'/.exec(konfigurasi)?.[1]
if (!versiDiharapkan || !berkasJs)
  throw new Error('Konstanta engine tidak ditemukan di konfigurasiEngine.ts')

const versiTerpasang = JSON.parse(readFileSync(join(paket, 'package.json'), 'utf8')).version
if (versiTerpasang !== versiDiharapkan) {
  throw new Error(
    `stockfish terpasang ${versiTerpasang}, konfigurasi mengharapkan ${versiDiharapkan}`,
  )
}

const daftar = [
  [join(paket, 'bin', berkasJs), berkasJs],
  [join(paket, 'bin', berkasJs.replace(/\.js$/, '.wasm')), berkasJs.replace(/\.js$/, '.wasm')],
  [join(paket, 'Copying.txt'), 'LISENSI'],
]

mkdirSync(tujuan, { recursive: true })
for (const [sumber, nama] of daftar) {
  if (!existsSync(sumber)) throw new Error(`Berkas engine tidak ada: ${sumber}`)
  copyFileSync(sumber, join(tujuan, nama))
  const hash = createHash('sha256').update(readFileSync(sumber)).digest('hex')
  console.log(`engine: ${nama} ${statSync(sumber).size} byte sha256=${hash.slice(0, 16)}…`)
}
