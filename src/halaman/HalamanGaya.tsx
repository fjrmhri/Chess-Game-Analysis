import { useEffect, useState, type ReactNode } from 'react'
import { DAFTAR_LABEL, NAMA_LABEL } from '../inti/penilaian/label'
import { IkonLabel } from '../komponen/ikon/LabelLangkah'
import { LencanaLabel } from '../komponen/ikon/LencanaLabel'
import { PapanCatur } from '../komponen/papan/PapanCatur'
import { BilahProgres } from '../komponen/ui/BilahProgres'
import { Dialog } from '../komponen/ui/Dialog'
import { Kartu } from '../komponen/ui/Kartu'
import { KolomIsian } from '../komponen/ui/KolomIsian'
import { useToast } from '../komponen/ui/konteksToast'
import { Lencana } from '../komponen/ui/Lencana'
import { PenukarTema } from '../komponen/ui/PenukarTema'
import { Pilihan } from '../komponen/ui/Pilihan'
import { Sakelar } from '../komponen/ui/Sakelar'
import { Tab } from '../komponen/ui/Tab'
import { Tabel } from '../komponen/ui/Tabel'
import { Tombol, type VarianTombol } from '../komponen/ui/Tombol'
import './HalamanGaya.css'

const FEN_AWAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const TOKEN_PALET = [
  '--latar',
  '--permukaan',
  '--permukaan-nonaktif',
  '--tinta',
  '--tinta-redup',
  '--aksen-utama',
  '--aksen-kedua',
  '--aksen-ketiga',
  '--bahaya',
  '--papan-terang',
  '--papan-gelap',
  ...DAFTAR_LABEL.map((l) => `--label-${l}`),
]

const VARIAN_TOMBOL: VarianTombol[] = ['utama', 'kedua', 'bahaya', 'ghost']
const KEADAAN = [
  { nama: 'Normal', paksa: undefined, nonaktif: false },
  { nama: 'Hover', paksa: 'hover', nonaktif: false },
  { nama: 'Fokus', paksa: 'fokus', nonaktif: false },
  { nama: 'Tekan', paksa: 'tekan', nonaktif: false },
  { nama: 'Nonaktif', paksa: undefined, nonaktif: true },
] as const

function useNilaiToken(daftar: readonly string[]): Record<string, string> {
  const [nilai, setNilai] = useState<Record<string, string>>({})
  useEffect(() => {
    const baca = () => {
      const gaya = getComputedStyle(document.documentElement)
      setNilai(Object.fromEntries(daftar.map((t) => [t, gaya.getPropertyValue(t).trim()])))
    }
    baca()
    const pengamat = new MutationObserver(baca)
    pengamat.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null
    media?.addEventListener('change', baca)
    return () => {
      pengamat.disconnect()
      media?.removeEventListener('change', baca)
    }
  }, [daftar])
  return nilai
}

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section className="gaya__bagian" aria-labelledby={`bagian-${judul}`}>
      <h2 id={`bagian-${judul}`}>{judul}</h2>
      {children}
    </section>
  )
}

const BARIS_TABEL = [
  { langkah: '1. e4', label: 'Book', evaluasi: '+0.30' },
  { langkah: '1... c5', label: 'Book', evaluasi: '+0.35' },
  { langkah: '2. Qh5', label: 'Inaccuracy', evaluasi: '-0.10' },
]

