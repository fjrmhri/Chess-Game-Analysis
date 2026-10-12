import { useRef, useState } from 'react'
import { ambilKlienChesscom } from '../../inti/chesscom/klienBawaan'
import { ambilBasisData } from '../../inti/data/basisDataBawaan'
import type { Permainan, Posisi } from '../../inti/data/tipe'
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
import type { HasilPenilaian } from '../../inti/penilaian/penilaianPermainan'
import { LencanaLabel } from '../../komponen/ikon/LencanaLabel'
import { Tabel } from '../../komponen/ui/Tabel'
import {
  BATAS_RUN_KEDUA_MS,
  jalankanRun,
  nilaiDanSimpan,
  siapkanGameTerakhir,
  type HasilRun,
} from './ujiPipeline'

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
  const [penilaian, setPenilaian] = useState<HasilPenilaian | null>(null)
  const [posisi, setPosisi] = useState<Posisi[]>([])
  const pengendali = useRef<AbortController | null>(null)

  async function uji() {
    const p = new AbortController()
    pengendali.current = p
    setBerjalan(true)
    setGalat(null)
    setRun([])
    setPermainan(null)
    setPenilaian(null)
    const db = ambilBasisData()
    const kolam = new KolamMesin({
      jumlah: konfigurasi.jumlahWorker,
      pabrikSaluran: () => buatSaluranWorker(urlEngine(import.meta.env.BASE_URL)),
    })
    try {
      const siap = await siapkanGameTerakhir(ambilKlienChesscom(), db, username, p.signal)
      setPermainan(siap.permainan)
      setPosisi(siap.posisi)
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
      const terakhir = hasil.at(-1)
      if (terakhir)
        setPenilaian(await nilaiDanSimpan(db, siap.permainan, siap.posisi, terakhir.hasil))
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
      {permainan && penilaian && (
        <>
          <h4>Penilaian MVP ({penilaian.versiAlgoritma})</h4>
          <dl className="poc__ringkasan">
            <dt>Akurasi Terbuka (Lichess)</dt>
            <dd className="teks-mono">
              putih {penilaian.akurasi.putih?.toFixed(1) ?? '-'} · hitam{' '}
              {penilaian.akurasi.hitam?.toFixed(1) ?? '-'}
            </dd>
            <dt>Akurasi chess.com (API)</dt>
            <dd className="teks-mono">
              {permainan.akurasiChessCom
                ? `putih ${permainan.akurasiChessCom.putih} · hitam ${permainan.akurasiChessCom.hitam}`
                : 'tidak ada (game belum pernah direview di chess.com)'}
            </dd>
          </dl>
          <Tabel
            judul="Label per langkah"
            kolom={[
              { kunci: 'ply', judul: 'Ply', angka: true },
              { kunci: 'langkah', judul: 'Langkah' },
              { kunci: 'label', judul: 'Label' },
              { kunci: 'poin', judul: 'Poin hilang', angka: true },
              { kunci: 'terbaik', judul: 'Terbaik engine' },
            ]}
            baris={penilaian.label.map((l) => ({
              ply: l.ply,
              langkah: `${l.warna === 'w' ? `${Math.ceil(l.ply / 2)}.` : `${Math.ceil(l.ply / 2)}...`} ${posisi.find((p) => p.ply === l.ply)?.langkahSan ?? l.langkahUci}`,
              label: <LencanaLabel label={l.label} />,
              poin: l.poinHilang.toFixed(3),
              terbaik: l.langkahTerbaik ?? '-',
            }))}
            kunciBaris={(b) => String(b.ply)}
          />
        </>
      )}
    </Kartu>
  )
}
