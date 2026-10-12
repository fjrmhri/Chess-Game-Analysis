import { useMemo, useState } from 'react'
import type { Permainan, Posisi } from '../../inti/data/tipe'
import { DAFTAR_LABEL, NAMA_LABEL } from '../../inti/penilaian/label'
import type { HasilPenilaian } from '../../inti/penilaian/penilaianPermainan'
import { buatPgnBeranotasi } from '../../inti/pgn/pgnBeranotasi'
import { LencanaLabel } from '../../komponen/ikon/LencanaLabel'
import { Tabel } from '../../komponen/ui/Tabel'
import { Tombol } from '../../komponen/ui/Tombol'
import { salinTeks, unduhTeks } from '../../pembantu/unduhBerkas'
import { awalDariFen, kelompokkanPerLangkah, type SelLangkah } from './tampilanLabel'
import './BagianPenilaian.css'

function SelLabel({ sel }: { sel: SelLangkah | undefined }) {
  if (!sel) return <span className="teks-redup">–</span>
  return (
    <span className="bagian-penilaian__sel">
      <span className="teks-mono">{sel.san}</span>
      <LencanaLabel label={sel.label.label} />
      <span className="teks-mono teks-redup">
        {sel.label.poinHilang > 0 ? `−${sel.label.poinHilang.toFixed(3)}` : '0.000'}
      </span>
    </span>
  )
}

export function BagianPenilaian({
  permainan,
  posisi,
  penilaian,
}: {
  permainan: Permainan
  posisi: readonly Posisi[]
  penilaian: HasilPenilaian
}) {
  const [status, setStatus] = useState<string | null>(null)
  const saya = permainan.warnaSaya
  const judulPutih = `Putih: ${permainan.namaPutih}${saya === 'putih' ? ' (Anda)' : ''}`
  const judulHitam = `Hitam: ${permainan.namaHitam}${saya === 'hitam' ? ' (Anda)' : ''}`
  const baris = useMemo(() => kelompokkanPerLangkah(penilaian.label, posisi), [penilaian, posisi])

  const pgn = useMemo(() => {
    const awal = awalDariFen(posisi.find((p) => p.ply === 0)?.fen ?? '')
    const sanPer = new Map(posisi.map((p) => [p.ply, p.langkahSan]))
    return buatPgnBeranotasi({
      pgnAsli: permainan.pgn,
      langkah: penilaian.label.map((l) => ({
        ply: l.ply,
        langkahSan: sanPer.get(l.ply) ?? l.langkahUci,
        label: l.label,
        poinHilang: l.poinHilang,
        langkahTerbaik: l.langkahTerbaik,
      })),
      nomorAwal: awal.nomor,
      giliranAwal: awal.giliran,
      versiAlgoritma: penilaian.versiAlgoritma,
      akurasi: penilaian.akurasi,
    })
  }, [permainan, posisi, penilaian])

  async function salin() {
    setStatus(
      (await salinTeks(pgn)) ? 'PGN disalin.' : 'Gagal menyalin; salin manual dari kotak di bawah.',
    )
  }

  return (
    <section className="bagian-penilaian">
      <h4>Penilaian MVP ({penilaian.versiAlgoritma})</h4>
      <Tabel
        judul="Ringkasan per pemain"
        kolom={[
          { kunci: 'ukuran', judul: '' },
          { kunci: 'putih', judul: judulPutih, angka: true },
          { kunci: 'hitam', judul: judulHitam, angka: true },
        ]}
        baris={[
          {
            ukuran: 'Akurasi Telaah (mode Terbuka)',
            putih: penilaian.akurasi.putih?.toFixed(1) ?? '–',
            hitam: penilaian.akurasi.hitam?.toFixed(1) ?? '–',
          },
          {
            ukuran: 'Akurasi chess.com (API)',
            putih: permainan.akurasiChessCom?.putih.toFixed(1) ?? 'tidak ada',
            hitam: permainan.akurasiChessCom?.hitam.toFixed(1) ?? 'tidak ada',
          },
          ...DAFTAR_LABEL.filter(
            (l) =>
              penilaian.ringkasan.putih[l] !== undefined ||
              penilaian.ringkasan.hitam[l] !== undefined,
          ).map((l) => ({
            ukuran: NAMA_LABEL[l],
            putih: penilaian.ringkasan.putih[l] ?? 0,
            hitam: penilaian.ringkasan.hitam[l] ?? 0,
          })),
        ]}
        kunciBaris={(b) => String(b.ukuran)}
      />

      <Tabel
        judul="Label per langkah"
        kolom={[
          { kunci: 'nomor', judul: '#', angka: true },
          { kunci: 'putih', judul: judulPutih },
          { kunci: 'hitam', judul: judulHitam },
        ]}
        baris={baris.map((b) => ({
          nomor: b.nomor,
          putih: <SelLabel sel={b.putih} />,
          hitam: <SelLabel sel={b.hitam} />,
        }))}
        kunciBaris={(b) => String(b.nomor)}
      />

      <div className="bagian-penilaian__pgn">
        <p>
          PGN beranotasi: label Telaah sebagai komentar <code>{'{Label | hilang …}'}</code> dan
          simbol NAG (!!, !, ?!, ?, ??), untuk dibandingkan dengan Game Review chess.com.
        </p>
        <div className="poc__aksi">
          <Tombol onClick={() => void salin()}>Salin PGN</Tombol>
          <Tombol varian="kedua" onClick={() => unduhTeks(`telaah-${permainan.id}.pgn`, pgn)}>
            Unduh PGN
          </Tombol>
        </div>
        {status && (
          <p role="status" className="teks-mono">
            {status}
          </p>
        )}
        <details>
          <summary>Lihat PGN</summary>
          <textarea
            className="bagian-penilaian__teks teks-mono"
            readOnly
            value={pgn}
            rows={12}
            aria-label="PGN beranotasi"
          />
        </details>
      </div>
    </section>
  )
}
