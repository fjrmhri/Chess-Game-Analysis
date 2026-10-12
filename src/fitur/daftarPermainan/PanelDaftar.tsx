import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { Permainan } from '../../inti/data/tipe'
import { KartuKeadaan } from '../../komponen/ui/KartuKeadaan'
import { KolomIsian } from '../../komponen/ui/KolomIsian'
import { Lencana, type VarianLencana } from '../../komponen/ui/Lencana'
import { Pilihan } from '../../komponen/ui/Pilihan'
import { Tabel } from '../../komponen/ui/Tabel'
import { Tombol } from '../../komponen/ui/Tombol'
import {
  ambilHalaman,
  filterKeQuery,
  terapkanFilter,
  uraiFilter,
  type FilterDaftar,
} from './filterPermainan'
import {
  formatHasil,
  formatKontrolWaktu,
  formatTanggal,
  namaBulan,
  namaKelasWaktu,
} from './formatPermainan'
import './PanelDaftar.css'

const VARIAN_HASIL: Record<Permainan['hasilSaya'], VarianLencana> = {
  menang: 'ketiga',
  kalah: 'bahaya',
  remis: 'netral',
  'tidak-diketahui': 'netral',
}

export interface PropsPanelDaftar {
  permainan: readonly Permainan[]
  sudahDianalisis: ReadonlySet<string>
  /** Semua bulan arsip ("YYYY-MM"), terbaru dulu. */
  bulanArsip: readonly string[]
}

function ratingLawan(p: Permainan): number {
  return p.warnaSaya === 'putih' ? p.ratingHitam : p.ratingPutih
}

function Akurasi({ p }: { p: Permainan }) {
  if (!p.akurasiChessCom) return <span className="teks-redup">–</span>
  const saya = p.warnaSaya === 'putih' ? p.akurasiChessCom.putih : p.akurasiChessCom.hitam
  const lawan = p.warnaSaya === 'putih' ? p.akurasiChessCom.hitam : p.akurasiChessCom.putih
  return (
    <span className="teks-mono" title="Akurasi dari chess.com (API)">
      {saya.toFixed(1)} / {lawan.toFixed(1)} <Lencana>chess.com</Lencana>
    </span>
  )
}

function TombolReview({ p }: { p: Permainan }) {
  if (!p.didukung) {
    return (
      <span className="panel-daftar__nonaktif">
        <Tombol ukuran="kecil" disabled aria-describedby={`alasan-${p.id}`}>
          Review
        </Tombol>
        <span id={`alasan-${p.id}`} className="teks-redup">
          {p.alasanTidakDidukung ?? 'Belum didukung'}
        </span>
      </span>
    )
  }
  return (
    <Link className="tombol tombol--kecil interaktif" to={`/review/${encodeURIComponent(p.id)}`}>
      Review
    </Link>
  )
}

