export type PetaToken = Record<string, string>

export interface PasanganKontras {
  depan: string
  belakang: string
  jenis: 'teks' | 'nonteks'
  keterangan: string
}

export interface HasilKontras extends PasanganKontras {
  tema: 'terang' | 'gelap'
  rasio: number
  lulus: boolean
}

// WCAG 2.x: 4.5:1 teks normal (1.4.3), 3:1 komponen non-teks (1.4.11)
export const AMBANG_KONTRAS = { teks: 4.5, nonteks: 3 } as const

const POLA_HEKS = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function hurufKeKanal(heks: string): [number, number, number] {
  const cocok = POLA_HEKS.exec(heks.trim())
  if (!cocok?.[1]) throw new Error(`Warna bukan heks: ${heks}`)
  const isi = cocok[1].length === 3 ? [...cocok[1]].map((h) => h + h).join('') : cocok[1]
  return [0, 2, 4].map((i) => parseInt(isi.slice(i, i + 2), 16) / 255) as [number, number, number]
}

/** Luminans relatif WCAG: kanal sRGB dilinearkan, bobot 0.2126/0.7152/0.0722. */
export function hitungLuminans(heks: string): number {
  const [r, g, b] = hurufKeKanal(heks).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Rasio kontras WCAG: (L1 + 0.05) / (L2 + 0.05), L1 >= L2. */
export function hitungRasioKontras(heksA: string, heksB: string): number {
  const la = hitungLuminans(heksA)
  const lb = hitungLuminans(heksB)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function uraiDeklarasi(isiBlok: string): PetaToken {
  const peta: PetaToken = {}
  for (const cocok of isiBlok.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, nama, nilai] = cocok
    if (nama && nilai) peta[nama] = nilai.trim()
  }
  return peta
}

function ambilBlok(css: string, pola: RegExp, nama: string): string {
  const cocok = pola.exec(css)
  if (!cocok?.[1]) throw new Error(`Blok ${nama} tidak ditemukan di token.css`)
  return cocok[1]
}

export interface TokenTema {
  terang: PetaToken
  gelap: PetaToken
  gelapMedia: PetaToken
}

export function uraiTokenCss(css: string): TokenTema {
  const tanpaKomentar = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const terang = uraiDeklarasi(ambilBlok(tanpaKomentar, /:root\s*\{([^}]*)\}/, ':root'))
  const gelapAtribut = uraiDeklarasi(
    ambilBlok(tanpaKomentar, /:root\[data-tema='gelap'\]\s*\{([^}]*)\}/, "[data-tema='gelap']"),
  )
  const gelapMedia = uraiDeklarasi(
    ambilBlok(
      tanpaKomentar,
      /:root:not\(\[data-tema='terang'\]\)\s*\{([^}]*)\}/,
      'prefers-color-scheme: dark',
    ),
  )
  return {
    terang,
    gelap: { ...terang, ...gelapAtribut },
    gelapMedia: { ...terang, ...gelapMedia },
  }
}

export function selesaikanWarna(token: PetaToken, nama: string, jejak: string[] = []): string {
  if (jejak.includes(nama)) throw new Error(`Rujukan melingkar: ${[...jejak, nama].join(' -> ')}`)
  const nilai = token[nama]
  if (nilai === undefined) throw new Error(`Token ${nama} tidak ada`)
  const rujukan = /^var\((--[\w-]+)\)$/.exec(nilai)
  if (rujukan?.[1]) return selesaikanWarna(token, rujukan[1], [...jejak, nama])
  return nilai
}

const NAMA_LABEL = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'book',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
] as const

