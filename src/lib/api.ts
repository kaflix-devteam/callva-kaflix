/**
 * Browser-side API client. The contract here is the single source of truth:
 * `server/index.mjs` must accept/return exactly these shapes.
 */

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...init,
  })
  const text = await res.text()
  const body = text ? safeJson(text) : null
  if (!res.ok) {
    const msg = (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string')
      ? body.error
      : `요청에 실패했습니다 (${res.status})`
    throw new ApiError(msg, res.status, body)
  }
  return body as T
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text) } catch { return text }
}

/* ---------- Contact / 도입 문의 ---------- */

export interface ContactPayload {
  name: string
  phone: string
  storeName?: string
  storeType?: string
  message?: string
  referral?: string
  wantsAiCall: boolean
  privacyAgreed: boolean
  /** where the form was submitted from, e.g. 'home' | 'contact' */
  source?: string
}

export interface ContactResponse {
  ok: true
  id: string
  receivedAt: string
}

export function submitContact(payload: ContactPayload) {
  return request<ContactResponse>('/api/contact', { method: 'POST', body: JSON.stringify(payload) })
}

/* ---------- Consultation / 무료 진단 ---------- */

export interface ConsultationPayload {
  /** questionId -> selected option id */
  answers: Record<string, string>
  estimate?: {
    monthlyCalls: number
    missedCalls: number
    estimatedLossKrw: number
    recommendedPlan: 'pro' | 'business' | 'scale'
    monthlyFeeKrw: number
  }
}

export interface ConsultationResponse {
  ok: true
  id: string
  receivedAt: string
}

export function submitConsultation(payload: ConsultationPayload) {
  return request<ConsultationResponse>('/api/consultation', { method: 'POST', body: JSON.stringify(payload) })
}

/* ---------- Status page / 실시간 서비스 상태 ---------- */

export type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance'

export interface StatusService {
  id: 'api' | 'call-infra'
  name: string
  status: ServiceStatus
  lastCheckedAt: string
  responseMs: number | null
}

export interface StatusPage {
  overall: ServiceStatus
  uptime24h: number
  operationalServices: string
  avgResponseMs: number
  services: StatusService[]
  updatedAt: string
  statusUrl: string
}

export function fetchStatusPage() {
  return request<StatusPage>('/api/status-page')
}

export const statusLabel: Record<ServiceStatus, string> = {
  operational: '정상 운영',
  degraded: '성능 저하',
  outage: '장애',
  maintenance: '점검 중',
}
