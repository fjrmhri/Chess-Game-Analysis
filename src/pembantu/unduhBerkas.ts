/** Menyalin teks ke clipboard; false bila browser menolak (izin, konteks tidak aman). */
export async function salinTeks(teks: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(teks)
    return true
  } catch {
    return false
  }
}

export function unduhTeks(
  namaBerkas: string,
  teks: string,
  tipe = 'application/x-chess-pgn',
): void {
  const url = URL.createObjectURL(new Blob([teks], { type: `${tipe};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = namaBerkas
  document.body.append(a)
  a.click()
  a.remove()
  // Dilepas belakangan agar unduhan sempat dimulai
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
