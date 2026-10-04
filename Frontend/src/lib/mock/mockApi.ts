/**
 * In-browser mock backend implementing `ContinuoApi`.
 *
 * - Data is seeded relative to "now" and persisted in localStorage so new
 *   sessions/doctors survive a refresh. Call `resetMockDb()` from the console
 *   (window.__continuoResetMock) to start fresh.
 * - Every call has a small randomised latency so loading states are visible.
 *
 * Demo credentials:  Doctor  DR-2048 / continuo     Admin  admin / continuo
 */
import type { ContinuoApi } from '../api'
import { AUTH_ENABLED } from '../config'
import { ApiError } from '../errors'
import { getAuth } from '../token'
import { startOfDay, startOfWeek } from '../format'
import type { AdminDoctor, PatientListItem, SessionSummary } from '../types'
import { ADMIN_CREDENTIALS, SEED_DOCTORS, SEED_PATIENTS, TOPICS, buildMarkdown } from './data'

const KEY = 'continuo.mock.v1'
const RESEED_AFTER_MS = 3 * 86_400_000
const PROCESSING_MS = 9000

interface DbDoctor extends AdminDoctor {
  password: string
}
interface DbPatient {
  id: string
  name: string
  doctorId: string // internal doctor id (doc_1)
}
interface DbSession {
  id: string
  patientId: string
  date: string
  durationSec: number
  title: string
  excerpt: string
  markdown: string
  readyAt: number
}
interface Db {
  seededAt: number
  doctors: DbDoctor[]
  patients: DbPatient[]
  sessions: DbSession[]
}

