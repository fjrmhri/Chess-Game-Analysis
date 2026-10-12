import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { uraiFilter } from '../fitur/daftarPermainan/filterPermainan'
import { namaBulan } from '../fitur/daftarPermainan/formatPermainan'
import { PanelDaftar } from '../fitur/daftarPermainan/PanelDaftar'
import { useRiwayatPemain } from '../fitur/daftarPermainan/useRiwayatPemain'
import { BilahProgres } from '../komponen/ui/BilahProgres'
import { KartuKeadaan } from '../komponen/ui/KartuKeadaan'
import { Tombol } from '../komponen/ui/Tombol'
import './HalamanDaftarPermainan.css'

export function HalamanDaftarPermainan() {
  const { username = '' } = useParams()
  return <IsiDaftar key={username} username={username} />
}

function IsiDaftar({ username }: { username: string }) {
  const riwayat = useRiwayatPemain(username)
  const [query] = useSearchParams()
  const bulanDipilih = uraiFilter(query).bulan
  const { muatBulanTertentu, bulanDimuat, bulanArsip, memuat } = riwayat

  // Filter bulan yang belum dimuat: ambil bulan itu
  useEffect(() => {
    if (
      bulanDipilih &&
      bulanArsip?.includes(bulanDipilih) &&
      !bulanDimuat.has(bulanDipilih) &&
      !memuat
    ) {
      muatBulanTertentu(bulanDipilih)
    }
  }, [bulanDipilih, bulanArsip, bulanDimuat, memuat, muatBulanTertentu])

  const belumAdaData =
    riwayat.bulanArsip === null || (riwayat.memuat && riwayat.permainan.length === 0)

  return (
    <div className="halaman-daftar">
      <header className="halaman-daftar__kepala">
        <h1>{username}</h1>
        <p className="teks-redup">
          Riwayat game dari arsip publik chess.com.{' '}
          {riwayat.bulanArsip &&
            `${riwayat.bulanDimuat.size} dari ${riwayat.bulanArsip.length} bulan dimuat.`}{' '}
          <Link to="/">Ganti username</Link>
        </p>
        <Tombol varian="ghost" ukuran="kecil" onClick={riwayat.perbarui} disabled={riwayat.memuat}>
          Perbarui dari chess.com
        </Tombol>
      </header>

      {riwayat.memuat && (
        <BilahProgres
          label="Memuat arsip bulanan"
          nilai={riwayat.kemajuan.selesai}
          maks={Math.max(1, riwayat.kemajuan.total)}
        />
      )}

      {riwayat.galat && (
        <KartuKeadaan
          jenis="galat"
          judul="Gagal memuat riwayat"
          aksi={<Tombol onClick={riwayat.cobaLagi}>Coba lagi</Tombol>}
        >
          <p>{riwayat.galat}</p>
        </KartuKeadaan>
      )}

      {belumAdaData && !riwayat.galat ? (
        <KartuKeadaan jenis="memuat" judul="Memuat riwayat">
          <p>Mengambil daftar arsip dan bulan terbaru secara berurutan.</p>
        </KartuKeadaan>
      ) : riwayat.bulanArsip && riwayat.bulanArsip.length === 0 ? (
        <KartuKeadaan jenis="kosong" judul="Belum ada game">
          <p>Akun ini belum punya arsip game publik.</p>
        </KartuKeadaan>
      ) : riwayat.bulanArsip ? (
        <>
          <PanelDaftar
            permainan={riwayat.permainan}
            sudahDianalisis={riwayat.sudahDianalisis}
            bulanArsip={riwayat.bulanArsip}
          />
          {riwayat.sisaBulan > 0 && (
            <div className="halaman-daftar__lebih">
              <Tombol varian="kedua" onClick={riwayat.muatLebihLama} disabled={riwayat.memuat}>
                Muat bulan lebih lama
              </Tombol>
              <span className="teks-redup teks-mono">
                {riwayat.sisaBulan} bulan tersisa
                {riwayat.bulanArsip.find((b) => !riwayat.bulanDimuat.has(b)) &&
                  ` · berikutnya ${namaBulan(riwayat.bulanArsip.find((b) => !riwayat.bulanDimuat.has(b)) ?? '')}`}
              </span>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
