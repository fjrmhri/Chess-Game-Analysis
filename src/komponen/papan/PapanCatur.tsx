import { Chessboard, type PieceRenderObject } from 'react-chessboard'
import './PapanCatur.css'

const KODE_BIDAK = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'] as const
const SET_BIDAK = 'chessnut'

function buatBidak(): PieceRenderObject {
  const dasar = import.meta.env.BASE_URL
  return Object.fromEntries(
    KODE_BIDAK.map((kode) => [
      kode,
      () => (
        <img
          src={`${dasar}bidak/${SET_BIDAK}/${kode}.svg`}
          alt=""
          draggable={false}
          className="papan-catur__bidak"
        />
      ),
    ]),
  )
}

const BIDAK = buatBidak()

export interface PropsPapanCatur {
  fen: string
  keterangan: string
  orientasi?: 'white' | 'black'
  id?: string
}

export function PapanCatur({
  fen,
  keterangan,
  orientasi = 'white',
  id = 'papan',
}: PropsPapanCatur) {
  return (
    <figure className="papan-catur">
      <div className="papan-catur__bingkai" role="img" aria-label={keterangan}>
        <Chessboard
          options={{
            id,
            position: fen,
            boardOrientation: orientasi,
            pieces: BIDAK,
            allowDragging: false,
            allowDrawingArrows: false,
            lightSquareStyle: { backgroundColor: 'var(--papan-terang)' },
            darkSquareStyle: { backgroundColor: 'var(--papan-gelap)' },
            lightSquareNotationStyle: { color: 'var(--papan-notasi)' },
            darkSquareNotationStyle: { color: 'var(--papan-notasi)' },
            alphaNotationStyle: {
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--ukuran-xs)',
              fontWeight: 700,
              position: 'absolute',
              bottom: 1,
              right: 3,
              userSelect: 'none',
            },
            numericNotationStyle: {
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--ukuran-xs)',
              fontWeight: 700,
              position: 'absolute',
              top: 1,
              left: 3,
              userSelect: 'none',
            },
          }}
        />
      </div>
      <figcaption className="papan-catur__keterangan">{keterangan}</figcaption>
    </figure>
  )
}
