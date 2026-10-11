/**
 * Continuo API layer.
 *
 * `api` is the single entry point used by the UI. It is backed either by the
 * real HTTP client (`httpApi`, matching the contract in the design spec §12)
 * or by an in-browser mock (`mockApi`) when `USE_MOCK` is true.
 *
 * To switch to the real backend set `VITE_API_URL` in `.env.local`.
 */
import { API_URL, USE_MOCK } from './config'
import { ApiError } from './errors'
import { getToken } from './token'
import { mockApi } from './mock/mockApi'
import type {
  ActivitySession,
  AdminDoctor,
  AdminLoginInput,
  AdminLoginResponse,
  CreateSessionResponse,
  DoctorLoginInput,
  DoctorLoginResponse,
  DoctorOverview,
  NewDoctorInput,
  Patient,
  PatientListItem,
  RequestAccessInput,
  SessionDetail,
  SessionStatus,
  SessionSummary,
} from './types'

export { ApiError }

export interface UploadOptions {
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

export interface CreateSessionInput {
  patientId: string
  /** Optional name used only when the backend auto-creates a new patient. */
  patientName?: string
  audio: File | Blob
  /** Optional, known for live recordings. */
  durationSec?: number
}

export interface ContinuoApi {
  // Auth
  loginDoctor(input: DoctorLoginInput): Promise<DoctorLoginResponse>
  loginAdmin(input: AdminLoginInput): Promise<AdminLoginResponse>
  // Doctor
  getDoctorOverview(): Promise<DoctorOverview>
  getDoctorPatients(): Promise<PatientListItem[]>
  getDoctorSessions(): Promise<ActivitySession[]>
  // Patients & sessions
  getPatient(patientId: string): Promise<Patient>
  getPatientSessions(patientId: string): Promise<SessionSummary[]>
  getSession(sessionId: string): Promise<SessionDetail>
  createSession(input: CreateSessionInput, opts?: UploadOptions): Promise<CreateSessionResponse>
  getSessionStatus(sessionId: string): Promise<{ status: SessionStatus }>
  // Admin
  getDoctors(): Promise<AdminDoctor[]>
  createDoctor(input: NewDoctorInput): Promise<{ doctor: AdminDoctor }>
  /** Stretch: PATCH /admin/doctors/:id { active } */
  setDoctorActive(id: string, active: boolean): Promise<{ doctor: AdminDoctor }>
  /** Stretch: POST /admin/doctors/:id/reset-password -> { password } */
  resetDoctorPassword(id: string): Promise<{ password: string }>
  // Public
  /** Not in the original contract: POST /access-requests */
  requestAccess(input: RequestAccessInput): Promise<{ ok: true }>
}

/* ──────────────────────────────────────────────────────────────
   HTTP implementation
   ────────────────────────────────────────────────────────────── */

async function request<T>(path: string, init: RequestInit = {}, authToken?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', 'application/json')
  const token = authToken ?? getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      // Lets the backend use an httpOnly session cookie if it supports it.
      credentials: 'include',
    })
  } catch {
    throw new ApiError('We could not reach Continuo. Please check your connection.', 0, 'network')
  }

  if (!res.ok) {
    let message = res.statusText || 'Something went wrong.'
    let code: string | undefined
    try {
      const body = await res.json()
      message = body.message ?? body.detail ?? message
      code = body.code
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status, code)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

const enc = encodeURIComponent

/** Multipart upload with progress (fetch has no upload progress, so use XHR). */
function uploadSession(input: CreateSessionInput, opts: UploadOptions = {}): Promise<CreateSessionResponse> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('patientId', input.patientId)
    if (input.patientName) form.append('patientName', input.patientName)
    const filename =
      input.audio instanceof File ? input.audio.name : `session-${input.patientId}-${Date.now()}.webm`
    form.append('audio', input.audio, filename)
    if (input.durationSec != null) form.append('durationSec', String(Math.round(input.durationSec)))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/sessions`)
    xhr.withCredentials = true
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Accept', 'application/json')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new ApiError('Unexpected response from the server.', xhr.status))
        }
      } else {
        let message = 'The upload did not complete.'
        try {
          const body = JSON.parse(xhr.responseText)
          message = body.message ?? body.detail ?? message
        } catch {
          /* ignore */
        }
        reject(new ApiError(message, xhr.status))
      }
    }
    xhr.onerror = () => reject(new ApiError('The upload was interrupted. Please try again.', 0, 'network'))
    xhr.onabort = () => reject(new ApiError('Upload cancelled.', 0, 'aborted'))
    opts.signal?.addEventListener('abort', () => xhr.abort())
    xhr.send(form)
  })
}

/* ── Backend DTOs (snake_case) and adapters to the UI's camelCase types ── */

interface BkToken {
  access_token: string
  token_type: string
  role: string
}
interface BkDoctor {
  id: number
  username: string
  name: string
  specialty?: string | null
  active?: boolean
  created_at: string
}
interface BkPatientSummary {
  phone: string
  name: string
  session_count: number
  last_visit?: string | null
}
interface BkPatient {
  id: number
  phone: string
  name: string
  doctor_id: number
  doctor_name?: string | null
}
interface BkSession {
  id: number
  patient_id: number
  title?: string | null
  transcript: string
  duration_sec?: number | null
  occurred_at: string
  created_at: string
  report_status: string
  report_markdown?: string | null
  report_error?: string | null
}
interface BkHistory {
  patient: BkPatient
  sessions: BkSession[]
}
interface BkActivity {
  id: number
  patientId: string
  patientName: string
  title: string
  date: string
  status: SessionStatus
  durationSec?: number | null
}

function excerptFrom(s: BkSession): string | undefined {
  const md = s.report_markdown
  if (md) {
    const m = md.match(/##\s*Summary\s*\n+([^\n#]+)/i)
    if (m) return m[1].trim().slice(0, 160)
  }
  const t = (s.transcript || '').replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, 160) : undefined
}

/** Map the backend's internal report_status to the UI's processing/ready/failed. */
function statusFrom(reportStatus: string): SessionStatus {
  if (reportStatus === 'processing') return 'processing'
  if (reportStatus === 'error') return 'failed'
  return 'ready'
}

function toAdminDoctor(d: BkDoctor): AdminDoctor {
  return {
    id: String(d.id),
    name: d.name,
    doctorId: d.username,
    specialty: d.specialty ?? undefined,
    createdAt: d.created_at,
    active: d.active !== false,
  }
}

export const httpApi: ContinuoApi = {
  async loginDoctor({ doctorId, password }) {
    const tok = await request<BkToken>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role: 'doctor', identifier: doctorId, password }),
    })
    const me = await request<BkDoctor>('/doctors/me', {}, tok.access_token)
    return {
      token: tok.access_token,
      doctor: { id: String(me.id), name: me.name, doctorId: me.username, specialty: me.specialty ?? undefined },
    }
  },

  async loginAdmin({ username, password }) {
    const tok = await request<BkToken>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role: 'super_admin', identifier: username, password }),
    })
    return { token: tok.access_token }
  },

  getDoctorOverview: () => request('/doctors/me/overview'),

  async getDoctorSessions() {
    const rows = await request<BkActivity[]>('/doctors/me/sessions')
    return rows.map<ActivitySession>((s) => ({
      id: String(s.id),
      patientId: s.patientId,
      patientName: s.patientName,
      title: s.title,
      date: s.date,
      status: s.status,
      durationSec: s.durationSec ?? undefined,
    }))
  },

  async getDoctorPatients() {
    const rows = await request<BkPatientSummary[]>('/doctors/me/patients')
    return rows.map<PatientListItem>((p) => ({
      id: p.phone,
      name: p.name,
      sessionCount: p.session_count,
      lastSessionAt: p.last_visit ?? null,
    }))
  },

  async getPatient(id) {
    const p = await request<BkPatient>(`/patients/${enc(id)}`)
    return { id: p.phone, name: p.name, doctorName: p.doctor_name ?? '' }
  },

  async getPatientSessions(id) {
    const h = await request<BkHistory>(`/patients/${enc(id)}/history`)
    return h.sessions.map<SessionSummary>((s) => ({
      id: String(s.id),
      date: s.occurred_at,
      durationSec: s.duration_sec ?? 0,
      title: s.title ?? 'Session',
      excerpt: excerptFrom(s),
      status: statusFrom(s.report_status),
    }))
  },

  async getSession(sessionId) {
    const s = await request<BkSession>(`/sessions/${enc(sessionId)}`)
    return {
      id: String(s.id),
      date: s.occurred_at,
      markdown: s.report_markdown ?? '',
      title: s.title ?? 'Session',
      durationSec: s.duration_sec ?? undefined,
      status: statusFrom(s.report_status),
    }
  },

  createSession: uploadSession,

  getSessionStatus: (sessionId) => request(`/sessions/${enc(sessionId)}/status`),

  async getDoctors() {
    const rows = await request<BkDoctor[]>('/admin/doctors')
    return rows.map(toAdminDoctor)
  },

  async createDoctor(input) {
    const d = await request<BkDoctor>('/admin/doctors', {
      method: 'POST',
      body: JSON.stringify({
        username: input.doctorId,
        name: input.name,
        specialty: input.specialty ?? null,
        password: input.password,
      }),
    })
    return { doctor: toAdminDoctor(d) }
  },

  async setDoctorActive(id, active) {
    const d = await request<BkDoctor>(`/admin/doctors/${enc(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    })
    return { doctor: toAdminDoctor(d) }
  },

  resetDoctorPassword: (id) => request(`/admin/doctors/${enc(id)}/reset-password`, { method: 'POST' }),

  requestAccess: (input) => request('/access-requests', { method: 'POST', body: JSON.stringify(input) }),
}

export const api: ContinuoApi = USE_MOCK ? mockApi : httpApi
