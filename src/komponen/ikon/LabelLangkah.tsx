import type { ReactNode } from 'react'
import { NAMA_LABEL, type LabelLangkah } from '../../inti/penilaian/label'
import './LabelLangkah.css'

const SIFAT_GARIS = {
  stroke: 'var(--label-tinta)',
  strokeWidth: 2,
  strokeLinejoin: 'miter',
  vectorEffect: 'non-scaling-stroke',
} as const

function Simbol({ teks, ukuran }: { teks: string; ukuran: number }) {
  return (
    <text
      x="20"
      y="21"
      textAnchor="middle"
      dominantBaseline="central"
      className="ikon-label__simbol"
      fontSize={ukuran}
    >
      {teks}
    </text>
  )
}

/** Tanda seru digambar sebagai persegi agar tajam di ukuran kecil (glyph font terbaca seperti "I"). */
function TandaSeru({ posisiX, lebar }: { posisiX: readonly number[]; lebar: number }) {
  return (
    <g fill="var(--label-tinta)">
      {posisiX.map((x) => (
        <g key={x}>
          <rect x={x - lebar / 2} y="9" width={lebar} height="15" />
          <rect x={x - lebar / 2} y="27" width={lebar} height={lebar} />
        </g>
      ))}
    </g>
  )
}

// Geometri dalam viewBox 40x40; setiap label punya bentuk dan simbol berbeda.
const BENTUK: Record<LabelLangkah, ReactNode> = {
  brilliant: (
    <>
      <polygon points="20,2 35.6,11 35.6,29 20,38 4.4,29 4.4,11" {...SIFAT_GARIS} />
      <TandaSeru posisiX={[15.5, 24.5]} lebar={4.5} />
    </>
  ),
  great: (
    <>
      <circle cx="20" cy="20" r="18" {...SIFAT_GARIS} />
      <TandaSeru posisiX={[20]} lebar={5} />
    </>
  ),
  best: (
    <polygon
      points="20,2 24.7,14.5 38.1,15.1 27.6,23.5 31.2,36.4 20,29 8.8,36.4 12.4,23.5 1.9,15.1 15.3,14.5"
      {...SIFAT_GARIS}
    />
  ),
  excellent: (
    <>
      <rect x="3" y="3" width="34" height="34" {...SIFAT_GARIS} />
      <path
        d="M11 20.5 L17.5 27 L29.5 13"
        fill="none"
        stroke="var(--label-tinta)"
        strokeWidth="4.5"
        strokeLinecap="square"
      />
    </>
  ),
  good: (
    <>
      <polygon points="20,2 38.1,15.1 31.2,36.4 8.8,36.4 1.9,15.1" {...SIFAT_GARIS} />
      <circle cx="20" cy="22" r="4.5" fill="var(--label-tinta)" />
    </>
  ),
  book: (
    <>
      <path d="M2 9 L18 7 L20 9 L22 7 L38 9 L38 34 L22 32 L20 34 L18 32 L2 34 Z" {...SIFAT_GARIS} />
      <path
        d="M20 9 V34 M7 14 L15 13 M7 19 L15 18 M7 24 L15 23 M25 13 L33 14 M25 18 L33 19 M25 23 L33 24"
        fill="none"
        stroke="var(--label-tinta)"
        strokeWidth="2"
      />
    </>
  ),
  inaccuracy: (
    <>
      <polygon points="20,2 38,37 2,37" {...SIFAT_GARIS} />
      <text
        x="16.5"
        y="27.5"
        textAnchor="middle"
        dominantBaseline="central"
        className="ikon-label__simbol"
        fontSize={13}
      >
        ?
      </text>
      <g fill="var(--label-tinta)">
        <rect x="22.5" y="19" width="3.5" height="9" />
        <rect x="22.5" y="30" width="3.5" height="3.5" />
      </g>
    </>
  ),
  mistake: (
    <>
      <polygon points="20,1 39,20 20,39 1,20" {...SIFAT_GARIS} />
      <Simbol teks="?" ukuran={17} />
    </>
  ),
  miss: (
    <>
      <polygon
        points="13.5,2 26.5,2 26.5,13.5 38,13.5 38,26.5 26.5,26.5 26.5,38 13.5,38 13.5,26.5 2,26.5 2,13.5 13.5,13.5"
        transform="rotate(45 20 20)"
        {...SIFAT_GARIS}
      />
      <circle cx="20" cy="20" r="6" fill="none" stroke="var(--label-tinta)" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="2" fill="var(--label-tinta)" />
    </>
  ),
  blunder: (
    <>
      <polygon
        points="37.6,27.3 27.3,37.6 12.7,37.6 2.4,27.3 2.4,12.7 12.7,2.4 27.3,2.4 37.6,12.7"
        {...SIFAT_GARIS}
      />
      <Simbol teks="??" ukuran={15} />
    </>
  ),
}

export interface PropsIkonLabel {
  label: LabelLangkah
  ukuran?: number
  /** Teks alternatif; bawaan nama label. Isi '' bila nama sudah tertulis di sebelahnya. */
  teksAlternatif?: string
}

export function IkonLabel({ label, ukuran = 24, teksAlternatif }: PropsIkonLabel) {
  const alt = teksAlternatif ?? NAMA_LABEL[label]
  return (
    <svg
      viewBox="0 0 40 40"
      width={ukuran}
      height={ukuran}
      className={`ikon-label ikon-label--${label}`}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      focusable="false"
    >
      {BENTUK[label]}
    </svg>
  )
}