export function HalamanGaya() {
  const nilaiToken = useNilaiToken(TOKEN_PALET)
  const toast = useToast()
  const [dialogTerbuka, setDialogTerbuka] = useState(false)
  const [sakelar, setSakelar] = useState(true)
  const [progres, setProgres] = useState(13)

  return (
    <div className="gaya">
      <header className="gaya__kepala">
        <h1>Gaya</h1>
        <p className="teks-redup">Etalase design system neo-brutalism Telaah.</p>
        <PenukarTema />
      </header>

      <Bagian judul="Palet">
        <ul className="gaya__palet">
          {TOKEN_PALET.map((t) => (
            <li key={t} className="gaya__warna">
              <span className="gaya__contoh-warna" style={{ background: `var(${t})` }} />
              <code>{t}</code>
              <span className="teks-mono teks-redup">{nilaiToken[t] ?? ''}</span>
            </li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Tipografi">
        <div className="gaya__tipografi">
          <p className="gaya__contoh-judul gaya__contoh-judul--1">Judul 1 Space Grotesk</p>
          <p className="gaya__contoh-judul gaya__contoh-judul--2">Judul 2 tracking sempit</p>
          <p className="gaya__contoh-judul gaya__contoh-judul--3">Judul 3 huruf kapital</p>
          <p>Teks isi Space Grotesk 400. Penjelasan langkah dan tips tampil dengan huruf ini.</p>
          <p className="teks-redup">Teks sekunder memakai --tinta-redup.</p>
          <p className="teks-mono">1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 · +0.34 · #-3 · 87,4%</p>
        </div>
      </Bagian>

      <Bagian judul="Tombol">
        <div className="gaya__matriks" role="table" aria-label="Varian tombol per keadaan">
          {VARIAN_TOMBOL.map((v) => (
            <div key={v} className="gaya__baris" role="row">
              <span className="gaya__kepala-baris teks-mono" role="rowheader">
                {v}
              </span>
              {KEADAAN.map((k) => (
                <span key={k.nama} role="cell" className="gaya__sel">
                  <Tombol varian={v} disabled={k.nonaktif} data-paksa-keadaan={k.paksa}>
                    {k.nama}
                  </Tombol>
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="gaya__deret">
          <Tombol ukuran="kecil">Kecil</Tombol>
          <Tombol>Sedang</Tombol>
          <Tombol ukuran="besar">Besar</Tombol>
        </div>
      </Bagian>

      <Bagian judul="Kartu dan lencana">
        <div className="gaya__kisi">
          <Kartu judul="Kartu polos">
            <p>Permukaan dengan border 3px dan bayangan keras.</p>
          </Kartu>
          <Kartu judul="Aksen utama" aksen="utama">
            <p>Kepala kartu berwarna aksen utama.</p>
          </Kartu>
          <Kartu judul="Aksen kedua" aksen="kedua">
            <div className="gaya__deret">
              <Lencana>Netral</Lencana>
              <Lencana varian="utama">Utama</Lencana>
              <Lencana varian="kedua">Kedua</Lencana>
              <Lencana varian="ketiga">Ketiga</Lencana>
              <Lencana varian="bahaya">Bahaya</Lencana>
            </div>
          </Kartu>
        </div>
      </Bagian>

      <Bagian judul="Formulir">
        <div className="gaya__kisi">
          <KolomIsian label="Username" placeholder="nama pengguna" bantuan="Normal" />
          <KolomIsian label="Fokus" defaultValue="fjrmhrii" data-paksa-keadaan="fokus" />
          <KolomIsian label="Galat" defaultValue="??" galat="Username tidak ditemukan" />
          <KolomIsian label="Nonaktif" defaultValue="terkunci" disabled />
          <Pilihan
            label="Mode accuracy"
            opsi={[
              { nilai: 'terbuka', label: 'Terbuka (Lichess)' },
              { nilai: 'mirip', label: 'Mirip chess.com' },
            ]}
          />
          <Pilihan label="Nonaktif" opsi={[{ nilai: 'x', label: 'Tidak bisa diubah' }]} disabled />
          <Sakelar label="Tampilkan panah" aktif={sakelar} padaUbah={setSakelar} />
          <Sakelar label="Nonaktif" aktif={false} padaUbah={() => undefined} disabled />
        </div>
      </Bagian>

      <Bagian judul="Tab">
        <Tab
          label="Contoh tab"
          item={[
            { kunci: 'ringkasan', label: 'Ringkasan', isi: <p>Panel ringkasan.</p> },
            { kunci: 'langkah', label: 'Langkah', isi: <p>Panel daftar langkah.</p> },
            { kunci: 'grafik', label: 'Grafik', isi: <p>Panel grafik evaluasi.</p> },
          ]}
        />
      </Bagian>

      <Bagian judul="Tabel">
        <Tabel
          judul="Contoh daftar langkah"
          kolom={[
            { kunci: 'langkah', judul: 'Langkah' },
            { kunci: 'label', judul: 'Label' },
            { kunci: 'evaluasi', judul: 'Evaluasi', angka: true },
          ]}
          baris={BARIS_TABEL}
          kunciBaris={(b) => b.langkah}
        />
      </Bagian>

      <Bagian judul="Bilah progres">
        <BilahProgres label="Analisis" nilai={progres} maks={40} />
        <div className="gaya__deret">
          <Tombol
            ukuran="kecil"
            varian="ghost"
            onClick={() => setProgres((p) => Math.max(0, p - 5))}
          >
            −5
          </Tombol>
          <Tombol
            ukuran="kecil"
            varian="ghost"
            onClick={() => setProgres((p) => Math.min(40, p + 5))}
          >
            +5
          </Tombol>
        </div>
      </Bagian>

      <Bagian judul="Dialog dan toast">
        <div className="gaya__deret">
          <Tombol onClick={() => setDialogTerbuka(true)}>Buka dialog</Tombol>
          <Tombol varian="kedua" onClick={() => toast.tampilkan('Analisis selesai', 'sukses')}>
            Toast sukses
          </Tombol>
          <Tombol varian="ghost" onClick={() => toast.tampilkan('Memuat arsip bulan ini', 'info')}>
            Toast info
          </Tombol>
          <Tombol varian="bahaya" onClick={() => toast.tampilkan('Gagal memuat engine', 'galat')}>
            Toast galat
          </Tombol>
        </div>
        <Dialog
          terbuka={dialogTerbuka}
          judul="Analisis ulang?"
          padaTutup={() => setDialogTerbuka(false)}
          aksi={
            <>
              <Tombol varian="ghost" onClick={() => setDialogTerbuka(false)}>
                Batal
              </Tombol>
              <Tombol onClick={() => setDialogTerbuka(false)}>Ya, ulangi</Tombol>
            </>
          }
        >
          <p>Hasil tersimpan akan diganti. Escape menutup dialog.</p>
        </Dialog>
      </Bagian>

      <Bagian judul="Ikon label">
        <ul className="gaya__ikon">
          {DAFTAR_LABEL.map((l) => (
            <li key={l} className="gaya__ikon-item">
              <IkonLabel label={l} ukuran={16} teksAlternatif="" />
              <IkonLabel label={l} ukuran={24} teksAlternatif="" />
              <IkonLabel label={l} ukuran={48} />
              <span>{NAMA_LABEL[l]}</span>
            </li>
          ))}
        </ul>
        <div className="gaya__deret">
          {DAFTAR_LABEL.map((l) => (
            <LencanaLabel key={l} label={l} />
          ))}
        </div>
      </Bagian>

      <Bagian judul="Papan">
        <PapanCatur fen={FEN_AWAL} keterangan="Posisi awal, putih di bawah" id="papan-gaya" />
      </Bagian>
    </div>
  )
}
