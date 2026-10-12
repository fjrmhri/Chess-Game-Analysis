import { useCallback, useEffect, useRef, useState } from 'react'
import { GalatChesscom } from '../../inti/chesscom/galat'
import { ambilKlienChesscom } from '../../inti/chesscom/klienBawaan'
import { ambilBasisData } from '../../inti/data/basisDataBawaan'
import type { Permainan } from '../../inti/data/tipe'
import { VERSI_ALGORITMA } from '../../inti/penilaian/konfigurasiPenilaian'
import { kunciBulanDariArsip } from './formatPermainan'
import { ambilArsipTerbaruDulu, ambilStatusAnalisis, muatBulan } from './muatRiwayat'

// KEPUTUSAN P8-K2: muat otomatis sampai >= 20 game atau 3 bulan
const TARGET_GAME_AWAL = 20
const BATAS_BULAN_AWAL = 3

export interface RiwayatPemain {
  /** Kunci bulan "YYYY-MM", terbaru dulu; null = belum dimuat. */
  bulanArsip: string[] | null
  bulanDimuat: ReadonlySet<string>
  permainan: Permainan[]
  sudahDianalisis: ReadonlySet<string>
  memuat: boolean
  kemajuan: { selesai: number; total: number }
  galat: string | null
  sisaBulan: number
  muatLebihLama: () => void
  muatBulanTertentu: (kunci: string) => void
  cobaLagi: () => void
  /** Ambil ulang daftar arsip dan bulan terbaru dari jaringan (melewati cache 12 jam). */
  perbarui: () => void
}

function pesanGalat(e: unknown): string {
  return e instanceof GalatChesscom || e instanceof Error ? e.message : String(e)
}

/** State awal kosong: pemakai memberi key={username} agar ganti username = state baru. */
export function useRiwayatPemain(username: string): RiwayatPemain {
  const [arsip, setArsip] = useState<string[] | null>(null)
  const [bulanDimuat, setBulanDimuat] = useState<ReadonlySet<string>>(new Set())
  const [permainan, setPermainan] = useState<Map<string, Permainan>>(new Map())
  const [sudah, setSudah] = useState<ReadonlySet<string>>(new Set())
  const [memuat, setMemuat] = useState(true)
  const [kemajuan, setKemajuan] = useState({ selesai: 0, total: 0 })
  const [galat, setGalat] = useState<string | null>(null)
  const [percobaan, setPercobaan] = useState(0)
  const pengendali = useRef<AbortController | null>(null)
  const dimuatRef = useRef(new Set<string>())
  // K2 P3: ambil ulang dari jaringan hanya lewat aksi manual "Perbarui"
  const segarkanRef = useRef(false)

  const tambahkan = useCallback(
    async (kunci: string, url: string, signal: AbortSignal, abaikanCache = false) => {
      const db = ambilBasisData()
      const baru = await muatBulan(ambilKlienChesscom(), db, username, url, signal, abaikanCache)
      const status = await ambilStatusAnalisis(
        db,
        baru.map((p) => p.id),
        VERSI_ALGORITMA,
      )
      dimuatRef.current.add(kunci)
      setBulanDimuat(new Set(dimuatRef.current))
      setPermainan((lama) => {
        const m = new Map(lama)
        for (const p of baru) m.set(p.id, p)
        return m
      })
      setSudah((lama) => new Set([...lama, ...status]))
      return baru.length
    },
    [username],
  )

  useEffect(() => {
    const p = new AbortController()
    pengendali.current?.abort()
    pengendali.current = p
    const segarkan = segarkanRef.current
    segarkanRef.current = false
    void (async () => {
      try {
        const daftar = await ambilArsipTerbaruDulu(
          ambilKlienChesscom(),
          username,
          p.signal,
          segarkan,
        )
        setArsip(daftar)
        const target = daftar.slice(0, BATAS_BULAN_AWAL)
        let jumlah = 0
        for (const [i, url] of target.entries()) {
          setKemajuan({ selesai: i, total: target.length })
          jumlah += await tambahkan(kunciBulanDariArsip(url), url, p.signal, segarkan && i === 0)
          if (jumlah >= TARGET_GAME_AWAL) break
        }
        setKemajuan({ selesai: target.length, total: target.length })
      } catch (e) {
        if (!p.signal.aborted) setGalat(pesanGalat(e))
      } finally {
        if (!p.signal.aborted) setMemuat(false)
      }
    })()
    return () => p.abort()
  }, [username, percobaan, tambahkan])

  const muatUrl = useCallback(
    (url: string) => {
      const kunci = kunciBulanDariArsip(url)
      if (dimuatRef.current.has(kunci)) return
      const p = pengendali.current
      if (!p) return
      setMemuat(true)
      setGalat(null)
      setKemajuan({ selesai: 0, total: 1 })
      tambahkan(kunci, url, p.signal)
        .then(() => setKemajuan({ selesai: 1, total: 1 }))
        .catch((e: unknown) => {
          if (!p.signal.aborted) setGalat(pesanGalat(e))
        })
        .finally(() => {
          if (!p.signal.aborted) setMemuat(false)
        })
    },
    [tambahkan],
  )

  const urlBerikut = arsip?.find((u) => !bulanDimuat.has(kunciBulanDariArsip(u)))

  return {
    bulanArsip: arsip?.map(kunciBulanDariArsip) ?? null,
    bulanDimuat,
    permainan: [...permainan.values()],
    sudahDianalisis: sudah,
    memuat,
    kemajuan,
    galat,
    sisaBulan: arsip ? arsip.filter((u) => !bulanDimuat.has(kunciBulanDariArsip(u))).length : 0,
    muatLebihLama: () => {
      if (urlBerikut) muatUrl(urlBerikut)
    },
    muatBulanTertentu: (kunci) => {
      const url = arsip?.find((u) => kunciBulanDariArsip(u) === kunci)
      if (url) muatUrl(url)
    },
    perbarui: () => {
      segarkanRef.current = true
      setGalat(null)
      setMemuat(true)
      setPercobaan((n) => n + 1)
    },
    cobaLagi: () => {
      setGalat(null)
      setMemuat(true)
      setPercobaan((n) => n + 1)
    },
  }
}