export function PanelDaftar({ permainan, sudahDianalisis, bulanArsip }: PropsPanelDaftar) {
  const [query, setQuery] = useSearchParams()
  const filter = uraiFilter(query)
  const kunciQuery = query.toString()
  const terfilter = useMemo(
    () => terapkanFilter(permainan, uraiFilter(new URLSearchParams(kunciQuery))),
    [permainan, kunciQuery],
  )
  const halaman = ambilHalaman(terfilter, filter.hal)
  const kelasTersedia = [...new Set(permainan.map((p) => p.timeClass))].sort()

  function ubah(perubahan: Partial<FilterDaftar>) {
    setQuery(filterKeQuery({ ...filter, hal: 1, ...perubahan }), { replace: true })
  }

  const adaFilter = Boolean(
    filter.kelas || filter.hasil || filter.warna || filter.bulan || filter.lawan,
  )

  return (
    <div className="panel-daftar">
      <form
        className="panel-daftar__filter"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filter game"
      >
        <Pilihan
          label="Kontrol waktu"
          value={filter.kelas ?? ''}
          onChange={(e) => ubah({ kelas: e.target.value || undefined })}
          opsi={[
            { nilai: '', label: 'Semua' },
            ...kelasTersedia.map((k) => ({ nilai: k, label: namaKelasWaktu(k) })),
          ]}
        />
        <Pilihan
          label="Hasil"
          value={filter.hasil ?? ''}
          onChange={(e) => ubah({ hasil: (e.target.value || undefined) as FilterDaftar['hasil'] })}
          opsi={[
            { nilai: '', label: 'Semua' },
            { nilai: 'menang', label: 'Menang' },
            { nilai: 'kalah', label: 'Kalah' },
            { nilai: 'remis', label: 'Remis' },
          ]}
        />
        <Pilihan
          label="Warna"
          value={filter.warna ?? ''}
          onChange={(e) => ubah({ warna: (e.target.value || undefined) as FilterDaftar['warna'] })}
          opsi={[
            { nilai: '', label: 'Semua' },
            { nilai: 'putih', label: 'Putih' },
            { nilai: 'hitam', label: 'Hitam' },
          ]}
        />
        <Pilihan
          label="Bulan"
          value={filter.bulan ?? ''}
          onChange={(e) => ubah({ bulan: e.target.value || undefined })}
          opsi={[
            { nilai: '', label: 'Semua' },
            ...bulanArsip.map((b) => ({ nilai: b, label: namaBulan(b) })),
          ]}
        />
        <KolomIsian
          label="Cari lawan"
          type="search"
          value={filter.lawan ?? ''}
          onChange={(e) => ubah({ lawan: e.target.value || undefined })}
          autoComplete="off"
          spellCheck={false}
        />
        {adaFilter && (
          <div className="panel-daftar__reset">
            <Tombol
              varian="ghost"
              ukuran="kecil"
              onClick={() => setQuery(new URLSearchParams(), { replace: true })}
            >
              Reset filter
            </Tombol>
          </div>
        )}
      </form>

      <p className="teks-mono teks-redup" role="status">
        {halaman.total} game · halaman {halaman.hal} dari {halaman.jumlahHalaman}
      </p>

      {halaman.total === 0 ? (
        <KartuKeadaan jenis="kosong" judul="Tidak ada game">
          <p>
            {adaFilter
              ? 'Tidak ada game yang cocok dengan filter. Ubah atau reset filter.'
              : 'Belum ada game di bulan yang dimuat. Muat bulan lebih lama.'}
          </p>
        </KartuKeadaan>
      ) : (
        <>
          <div className="panel-daftar__tabel">
            <Tabel
              judul="Daftar game"
              kolom={[
                { kunci: 'tanggal', judul: 'Tanggal' },
                { kunci: 'lawan', judul: 'Lawan' },
                { kunci: 'warna', judul: 'Warna' },
                { kunci: 'hasil', judul: 'Hasil' },
                { kunci: 'waktu', judul: 'Kontrol waktu' },
                { kunci: 'langkah', judul: 'Langkah', angka: true },
                { kunci: 'akurasi', judul: 'Akurasi saya/lawan' },
                { kunci: 'status', judul: 'Analisis' },
                { kunci: 'aksi', judul: '' },
              ]}
              baris={halaman.data.map((p) => ({
                id: p.id,
                tanggal: formatTanggal(p.endTime),
                lawan: `${p.lawan} (${ratingLawan(p)})`,
                warna: p.warnaSaya === 'putih' ? 'Putih' : 'Hitam',
                hasil: <Lencana varian={VARIAN_HASIL[p.hasilSaya]}>{formatHasil(p)}</Lencana>,
                waktu: formatKontrolWaktu(p.timeClass, p.timeControl),
                langkah: p.jumlahLangkah,
                akurasi: <Akurasi p={p} />,
                status: sudahDianalisis.has(p.id) ? (
                  <Lencana varian="utama">Sudah</Lencana>
                ) : (
                  'Belum'
                ),
                aksi: <TombolReview p={p} />,
              }))}
              kunciBaris={(b) => b.id}
            />
          </div>

          <ul className="panel-daftar__kartu" aria-label="Daftar game">
            {halaman.data.map((p) => (
              <li key={p.id} className="panel-daftar__item">
                <div className="panel-daftar__baris">
                  <strong>
                    {p.lawan} ({ratingLawan(p)})
                  </strong>
                  <Lencana varian={VARIAN_HASIL[p.hasilSaya]}>{formatHasil(p)}</Lencana>
                </div>
                <div className="panel-daftar__meta teks-mono">
                  {formatTanggal(p.endTime)} · {p.warnaSaya === 'putih' ? 'Putih' : 'Hitam'} ·{' '}
                  {formatKontrolWaktu(p.timeClass, p.timeControl)} · {p.jumlahLangkah} langkah
                </div>
                <div className="panel-daftar__baris">
                  <Akurasi p={p} />
                  {sudahDianalisis.has(p.id) ? (
                    <Lencana varian="utama">Sudah dianalisis</Lencana>
                  ) : null}
                </div>
                <TombolReview p={p} />
              </li>
            ))}
          </ul>
        </>
      )}

      {halaman.jumlahHalaman > 1 && (
        <nav className="panel-daftar__paginasi" aria-label="Halaman">
          <Tombol
            varian="ghost"
            ukuran="kecil"
            disabled={halaman.hal <= 1}
            onClick={() => ubah({ hal: halaman.hal - 1 })}
          >
            Sebelumnya
          </Tombol>
          <span className="teks-mono">
            {halaman.hal} / {halaman.jumlahHalaman}
          </span>
          <Tombol
            varian="ghost"
            ukuran="kecil"
            disabled={halaman.hal >= halaman.jumlahHalaman}
            onClick={() => ubah({ hal: halaman.hal + 1 })}
          >
            Berikutnya
          </Tombol>
        </nav>
      )}
    </div>
  )
}
