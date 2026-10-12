import { useRef, useState } from 'react'
import {
  benchmarkKolam,
  benchmarkTunggal,
  nilaiKecepatan,
  nilaiKolam,
  TARGET_PERCEPATAN_3_WORKER,
  ukurMuat,
  ukurUcinewgame,
  type BarisKolam,
  type BarisTunggal,
  type HasilUcinewgame,
} from '../fitur/pocEngine/benchmark'
import { posisiOpera, POSISI_BENCHMARK } from '../fitur/pocEngine/posisiUji'
import { jumlahWorkerBawaan, urlEngine, VERSI_ENGINE } from '../inti/engine/konfigurasiEngine'
import { GalatEngine } from '../inti/engine/mesinCatur'
import { buatSaluranWorker } from '../inti/engine/saluran'
import { Kartu } from '../komponen/ui/Kartu'
import { Lencana } from '../komponen/ui/Lencana'
import { Tabel } from '../komponen/ui/Tabel'
import { Tombol } from '../komponen/ui/Tombol'
import './HalamanPoc.css'

const NODES_KOLAM = 100_000
const NODES_UCINEWGAME = 100_000

function deteksiSeluler(): boolean {
  const data = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  return data?.mobile ?? /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
}

function Status({ lulus }: { lulus: boolean | undefined }) {
  if (lulus === undefined) return <Lencana>TIDAK DIUJI</Lencana>
  return <Lencana varian={lulus ? 'ketiga' : 'bahaya'}>{lulus ? 'LULUS' : 'GAGAL'}</Lencana>
}

const ms = (n: number) => Math.round(n).toLocaleString('id-ID')

