export const KUNCI_USERNAME_TERAKHIR = 'telaah.usernameTerakhir'
export const BATAS_USERNAME_TERAKHIR = 5

type Penyimpanan = Pick<Storage, 'getItem' | 'setItem'>

export function bacaUsernameTerakhir(penyimpanan: Penyimpanan | null): string[] {
  try {
    const mentah: unknown = JSON.parse(penyimpanan?.getItem(KUNCI_USERNAME_TERAKHIR) ?? '[]')
    return Array.isArray(mentah)
      ? mentah.filter((u): u is string => typeof u === 'string').slice(0, BATAS_USERNAME_TERAKHIR)
      : []
  } catch {
    return []
  }
}

/** Username terbaru di depan, tanpa duplikat; gagal menyimpan diabaikan. */
export function catatUsername(penyimpanan: Penyimpanan | null, username: string): string[] {
  const baru = [username, ...bacaUsernameTerakhir(penyimpanan).filter((u) => u !== username)].slice(
    0,
    BATAS_USERNAME_TERAKHIR,
  )
  try {
    penyimpanan?.setItem(KUNCI_USERNAME_TERAKHIR, JSON.stringify(baru))
  } catch {
    // localStorage diblokir/penuh: daftar hanya hidup di sesi ini
  }
  return baru
}
