import { useRef, useState } from 'react'
import { ambilKlienChesscom } from '../../inti/chesscom/klienBawaan'
import { ambilBasisData } from '../../inti/data/basisDataBawaan'
import type { Permainan } from '../../inti/data/tipe'
import type { KonfigurasiAnalisis } from '../../inti/engine/konfigurasiAnalisis'
import { urlEngine, VERSI_ENGINE } from '../../inti/engine/konfigurasiEngine'
import { KolamMesin } from '../../inti/engine/kolamMesin'
import type { ProgresAnalisis } from '../../inti/engine/pipelineAnalisis'
import { buatSaluranWorker } from '../../inti/engine/saluran'
import { BilahProgres } from '../../komponen/ui/BilahProgres'
import { Kartu } from '../../komponen/ui/Kartu'
import { KolomIsian } from '../../komponen/ui/KolomIsian'
import { Lencana } from '../../komponen/ui/Lencana'
import { Tombol } from '../../komponen/ui/Tombol'
import { BATAS_RUN_KEDUA_MS, jalankanRun, siapkanGameTerakhir, type HasilRun } from './ujiPipeline'

const ms = (n: number) => Math.round(n).toLocaleString('id-ID')

function teksRun(r: HasilRun): string {
  return `${ms(r.waktuMs)} ms · engine ${r.panggilanEngine} posisi · cache ${r.dariCache} · total ${r.total}`
}

export function KartuUjiPipeline({ konfigurasi }: { konfigurasi: KonfigurasiAnalisis }) {
  const [username, setUsername] = useState('fjrmhrii')
  const [berjalan, setBerjalan] = useState(false)
  const [permainan, setPermainan] = useState<Permainan | null>(null)
  const [progres, setProgres] = useState<ProgresAnalisis | null>(null)
  const [run, setRun] = useState<HasilRun[]>([])
  const [galat, setGalat] = useState<string | null>(null)
  const pengendali = useRef<AbortController | null>(null)

  async function uji() {
    const p = new AbortController()
    pengendali.current = p
    setBerjalan(true)
    setGalat(null)
    setRun([])
    setPermainan(null)
    const db = ambilBasisData()
    const kolam = new KolamMesin({
      jumlah: konfigurasi.jumlahWorker,
      pabrikSaluran: () => buatSaluranWorker(urlEngine(import.meta.env.BASE_URL)),
    })
    try {
      const siap = await siapkanGameTerakhir(ambilKlienChesscom(), db, username, p.signal)
      setPermainan(siap.permainan)
      await kolam.mulai()
      const hasil: HasilRun[] = []
      for (let i = 0; i < 2; i++) {
        hasil.push(
          await jalankanRun(
            siap.posisi,
            kolam,
            db,
            konfigurasi,
            VERSI_ENGINE,
            p.signal,
            setProgres,
          ),
        )
        setRun([...hasil])
      }
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e))
    } finally {
      kolam.tutup()
      setBerjalan(false)
    }
  }

  const kedua = run[1]
  return (
    <Kartu judul="Uji pipeline (game terakhir)">
      <p className="teks-redup">
        Mengambil game terakhir, menyimpannya, lalu menganalisis dua kali (Tahap A{' '}
        {konfigurasi.tahapA.nodes.toLocaleString('id-ID')} node, MultiPV{' '}
        {konfigurasi.tahapA.multiPv}, {konfigurasi.jumlahWorker} Worker). Run kedua harus dari
        cache.
      </p>
      <div className="poc__formulir">
        <KolomIsian
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="poc__aksi">
          <Tombol onClick={() => void uji()} disabled={berjalan}>
            Uji pipeline
          </Tombol>
          <Tombol varian="ghost" disabled={!berjalan} onClick={() => pengendali.current?.abort()}>
            Hentikan
          </Tombol>
        </div>
      </div>
      {progres && berjalan && (
        <BilahProgres
          label={`Tahap ${progres.tahap}${progres.sisaMs === undefined ? '' : ` · sisa ±${ms(progres.sisaMs / 1000)} s`}`}
          nilai={progres.selesai}
          maks={progres.total}
        />
      )}
      {galat && (
        <p role="alert" className="poc__galat">
          {galat}
        </p>
      )}
      {permainan && (
        <dl className="poc__ringkasan">
          <dt>Game</dt>
          <dd>
            {permainan.namaPutih} vs {permainan.namaHitam} · {permainan.timeClass} ·{' '}
            {permainan.jumlahPly} ply · <a href={permainan.url}>tautan</a>
          </dd>
          {run[0] && (
            <>
              <dt>Run 1</dt>
              <dd className="teks-mono">{teksRun(run[0])}</dd>
            </>
          )}
          {kedua && (
            <>
              <dt>Run 2 (cache)</dt>
              <dd className="teks-mono">
                {teksRun(kedua)}{' '}
                <Lencana
                  varian={
                    kedua.waktuMs < BATAS_RUN_KEDUA_MS && kedua.panggilanEngine === 0
                      ? 'ketiga'
                      : 'bahaya'
                  }
                >
                  {kedua.waktuMs < BATAS_RUN_KEDUA_MS && kedua.panggilanEngine === 0
                    ? 'LULUS'
                    : 'GAGAL'}
                </Lencana>
              </dd>
            </>
          )}
        </dl>
      )}
    </Kartu>
  )
}
