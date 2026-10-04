/** React Query hooks around the API layer. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { NewDoctorInput } from './types'

export const qk = {
  overview: ['doctor', 'overview'] as const,
  patients: ['doctor', 'patients'] as const,
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
  })
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: qk.session(sessionId ?? ''),
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60_000,
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