/* ─── utilities ─────────────────────────────────────────────── */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const latency = () => sleep(350 + Math.random() * 450)
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`

/* ─── seed ──────────────────────────────────────────────────── */

function seed(): Db {
  const rand = mulberry32(20261003)
  const now = new Date()
  const doctors: DbDoctor[] = SEED_DOCTORS.map((d, i) => ({
    ...d,
    active: true,
    createdAt: new Date(now.getTime() - (220 - i * 37) * 86_400_000).toISOString(),
  }))
  const main = doctors[0]
  const patients: DbPatient[] = SEED_PATIENTS.map((p) => ({ id: p.id, name: p.name, doctorId: main.id }))
  const sessions: DbSession[] = []

  // Most recent session offsets (hours ago) to guarantee "today" and "this week" data.
  const recentOffsetsH = [0.8, 2.6, 26, 50, 74, 98]

  SEED_PATIENTS.forEach((p, pi) => {
    let cursor = new Date(now)
    for (let s = 0; s < p.sessions; s++) {
      if (s === 0) {
        const off = recentOffsetsH[pi] ?? 24 * (5 + Math.floor(rand() * 30))
        cursor = new Date(now.getTime() - off * 3_600_000)
        if (pi >= recentOffsetsH.length) cursor.setHours(9 + Math.floor(rand() * 8), Math.floor(rand() * 4) * 15)
      } else {
        cursor = new Date(cursor.getTime() - (12 + Math.floor(rand() * 30)) * 86_400_000)
        cursor.setHours(9 + Math.floor(rand() * 8), Math.floor(rand() * 4) * 15, 0, 0)
      }
      const topic = TOPICS[Math.floor(rand() * TOPICS.length)]
      sessions.push({
        id: `ses_${p.id.slice(3)}_${s}`,
        patientId: p.id,
        date: cursor.toISOString(),
        durationSec: 60 * (12 + Math.floor(rand() * 28)) + Math.floor(rand() * 60),
        title: topic.title,
        excerpt: topic.excerpt,
        markdown: buildMarkdown(topic, { patientName: p.name, doctorName: main.name, date: cursor }),
        readyAt: 0,
      })
    }
  })

  return { seededAt: Date.now(), doctors, patients, sessions }
}

/* ─── persistence ───────────────────────────────────────────── */

let db: Db = load()

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Db
      if (Date.now() - parsed.seededAt < RESEED_AFTER_MS) return parsed
    }
  } catch {
    /* ignore */
  }
  const fresh = seed()
  save(fresh)
  return fresh
}

function save(next: Db = db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
}

export function resetMockDb() {
  db = seed()
  save()
}

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__continuoResetMock = resetMockDb
}

/* ─── helpers ───────────────────────────────────────────────── */

function currentDoctor(): DbDoctor {
  const auth = getAuth()
  const byAuth = auth?.doctor && db.doctors.find((d) => d.id === auth.doctor!.id)
  return byAuth || db.doctors[0]
}

function readySessions() {
  const now = Date.now()
  return db.sessions.filter((s) => s.readyAt <= now)
}

function findPatient(id: string): DbPatient {
  const p = db.patients.find((x) => x.id.toLowerCase() === id.trim().toLowerCase())
  if (!p) throw new ApiError("We couldn't find that ID. Please check with your doctor's office.", 404, 'not_found')
  return p
}

function publicDoctor(d: DbDoctor): AdminDoctor {
  const { password: _pw, ...rest } = d
  void _pw
  return rest
}

function genPassword() {
  const words = ['linen', 'cedar', 'harbor', 'meadow', 'amber', 'willow', 'sage', 'ivory', 'quill', 'fern']
  const w = () => words[Math.floor(Math.random() * words.length)]
  return `${w()}-${w()}-${Math.floor(100 + Math.random() * 900)}`
}

/* ─── API ───────────────────────────────────────────────────── */

export const mockApi: ContinuoApi = {
  async loginDoctor({ doctorId, password }) {
    await sleep(900 + Math.random() * 500)
    const d = db.doctors.find((x) => x.doctorId.toLowerCase() === doctorId.trim().toLowerCase())
    // Auth is not enforced yet: any password works for a known Doctor ID.
    const passwordOk = !AUTH_ENABLED || d?.password === password
    if (!d || !passwordOk || d.active === false) {
      throw new ApiError("That ID or password isn't right.", 401, 'invalid_credentials')
    }
    return {
      token: `mock.${uid('tok')}`,
      doctor: { id: d.id, name: d.name, doctorId: d.doctorId, specialty: d.specialty },
    }
  },

  async loginAdmin({ username, password }) {
    await sleep(900 + Math.random() * 500)
    const passwordOk = !AUTH_ENABLED || password === ADMIN_CREDENTIALS.password
    if (username.trim() !== ADMIN_CREDENTIALS.username || !passwordOk) {
      throw new ApiError("That username or password isn't right.", 401, 'invalid_credentials')
    }
    return { token: `mock.${uid('adm')}` }
  },

  async getDoctorOverview() {
    await latency()
    const doc = currentDoctor()
    const myPatients = new Set(db.patients.filter((p) => p.doctorId === doc.id).map((p) => p.id))
    const mine = readySessions().filter((s) => myPatients.has(s.patientId))
    const now = new Date()
    const weekStart = startOfWeek(now).getTime()
    const dayStart = startOfDay(now).getTime()
    const weekByDay = [0, 0, 0, 0, 0, 0, 0]
    let todaySessions = 0
    for (const s of mine) {
      const t = new Date(s.date).getTime()
      if (t >= weekStart && t < weekStart + 7 * 86_400_000) {
        weekByDay[(new Date(s.date).getDay() + 6) % 7]++
      }
      if (t >= dayStart) todaySessions++
    }
    return {
      totalPatients: myPatients.size,
      totalSessions: mine.length,
      weekSessions: weekByDay.reduce((a, b) => a + b, 0),
      weekByDay,
      todaySessions,
    }
  },

  async getDoctorPatients() {
    await latency()
    const doc = currentDoctor()
    const sessions = readySessions()
    return db.patients
      .filter((p) => p.doctorId === doc.id)
      .map<PatientListItem>((p) => {
        const mine = sessions.filter((s) => s.patientId === p.id)
        const last = mine.reduce<string | null>((acc, s) => (!acc || s.date > acc ? s.date : acc), null)
        return { id: p.id, name: p.name, sessionCount: mine.length, lastSessionAt: last }
      })
      .sort((a, b) => (b.lastSessionAt ?? '').localeCompare(a.lastSessionAt ?? ''))
  },

  async getPatient(id) {
    await latency()
    const p = findPatient(id)
    const doc = db.doctors.find((d) => d.id === p.doctorId) ?? db.doctors[0]
    return { id: p.id, name: p.name, doctorName: doc.name }
  },

  async getPatientSessions(id) {
    await latency()
    const p = findPatient(id)
    return readySessions()
      .filter((s) => s.patientId === p.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map<SessionSummary>((s) => ({
        id: s.id,
        date: s.date,
        durationSec: s.durationSec,
        title: s.title,
        excerpt: s.excerpt,
      }))
  },

  async getSession(sessionId) {
    await sleep(300 + Math.random() * 400)
    const s = db.sessions.find((x) => x.id === sessionId)
    if (!s) throw new ApiError('This session could not be found.', 404, 'not_found')
    return { id: s.id, date: s.date, markdown: s.markdown, title: s.title, durationSec: s.durationSec }
  },

  async createSession({ patientId, audio, durationSec }, opts = {}) {
    const p = findPatient(patientId)
    // Simulated upload progress, roughly proportional to file size.
    const steps = 24
    const total = Math.min(4200, 1200 + audio.size / 4000)
    for (let i = 1; i <= steps; i++) {
      if (opts.signal?.aborted) throw new ApiError('Upload cancelled.', 0, 'aborted')
      await sleep(total / steps)
      opts.onProgress?.(i / steps)
    }
    const doc = db.doctors.find((d) => d.id === p.doctorId) ?? db.doctors[0]
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
    const date = new Date()
    const est = durationSec ?? Math.max(60, Math.round(audio.size / 16000)) // ~128kbps
    const session: DbSession = {
      id: uid('ses'),
      patientId: p.id,
      date: date.toISOString(),
      durationSec: Math.round(est),
      title: topic.title,
      excerpt: topic.excerpt,
      markdown: buildMarkdown(topic, { patientName: p.name, doctorName: doc.name, date }),
      readyAt: Date.now() + PROCESSING_MS,
    }
    db.sessions.push(session)
    save()
    return { sessionId: session.id, status: 'processing' }
  },

  async getSessionStatus(sessionId) {
    await sleep(150)
    const s = db.sessions.find((x) => x.id === sessionId)
    if (!s) return { status: 'failed' }
    return { status: Date.now() >= s.readyAt ? 'ready' : 'processing' }
  },

  async getDoctors() {
    await latency()
    return [...db.doctors].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicDoctor)
  },

  async createDoctor(input) {
    await sleep(700 + Math.random() * 400)
    if (db.doctors.some((d) => d.doctorId.toLowerCase() === input.doctorId.trim().toLowerCase())) {
      throw new ApiError('That Doctor ID is already in use. Try regenerating it.', 409, 'conflict')
    }
    const doctor: DbDoctor = {
      id: uid('doc'),
      name: input.name.trim(),
      doctorId: input.doctorId.trim().toUpperCase(),
      password: input.password,
      email: input.email || undefined,
      specialty: input.specialty || undefined,
      createdAt: new Date().toISOString(),
      active: true,
    }
    db.doctors.push(doctor)
    save()
    return { doctor: publicDoctor(doctor) }
  },

  async setDoctorActive(id, active) {
    await latency()
    const d = db.doctors.find((x) => x.id === id)
    if (!d) throw new ApiError('Doctor not found.', 404)
    d.active = active
    save()
    return { doctor: publicDoctor(d) }
  },

  async resetDoctorPassword(id) {
    await latency()
    const d = db.doctors.find((x) => x.id === id)
    if (!d) throw new ApiError('Doctor not found.', 404)
    d.password = genPassword()
    save()
    return { password: d.password }
  },

  async requestAccess() {
    await sleep(900)
    return { ok: true }
  },
}
