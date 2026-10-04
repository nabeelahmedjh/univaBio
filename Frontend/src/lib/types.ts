/**
 * Shared domain types. These mirror the API contract in the design spec (§12).
 * Keep them in sync with the backend.
 */

export type Role = 'doctor' | 'admin'

export interface DoctorProfile {
  id: string
  name: string
  doctorId: string
  specialty?: string
}

export interface DoctorLoginInput {
  doctorId: string
  password: string
}

export interface DoctorLoginResponse {
  token: string
  doctor: DoctorProfile
}

export interface AdminLoginInput {
  username: string
  password: string
}

export interface AdminLoginResponse {
  token: string
}

export interface DoctorOverview {
  totalPatients: number
  totalSessions: number
  weekSessions: number
  /** Sessions per day for the current week, Monday → Sunday (length 7). */
  weekByDay: number[]
  todaySessions: number
}

export interface PatientListItem {
  id: string
  name: string
  sessionCount: number
  /** ISO timestamp, or null if the patient has no sessions yet. */
  lastSessionAt: string | null
}

export interface Patient {
  id: string
  name: string
  doctorName: string
}

export interface SessionSummary {
  id: string
  /** ISO timestamp */
  date: string
  durationSec: number
  title: string
  /** Optional one-line excerpt for the timeline. */
  excerpt?: string
}

export interface SessionDetail {
  id: string
  date: string
  markdown: string
  title?: string
  durationSec?: number
}

export type SessionStatus = 'processing' | 'ready' | 'failed'

export interface CreateSessionResponse {
  sessionId: string
  status: SessionStatus
}

export interface NewDoctorInput {
  name: string
  doctorId: string
  password: string
  email?: string
  specialty?: string
}

export interface AdminDoctor {
  id: string
  name: string
  doctorId: string
  specialty?: string
  email?: string
  createdAt: string
  active?: boolean
}

export interface RequestAccessInput {
  name: string
  email: string
  clinic: string
  message?: string
}
