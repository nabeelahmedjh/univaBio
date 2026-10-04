/**
 * Runtime configuration, driven by Vite env variables (see `.env.example`).
 *
 * VITE_API_URL       Base URL of the real backend, e.g. http://localhost:8000
 * VITE_USE_MOCK      "true" | "false". Defaults to true when VITE_API_URL is empty.
 * VITE_AUTH_ENABLED  "true" | "false". When false (default for now), protected
 *                    routes are open and a demo doctor identity is used.
 */

const env = import.meta.env

export const API_URL: string = (env.VITE_API_URL ?? '').replace(/\/$/, '')

export const USE_MOCK: boolean =
  env.VITE_USE_MOCK != null ? env.VITE_USE_MOCK === 'true' : API_URL === ''

export const AUTH_ENABLED: boolean = env.VITE_AUTH_ENABLED === 'true'

/** Max upload size shown in the dropzone and enforced client-side. */
export const MAX_UPLOAD_MB = 200
export const LARGE_FILE_WARN_MB = 80

export const ACCEPTED_AUDIO = ['.mp3', '.wav', '.m4a', '.webm', '.ogg']
export const ACCEPTED_AUDIO_MIME = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/webm',
  'audio/ogg',
  'video/webm',
]

/** How often the processing screen polls /sessions/:id/status. */
export const STATUS_POLL_MS = 3000

/**
 * Show an extra verification field on /patient (DOB / PIN). The UI slot exists;
 * flip this on once the backend supports a second factor.
 */
export const PATIENT_SECOND_FACTOR = env.VITE_PATIENT_SECOND_FACTOR === 'true'