export const DAFTAR_PASANGAN: PasanganKontras[] = [
  { depan: '--tinta', belakang: '--latar', jenis: 'teks', keterangan: 'teks utama di latar' },
  { depan: '--tinta', belakang: '--permukaan', jenis: 'teks', keterangan: 'teks utama di kartu' },
  {
    depan: '--tinta-redup',
    belakang: '--latar',
    jenis: 'teks',
    keterangan: 'teks sekunder di latar',
  },
  {
    depan: '--tinta-redup',
    belakang: '--permukaan',
    jenis: 'teks',
    keterangan: 'teks sekunder di kartu',
  },
  {
    depan: '--tinta',
    belakang: '--permukaan-nonaktif',
    jenis: 'teks',
    keterangan: 'teks di bidang nonaktif',
  },
  {
    depan: '--teks-pada-aksen',
    belakang: '--aksen-utama',
    jenis: 'teks',
    keterangan: 'tombol utama',
  },
  {
    depan: '--teks-pada-aksen',
    belakang: '--aksen-kedua',
    jenis: 'teks',
    keterangan: 'tombol kedua',
  },
  {
    depan: '--teks-pada-aksen',
    belakang: '--aksen-ketiga',
    jenis: 'teks',
    keterangan: 'lencana aksen ketiga',
  },
  { depan: '--teks-pada-aksen', belakang: '--bahaya', jenis: 'teks', keterangan: 'tombol bahaya' },
  {
    depan: '--papan-notasi',
    belakang: '--papan-terang',
    jenis: 'teks',
    keterangan: 'notasi kotak terang',
  },
  {
    depan: '--papan-notasi',
    belakang: '--papan-gelap',
    jenis: 'teks',
    keterangan: 'notasi kotak gelap',
  },
  ...NAMA_LABEL.map((label): PasanganKontras => ({
    depan: '--label-tinta',
    belakang: `--label-${label}`,
    jenis: 'teks',
    keterangan: `simbol/teks label ${label}`,
  })),
  {
    depan: '--tinta',
    belakang: '--latar',
    jenis: 'nonteks',
    keterangan: 'border dan bayangan di latar',
  },
  {
    depan: '--tinta',
    belakang: '--permukaan',
    jenis: 'nonteks',
    keterangan: 'border kolom isian di kartu',
  },
  { depan: '--fokus', belakang: '--latar', jenis: 'nonteks', keterangan: 'cincin fokus di latar' },
  {
    depan: '--fokus',
    belakang: '--permukaan',
    jenis: 'nonteks',
    keterangan: 'cincin fokus di kartu',
  },
  {
    depan: '--progres-isi',
    belakang: '--permukaan',
    jenis: 'nonteks',
    keterangan: 'segmen progres terisi vs kosong',
  },
  {
    depan: '--papan-bingkai',
    belakang: '--latar',
    jenis: 'nonteks',
    keterangan: 'bingkai papan di latar',
  },
]

/** Batas ikon label terlihat bila warna isi ATAU border 2px kontras >= 3:1 terhadap latar. */
export function periksaBatasLabel(token: PetaToken, tema: 'terang' | 'gelap'): HasilKontras[] {
  const latar = selesaikanWarna(token, '--latar')
  const tinta = selesaikanWarna(token, '--label-tinta')
  return NAMA_LABEL.map((label) => {
    const isi = selesaikanWarna(token, `--label-${label}`)
    const rasio = Math.max(hitungRasioKontras(isi, latar), hitungRasioKontras(tinta, latar))
    return {
      depan: `--label-${label} / --label-tinta`,
      belakang: '--latar',
      jenis: 'nonteks',
      keterangan: `batas ikon ${label}`,
      tema,
      rasio,
      lulus: rasio >= AMBANG_KONTRAS.nonteks,
    }
  })
}

export function periksaKontras(token: PetaToken, tema: 'terang' | 'gelap'): HasilKontras[] {
  const hasil = DAFTAR_PASANGAN.map((p): HasilKontras => {
    const rasio = hitungRasioKontras(
      selesaikanWarna(token, p.depan),
      selesaikanWarna(token, p.belakang),
    )
    return { ...p, tema, rasio, lulus: rasio >= AMBANG_KONTRAS[p.jenis] }
  })
  return [...hasil, ...periksaBatasLabel(token, tema)]
}