export function HalamanPocEngine() {
  const seluler = deteksiSeluler()
  const hc = navigator.hardwareConcurrency || 1
  const [berjalan, setBerjalan] = useState(false)
  const [tahap, setTahap] = useState('')
  const [muatMs, setMuatMs] = useState<number | null>(null)
  const [tunggal, setTunggal] = useState<BarisTunggal[]>([])
  const [kolam, setKolam] = useState<BarisKolam[]>([])
  const [uci, setUci] = useState<HasilUcinewgame | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const pengendali = useRef<AbortController | null>(null)

  const pabrik = () => buatSaluranWorker(urlEngine(import.meta.env.BASE_URL))
  const sekarang = () => performance.now()

  async function jalankan() {
    const p = new AbortController()
    pengendali.current = p
    setBerjalan(true)
    setGalat(null)
    setMuatMs(null)
    setTunggal([])
    setKolam([])
    setUci(null)
    const daftar24 = posisiOpera(24)
    const jumlahKolam = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n <= hc)
    try {
      setTahap('Memuat engine')
      const { mesin, muatMs } = await ukurMuat(pabrik, sekarang)
      setMuatMs(muatMs)
      try {
        setTahap('Benchmark 1 Worker')
        const bt: BarisTunggal[] = []
        await benchmarkTunggal(mesin, POSISI_BENCHMARK, [100_000, 1_000_000], p.signal, (b) => {
          bt.push(b)
          setTunggal([...bt])
        })
        setTahap('Biaya ucinewgame dan determinisme')
        setUci(await ukurUcinewgame(mesin, daftar24, NODES_UCINEWGAME, sekarang, p.signal))
      } finally {
        mesin.tutup()
      }
      setTahap('Benchmark kolam Worker')
      const bk: BarisKolam[] = []
      await benchmarkKolam(pabrik, jumlahKolam, daftar24, NODES_KOLAM, sekarang, p.signal, (b) => {
        bk.push(b)
        setKolam([...bk])
      })
      setTahap('Selesai')
    } catch (e) {
      setGalat(e instanceof GalatEngine ? `${e.jenis}: ${e.message}` : String(e))
      setTahap('Berhenti')
    } finally {
      setBerjalan(false)
    }
  }

  const kecepatan = tunggal.length ? nilaiKecepatan(tunggal, seluler) : undefined
  const nilaiPool = nilaiKolam(kolam)

  return (
    <div className="poc">
      <header>
        <h1>PoC Engine</h1>
        <p className="teks-redup">
          {VERSI_ENGINE} di Web Worker. Semua pencarian memakai <code>go nodes N</code>.
        </p>
      </header>

      <Kartu judul="Lingkungan">
        <dl className="poc__ringkasan">
          <dt>crossOriginIsolated</dt>
          <dd>{String(globalThis.crossOriginIsolated)}</dd>
          <dt>hardwareConcurrency</dt>
          <dd>{hc}</dd>
          <dt>Perangkat</dt>
          <dd>{seluler ? 'seluler' : 'laptop/desktop'}</dd>
          <dt>Worker bawaan</dt>
          <dd>{jumlahWorkerBawaan(hc, seluler)}</dd>
          <dt>userAgent</dt>
          <dd className="teks-mono">{navigator.userAgent}</dd>
        </dl>
      </Kartu>

      <div className="poc__aksi">
        <Tombol onClick={() => void jalankan()} disabled={berjalan}>
          Jalankan benchmark
        </Tombol>
        <Tombol varian="ghost" disabled={!berjalan} onClick={() => pengendali.current?.abort()}>
          Hentikan
        </Tombol>
      </div>
      {tahap && (
        <p role="status" className="teks-mono">
          Tahap: {tahap}
        </p>
      )}
      {galat && (
        <p role="alert" className="poc__galat">
          {galat}
        </p>
      )}

      {(kecepatan || muatMs !== null) && (
        <Kartu judul="Ringkasan">
          <dl className="poc__ringkasan">
            <dt>Waktu muat engine</dt>
            <dd>{muatMs === null ? '-' : `${ms(muatMs)} ms`}</dd>
            <dt>Rata-rata 100k node</dt>
            <dd>
              {kecepatan ? `${ms(kecepatan.rata100k)} ms (batas ${kecepatan.batas} ms) ` : '-'}
              <Status lulus={kecepatan?.lulus} />
            </dd>
            <dt>Percepatan 3 Worker</dt>
            <dd>
              {nilaiPool.percepatan3 === undefined
                ? hc < 3
                  ? 'hardwareConcurrency < 3 '
                  : '- '
                : `${nilaiPool.percepatan3.toFixed(2)}x (target ${TARGET_PERCEPATAN_3_WORKER}x) `}
              <Status lulus={nilaiPool.lulus} />
            </dd>
            {uci && (
              <>
                <dt>ucinewgame per posisi / sekali per game (24 posisi)</dt>
                <dd>
                  {ms(uci.perPosisiMs)} ms / {ms(uci.sekaliMs)} ms (selisih{' '}
                  {(((uci.perPosisiMs - uci.sekaliMs) / uci.sekaliMs) * 100).toFixed(1)}%)
                </dd>
                <dt>Deterministik (ucinewgame + go nodes)</dt>
                <dd>{uci.deterministik ? 'Ya' : 'Tidak'}</dd>
              </>
            )}
          </dl>
        </Kartu>
      )}

      {tunggal.length > 0 && (
        <Tabel
          judul="1 Worker per posisi"
          kolom={[
            { kunci: 'posisi', judul: 'Posisi' },
            { kunci: 'nodes', judul: 'Nodes', angka: true },
            { kunci: 'waktu', judul: 'Waktu (ms)', angka: true },
            { kunci: 'nps', judul: 'Nodes/detik', angka: true },
            { kunci: 'kedalaman', judul: 'Kedalaman', angka: true },
          ]}
          baris={tunggal.map((b, i) => ({
            i: String(i),
            posisi: b.posisi,
            nodes: b.nodes.toLocaleString('id-ID'),
            waktu: ms(b.waktuMs),
            nps: b.nps.toLocaleString('id-ID'),
            kedalaman: b.kedalaman ?? '-',
          }))}
          kunciBaris={(b) => b.i}
        />
      )}

      {kolam.length > 0 && (
        <Tabel
          judul={`Kolam Worker, 24 posisi × ${NODES_KOLAM.toLocaleString('id-ID')} node`}
          kolom={[
            { kunci: 'jumlah', judul: 'Worker', angka: true },
            { kunci: 'waktu', judul: 'Waktu (ms)', angka: true },
            { kunci: 'percepatan', judul: 'Percepatan', angka: true },
          ]}
          baris={kolam.map((b) => ({
            jumlah: b.jumlahWorker,
            waktu: b.galat ? 'gagal mulai' : ms(b.waktuMs),
            percepatan: b.galat ?? `${b.percepatan.toFixed(2)}x`,
          }))}
          kunciBaris={(b) => String(b.jumlah)}
        />
      )}
    </div>
  )
}
