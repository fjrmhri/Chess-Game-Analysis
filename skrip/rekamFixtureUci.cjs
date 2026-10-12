// Merekam output UCI nyata untuk fixture tes parser
const fs = require('fs')
const sf = require(process.argv[2] + '/node_modules/stockfish')
const kasus = [
  ['mat-putih', '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', 'go nodes 20000', 2],
  ['mat-hitam-kalah', '6k1/5ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1', 'go nodes 20000', 1],
  [
    'hitam-melangkah',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    'go nodes 30000',
    2,
  ],
  [
    'multipv-batas',
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    'go nodes 100000',
    2,
  ],
  ['hitam-akan-dimat', 'k7/8/1K6/8/8/8/8/2Q5 b - - 0 1', 'go nodes 20000', 1],
  ['posisi-dimat', 'R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1', 'go nodes 1000', 1],
]
let i = 0
let buf = []
const e = sf('lite-single', (l) => {
  buf.push(l)
  if (/^bestmove/.test(l)) {
    const [nama] = kasus[i]
    fs.writeFileSync(
      process.argv[3] + '/' + nama + '.txt',
      buf.filter((x) => /^(info|bestmove)/.test(x)).join('\n') + '\n',
    )
    buf = []
    i++
    if (i < kasus.length) jalan()
    else e.terminate()
  }
})
function jalan() {
  const [, fen, go, mpv] = kasus[i]
  e.processCommand('ucinewgame')
  e.processCommand(`setoption name MultiPV value ${mpv}`)
  e.processCommand(`position fen ${fen}`)
  e.processCommand(go)
}
e.processCommand('uci')
e.processCommand('isready')
jalan()
