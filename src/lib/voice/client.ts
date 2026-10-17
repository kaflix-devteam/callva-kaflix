/**
 * Typed fetch wrappers for the live AI-call API (`/api/voice/*`).
 * Contract is frozen with the server team — keep shapes in sync with server/.
 *
 * All helpers throw `VoiceApiError` (Korean message, HTTP status, `reachable`
 * flag). A network failure / 404 means the route is not up yet → callers treat
 * the feature as disabled rather than crashing.
 */
import { arrayBufferToBase64 } from './wav'

export class VoiceApiError extends Error {
  status: number
  /** false → network error / route missing (API or tunnel down) */
  reachable: boolean
  constructor(message: string, status: number, reachable: boolean) {
    super(message)
    this.name = 'VoiceApiError'
    this.status = status
    this.reachable = reachable
  }
}

/* ---------- shapes ---------- */

export interface VoiceHealth {
  enabled: boolean
  llm: { ok: boolean; model?: string; latencyMs?: number; error?: string }
  tts: { ok: boolean; latencyMs?: number; speaker?: string; error?: string }
  asr: { ok: boolean; latencyMs?: number; error?: string }
  checkedAt: string
}

export interface VoiceScenario {
  id: string
  industry: string
  outbound: boolean
  title: string
  desc: string
  greeting: string
  facts: string[]
  handoff?: string
}

export interface VoiceScenariosResponse {
  persona: { name: string; style: string }
  scenarios: VoiceScenario[]
}

export type VoiceRole = 'user' | 'assistant'
export interface VoiceHistoryItem {
  role: VoiceRole
  content: string
}

export interface VoiceTurnRequest {
  scenarioId: string
  text?: string
  /** base64 of a WAV file (≤ 8 MB, ≤ 30 s) — exactly one of text / audioBase64 */
  audioBase64?: string
  history?: VoiceHistoryItem[]
}

export interface VoiceTimings {
  asrMs?: number
  llmMs: number
  ttsMs?: number
  totalMs: number
  ttsError?: string
}

export interface VoiceAudio {
  base64: string
  mime: string
  seconds: number
}

export interface VoiceTurnResponse {
  transcript: string
  reply: string
  audio: VoiceAudio | null
  timings: VoiceTimings
  history: VoiceHistoryItem[]
}

export interface VoiceTtsResult {
  base64: string
  mime: string
  seconds: number
  elapsedMs: number
}

/* ---------- internals ---------- */

const GENERIC_ERROR = '음성 서버 요청에 실패했습니다.'
const UNREACHABLE_ERROR = 'GPU 서버 터널이 꺼져 있거나 API가 준비 중입니다.'

function extractError(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string') {
    return (body as { error: string }).error
  }
  return `${GENERIC_ERROR} (${status})`
}

async function doFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new VoiceApiError(UNREACHABLE_ERROR, 0, false)
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await doFetch(path, {
    ...init,
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers ?? {}) },
  })
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    // 404 = the voice routes are not mounted (yet) → same as unreachable.
    if (res.status === 404) throw new VoiceApiError(UNREACHABLE_ERROR, 404, false)
    throw new VoiceApiError(extractError(body, res.status), res.status, true)
  }
  if (body === null || typeof body !== 'object') {
    throw new VoiceApiError('음성 서버 응답 형식이 올바르지 않습니다.', res.status, true)
  }
  return body as T
}

/* ---------- public API ---------- */

/** GET /api/voice/health — throws VoiceApiError(reachable=false) if the route is missing. */
export function fetchVoiceHealth(signal?: AbortSignal): Promise<VoiceHealth> {
  return requestJson<VoiceHealth>('/api/voice/health', { signal, cache: 'no-store' })
}

/** GET /api/voice/scenarios */
export function fetchVoiceScenarios(signal?: AbortSignal): Promise<VoiceScenariosResponse> {
  return requestJson<VoiceScenariosResponse>('/api/voice/scenarios', { signal })
}

/** POST /api/voice/turn — one text OR audio turn; returns reply + optional WAV. */
export function postVoiceTurn(body: VoiceTurnRequest, signal?: AbortSignal): Promise<VoiceTurnResponse> {
  return requestJson<VoiceTurnResponse>('/api/voice/turn', {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  })
}

/** POST /api/voice/tts — returns the WAV body (as base64 so the player has one input form). */
export async function fetchVoiceTts(text: string, signal?: AbortSignal): Promise<VoiceTtsResult> {
  const res = await doFetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/wav, application/json' },
    body: JSON.stringify({ text }),
    signal,
  })
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok || contentType.includes('application/json')) {
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    if (res.status === 404) throw new VoiceApiError(UNREACHABLE_ERROR, 404, false)
    throw new VoiceApiError(extractError(body, res.status), res.status || 500, true)
  }
  const buffer = await res.arrayBuffer()
  if (buffer.byteLength === 0) throw new VoiceApiError('음성 합성 결과가 비어 있습니다.', res.status, true)
  return {
    base64: arrayBufferToBase64(buffer),
    mime: contentType.split(';')[0]?.trim() || 'audio/wav',
    seconds: Number(res.headers.get('x-audio-seconds') ?? 0) || 0,
    elapsedMs: Number(res.headers.get('x-elapsed-ms') ?? 0) || 0,
  }
}

/** Human-readable reason why live calling is unavailable (null if it is available). */
export function describeVoiceUnavailable(health: VoiceHealth | null, error: unknown): string | null {
  if (error) {
    if (error instanceof VoiceApiError && !error.reachable) {
      return 'GPU 서버 터널이 꺼져 있거나 API가 준비 중입니다. `npm run tunnel`'
    }
    return error instanceof Error && error.message ? error.message : '상태 확인에 실패했습니다.'
  }
  if (!health) return '상태를 확인하는 중입니다.'
  if (health.enabled) return null
  if (!health.llm?.ok) return health.llm?.error ? `언어 모델 서버 응답 없음 (${health.llm.error})` : '언어 모델 서버 응답 없음'
  if (!health.tts?.ok) return health.tts?.error ? `음성 합성 서버 응답 없음 (${health.tts.error})` : '음성 합성 서버 응답 없음'
  return 'GPU 서버가 아직 준비되지 않았습니다.'
}

/** "qwen3.5:4b · Qwen3-TTS · Qwen3-ASR" style one-liner for the header. */
export function describeVoiceModels(health: VoiceHealth | null): string {
  if (!health) return ''
  const parts = [health.llm?.model || 'LLM', health.tts?.speaker ? `Qwen3-TTS (${health.tts.speaker})` : 'Qwen3-TTS', 'Qwen3-ASR']
  return parts.join(' · ')
}
