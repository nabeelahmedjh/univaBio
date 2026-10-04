/** Credential generators for the admin panel. Uses the Web Crypto API. */

function randInt(max: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

/** "DR-4821" */
export function generateDoctorId(): string {
  return `DR-${1000 + randInt(9000)}`
}

/** 14 chars, no ambiguous characters (0/O, 1/l/I). */
export function generatePassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const symbols = '-_.!'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += i === 4 || i === 9 ? symbols[randInt(symbols.length)] : alphabet[randInt(alphabet.length)]
  }
  return out
}
