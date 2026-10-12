import { useRef, useState, type FormEvent } from 'react'
import { jalankanUjiApi, TARGET_BULAN, type HasilUjiApi } from '../fitur/pocApi/ujiApi'
import { adalahGalatChesscom, GalatChesscom } from '../inti/chesscom/galat'
import type { CatatanPermintaan } from '../inti/chesscom/klien'
import { ambilKlienChesscom } from '../inti/chesscom/klienBawaan'
import { BilahProgres } from '../komponen/ui/BilahProgres'
import { Kartu } from '../komponen/ui/Kartu'
import { KolomIsian } from '../komponen/ui/KolomIsian'
import { Lencana, type VarianLencana } from '../komponen/ui/Lencana'
import { Sakelar } from '../komponen/ui/Sakelar'
import { Tabel } from '../komponen/ui/Tabel'
import { Tombol } from '../komponen/ui/Tombol'
import './HalamanPoc.css'

const VARIAN_STATUS: Record<HasilUjiApi['status'], VarianLencana> = {
  LULUS: 'ketiga',
  SEBAGIAN: 'utama',
  GAGAL: 'bahaya',
}

function ringkasBulan(url: string): string {
  return url.split('/games/')[1] ?? url
}

export function HalamanPocApi() {
  const [username, setUsername] = useState('fjrmhrii')
  const [abaikanCache, setAbaikanCache] = useState(false)
  const [berjalan, setBerjalan] = useState(false)
  const [kemajuan, setKemajuan] = useState({ selesai: 0, total: 0 })
  const [catatan, setCatatan] = useState<CatatanPermintaan[]>([])
  const [hasil, setHasil] = useState<HasilUjiApi | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const pengendali = useRef<AbortController | null>(null)

  async function uji(e: FormEvent) {
    e.preventDefault()
    pengendali.current?.abort()
    const p = new AbortController()
    pengendali.current = p
    const log: CatatanPermintaan[] = []
    setCatatan([])
    setHasil(null)
    setGalat(null)
    setBerjalan(true)
    const klien = ambilKlienChesscom((c) => {
      log.push(c)
      setCatatan([...log])
    })
    try {
      setHasil(
        await jalankanUjiApi(klien, username, {
          signal: p.signal,
          abaikanCache,
          padaKemajuan: (selesai, total) => setKemajuan({ selesai, total }),
          ambilCatatan: () => log,
        }),
      )
    } catch (err) {
      if (!adalahGalatChesscom(err, 'Dibatalkan')) {
        setGalat(err instanceof GalatChesscom ? err.message : String(err))
      } else {
        setGalat('Uji dihentikan.')
      }
    } finally {
      setBerjalan(false)
    }
  }

  const awal = catatan[0]?.mulai ?? 0

  return (
    <div className="poc">
      <header>
        <h1>PoC API</h1>
        <p className="teks-redup">
          Mengambil daftar arsip lalu hingga {TARGET_BULAN} bulan terakhir secara serial dari
          PubAPI.
        </p>
      </header>

      <form className="poc__formulir" onSubmit={(e) => void uji(e)}>
        <KolomIsian
          label="Username chess.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          required
        />
        <Sakelar
          label="Abaikan cache (ambil ulang dari jaringan)"
          aktif={abaikanCache}
          padaUbah={setAbaikanCache}
        />
        <div className="poc__aksi">
          <Tombol type="submit" disabled={berjalan}>
            Uji
          </Tombol>
          <Tombol varian="ghost" disabled={!berjalan} onClick={() => pengendali.current?.abort()}>
            Hentikan
          </Tombol>
        </div>
      </form>

      {kemajuan.total > 0 && (
        <BilahProgres label="Bulan diambil" nilai={kemajuan.selesai} maks={kemajuan.total} />
      )}

      {galat && (
        <p role="alert" className="poc__galat">
          {galat}
        </p>
      )}

      {hasil && (
        <Kartu
          judul={
            <span className="poc__judul-hasil">
              Hasil <Lencana varian={VARIAN_STATUS[hasil.status]}>{hasil.status}</Lencana>
            </span>
          }
        >
          <dl className="poc__ringkasan">
            <dt>Jumlah arsip</dt>
            <dd>{hasil.jumlahArsip}</dd>
            <dt>Bulan diuji / berhasil</dt>
            <dd>
              {hasil.bulanDiuji.length} / {hasil.bulanBerhasil}
            </dd>
            <dt>Game diambil</dt>
            <dd>
              {hasil.jumlahGame} (dengan accuracies: {hasil.jumlahGameDenganAccuracies})
            </dd>
            <dt>Request serial</dt>
            <dd>{hasil.tumpangTindih ? 'TIDAK (tumpang tindih)' : 'Ya, tidak tumpang tindih'}</dd>
            <dt>Galat CORS/jaringan</dt>
            <dd>{hasil.adaGalatCors ? 'Ada' : 'Tidak ada'}</dd>
            <dt>Header access-control-allow-origin</dt>
            <dd>
              {!hasil.adaRequestJaringan
                ? 'Tidak diuji: semua data dari cache.'
                : hasil.headerAcao === null
                  ? 'Tidak terbaca: browser tidak mengekspos header ini ke JavaScript (bukan header CORS-safelisted). Respons tetap terbaca, artinya CORS diizinkan.'
                  : hasil.headerAcao}
            </dd>
          </dl>
          {hasil.alasan.length > 0 && (
            <ul className="poc__alasan">
              {hasil.alasan.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          {hasil.fieldGamePertama && (
            <>
              <h4>Field game pertama ({ringkasBulan(hasil.fieldGamePertama.sumber)})</h4>
              <dl className="poc__ringkasan teks-mono">
                <dt>pgn</dt>
                <dd>{hasil.fieldGamePertama.pgn ? 'ada' : 'tidak ada'}</dd>
                <dt>accuracies</dt>
                <dd>{hasil.fieldGamePertama.accuracies}</dd>
                <dt>white.rating</dt>
                <dd>{hasil.fieldGamePertama.whiteRating}</dd>
                <dt>uuid</dt>
                <dd>{hasil.fieldGamePertama.uuid}</dd>
                <dt>time_class</dt>
                <dd>{hasil.fieldGamePertama.timeClass}</dd>
                <dt>rules</dt>
                <dd>{hasil.fieldGamePertama.rules}</dd>
                <dt>eco</dt>
                <dd>{hasil.fieldGamePertama.eco}</dd>
              </dl>
            </>
          )}
        </Kartu>
      )}

      {catatan.length > 0 && (
        <Tabel
          judul="Log permintaan"
          kolom={[
            { kunci: 'no', judul: '#', angka: true },
            { kunci: 'target', judul: 'Target' },
            { kunci: 'sumber', judul: 'Sumber' },
            { kunci: 'status', judul: 'Status' },
            { kunci: 'percobaan', judul: 'Coba', angka: true },
            { kunci: 'mulai', judul: 'Mulai (ms)', angka: true },
            { kunci: 'durasi', judul: 'Durasi (ms)', angka: true },
          ]}
          baris={catatan.map((c, i) => ({
            no: i + 1,
            target: c.url.endsWith('/archives') ? 'daftar arsip' : ringkasBulan(c.url),
            sumber: c.sumber,
            status: c.galat ? `${c.status ?? '-'} ${c.galat}` : String(c.status ?? 'cache'),
            percobaan: c.percobaan,
            mulai: Math.round(c.mulai - awal),
            durasi: Math.round(c.selesai - c.mulai),
          }))}
          kunciBaris={(b) => String(b.no)}
        />
      )}
    </div>
  )
}
