/**
 * Token storage.
 *
 * The token lives in memory first. Because there is no httpOnly-cookie support
 * on the backend yet, it is mirrored to sessionStorage so a page refresh does
 * not sign the user out.
 *
 * ⚠️ SECURITY: Web storage is readable by any script on the page, so an XSS
 * bug could leak the token. Once the backend can set an httpOnly, Secure,
 * SameSite cookie, remove the sessionStorage mirror below and rely on the
 * cookie (requests already send `credentials: 'include'`).
 */
import type { DoctorProfile, Role } from './types'

const KEY = 'continuo.auth'

export interface StoredAuth {
  role: Role
  token: string
  doctor?: DoctorProfile
}

let memory: StoredAuth | null = read()

function read(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredAuth) : null
  } catch {
    return null
  }
}

export function getAuth(): StoredAuth | null {
  return memory
}

export function getToken(): string | null {
  return memory?.token ?? null
}

export function setAuth(auth: StoredAuth | null) {
  memory = auth
  try {
    if (auth) sessionStorage.setItem(KEY, JSON.stringify(auth))
    else sessionStorage.removeItem(KEY)
  } catch {
    /* storage unavailable (private mode): memory only */
  }
}
