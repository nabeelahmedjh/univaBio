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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', 'application/json')
  const token = getToken()
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

export const httpApi: ContinuoApi = {
  loginDoctor: (input) =>
    request('/auth/doctor/login', { method: 'POST', body: JSON.stringify(input) }),
  loginAdmin: (input) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(input) }),

  getDoctorOverview: () => request('/doctor/overview'),
  getDoctorPatients: () => request('/doctor/patients'),

  getPatient: (id) => request(`/patients/${enc(id)}`),
  getPatientSessions: (id) => request(`/patients/${enc(id)}/sessions`),
  getSession: (sessionId) => request(`/sessions/${enc(sessionId)}`),
  createSession: uploadSession,
  getSessionStatus: (sessionId) => request(`/sessions/${enc(sessionId)}/status`),

  getDoctors: () => request('/admin/doctors'),
  createDoctor: (input) => request('/admin/doctors', { method: 'POST', body: JSON.stringify(input) }),
  setDoctorActive: (id, active) =>
    request(`/admin/doctors/${enc(id)}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  resetDoctorPassword: (id) => request(`/admin/doctors/${enc(id)}/reset-password`, { method: 'POST' }),

  requestAccess: (input) => request('/access-requests', { method: 'POST', body: JSON.stringify(input) }),
}

export const api: ContinuoApi = USE_MOCK ? mockApi : httpApi
