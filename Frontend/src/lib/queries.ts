/** React Query hooks around the API layer. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { STATUS_POLL_MS } from './config'
import type { NewDoctorInput } from './types'

export const qk = {
  overview: ['doctor', 'overview'] as const,
  patients: ['doctor', 'patients'] as const,
  doctorSessions: ['doctor', 'sessions'] as const,
  patient: (id: string) => ['patient', id] as const,
  patientSessions: (id: string) => ['patient', id, 'sessions'] as const,
  session: (id: string) => ['session', id] as const,
  doctors: ['admin', 'doctors'] as const,
}

export function useDoctorOverview() {
  return useQuery({ queryKey: qk.overview, queryFn: api.getDoctorOverview })
}

export function useDoctorPatients() {
  return useQuery({ queryKey: qk.patients, queryFn: api.getDoctorPatients })
}

/** Recent sessions for the dashboard timeline; polls while any is processing. */
export function useDoctorSessions() {
  return useQuery({
    queryKey: qk.doctorSessions,
    queryFn: api.getDoctorSessions,
    refetchInterval: (q) =>
      q.state.data?.some((s) => s.status === 'processing') ? STATUS_POLL_MS : false,
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: qk.patient(id ?? ''),
    queryFn: () => api.getPatient(id!),
    enabled: !!id,
    retry: false,
  })
}

export function usePatientSessions(id: string | undefined) {
  return useQuery({
    queryKey: qk.patientSessions(id ?? ''),
    queryFn: () => api.getPatientSessions(id!),
    enabled: !!id,
    retry: false,
    // Keep the timeline live while a session is still being prepared.
    refetchInterval: (q) =>
      q.state.data?.some((s) => s.status === 'processing') ? STATUS_POLL_MS : false,
  })
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: qk.session(sessionId ?? ''),
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60_000,
    // Poll until the report is ready so the reader fills in automatically.
    refetchInterval: (q) => (q.state.data?.status === 'processing' ? STATUS_POLL_MS : false),
  })
}

export function useDoctors() {
  return useQuery({ queryKey: qk.doctors, queryFn: api.getDoctors })
}

export function useCreateDoctor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NewDoctorInput) => api.createDoctor(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.doctors }),
  })
}
