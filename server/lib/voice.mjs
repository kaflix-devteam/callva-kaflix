/**
 * GPU voice-model clients for the live AI call demo (LLM / TTS / ASR).
 *
 * Everything that talks to the model servers lives here so the router stays thin:
 *   - getVoiceConfig()   env → urls/model (read lazily; `.env` is loaded by index.mjs)
 *   - probeHealth()      parallel /healthz + model-list check, cached 10 s
 *   - llmChat()          Ollama native /api/chat (think:false, non-streaming)
 *   - synthesize()       POST /v1/tts → WAV buffer + X-* header values
 *   - transcribe()       POST /v1/asr (raw WAV) → text
 *   - buildSystemPrompt() / buildChatMessages() / cleanReply()
 *   - withSlot()         one process-wide semaphore (2 running, 4 queued)
 *
 * Upstream failures are always surfaced as VoiceError(status, koreanMessage);
 * nothing here puts a hostname or a stack trace in a message meant for the browser.
 */
import scenarioData from '../../shared/voiceScenarios.json' with { type: 'json' }

/* ---------- constants ---------- */
export const TIMEOUTS = { health: 3_000, chat: 20_000, tts: 30_000, asr: 15_000 }
export const LIMITS = {
  ttsMaxChars: 300,          // upstream TTS accepts 1–300 chars
  replyMaxChars: 120,        // LLM reply hard cap (TTS time is proportional to reply length)
  replySentences: 2,         // keep at most the first N sentences of a reply
  userTextMaxChars: 1_000,   // one user utterance
  messageMaxChars: 2_000,    // one history message
  historyKeep: 12,           // messages sent to the model
  asrMaxBytes: 8 * 1024 * 1024,
}
const HEALTH_TTL_MS = 10_000
const DEFAULT_MODEL = 'qwen3.5:4b'

export const MESSAGES = {
  disabled: '음성 서버 설정이 없습니다 (VOICE_* env)',
  busy: '음성 데모가 혼잡합니다. 잠시 후 다시 시도해 주세요.',
  llmTimeout: 'AI 응답 시간이 초과되었습니다',
  emptyTranscript: '죄송해요, 잘 못 들었어요. 다시 한 번 말씀해 주시겠어요?',
}

const LABEL = {
  llm: { name: 'AI', timeout: MESSAGES.llmTimeout, connect: 'AI 서버에 연결할 수 없습니다' },
  tts: { name: '음성 합성', timeout: '음성 합성 시간이 초과되었습니다', connect: '음성 합성 서버에 연결할 수 없습니다' },
  asr: { name: '음성 인식', timeout: '음성 인식 시간이 초과되었습니다', connect: '음성 인식 서버에 연결할 수 없습니다' },
}

/* ---------- errors ---------- */
export class VoiceError extends Error {
  /** @param {number} status HTTP status to send @param {string} message Korean, safe for the browser */
  constructor(status, message, cause) {
    super(message, cause ? { cause } : undefined)
    this.name = 'VoiceError'
    this.status = status
  }
}

/* ---------- config (read per call: index.mjs loads .env after this module is evaluated) ---------- */
function envString(key) {
  const v = process.env[key]
  return typeof v === 'string' ? v.trim().replace(/\/+$/, '') : ''
}

export function getVoiceConfig() {
  const llmUrl = envString('VOICE_LLM_URL')
  const ttsUrl = envString('VOICE_TTS_URL')
  const asrUrl = envString('VOICE_ASR_URL')
  const model = envString('VOICE_LLM_MODEL') || DEFAULT_MODEL
  return { configured: Boolean(llmUrl && ttsUrl && asrUrl), llmUrl, ttsUrl, asrUrl, model }
}

/* ---------- scenarios ---------- */
export function getPersona() {
  return { name: scenarioData.persona.name, style: scenarioData.persona.style }
}

/** Public scenario list — explicit field list so `handoff` never leaks. */
export function listScenarios() {
  return scenarioData.scenarios.map(({ id, industry, outbound, title, desc, greeting, facts }) => ({
    id, industry, outbound, title, desc, greeting, facts: [...facts],
  }))
}

export function findScenario(id) {
  if (typeof id !== 'string') return null
  return scenarioData.scenarios.find((s) => s.id === id) ?? null
}

/* ---------- prompt ---------- */
/** Facts as the model should read them: `promptFacts` (numbers/times spelled out in Korean) when present, else the display `facts`. */
export function promptFactsOf(scenario) {
  const pf = scenario.promptFacts
  return Array.isArray(pf) && pf.length > 0 && pf.every((f) => typeof f === 'string' && f.trim()) ? pf : scenario.facts
}

/**
 * Rules come first (small models weight the top of the prompt most), then persona,
 * facts, two few-shot pairs showing the "don't confirm what the facts don't cover" pattern.
 * Replies are forced short: one sentence, ≤ 40 chars — TTS time scales with reply length.
 */
export function buildSystemPrompt(scenario) {
  const { persona } = scenarioData
  const facts = promptFactsOf(scenario)
  return [
    `당신은 "${persona.name}"라는 이름의 AI 전화 상담원입니다. 업종: ${scenario.industry}. 역할: ${scenario.title} — ${scenario.desc}.`,
    '가장 중요한 규칙: 아래 매장 정보 목록에 없는 시간·가격·조건·가능 여부는 절대 말하지 않습니다. 목록에 없는 내용은 담당자가 확인 후 연락드린다고만 안내하고, 예약을 임의로 확정하지 않습니다.',
    '답변은 한 문장, 40자 이내. 확인 질문도 그 한 문장 안에서 합니다. 한국어만 사용하고 영어·중국어·이모지·마크다운·괄호 설명을 쓰지 않으며, 숫자는 한글로 풀어 씁니다(여섯 시, 여덟 명).',
    persona.style,
    '매장 정보:',
    ...facts.map((f) => `- ${f}`),
    '예시:',
    '고객: 토요일 저녁 6시에 8명 룸 되나요?',
    '상담원: 여덟 분 룸은 매장에서 확인 후 연락드릴게요, 성함 알려주시겠어요?',
    '고객: 비용은 얼마예요?',
    '상담원: 비용은 담당자가 확인 후 안내드릴게요, 연락처 알려주시겠어요?',
    scenario.outbound
      ? '이 통화는 우리가 고객에게 먼저 건 아웃바운드 전화입니다. 통화 목적을 먼저 짧게 밝히고 양해를 구하세요.'
      : '이 통화는 고객이 걸어온 인바운드 전화입니다.',
  ].join('\n')
}

/**
 * Validate a client-supplied message list → [{ role, content }].
 * Throws VoiceError(422) with a Korean message on any problem.
 */
export function normalizeMessages(input, field = 'messages') {
  if (input === undefined || input === null) return []
  if (!Array.isArray(input)) throw new VoiceError(422, `${field}는 배열이어야 합니다.`)
  return input.map((m, i) => {
    if (typeof m !== 'object' || m === null || Array.isArray(m)) throw new VoiceError(422, `${field}[${i}]는 { role, content } 객체여야 합니다.`)
    if (m.role !== 'user' && m.role !== 'assistant') throw new VoiceError(422, `${field}[${i}].role은 user 또는 assistant여야 합니다.`)
    if (typeof m.content !== 'string') throw new VoiceError(422, `${field}[${i}].content는 문자열이어야 합니다.`)
    const content = m.content.replace(/\s+/g, ' ').trim()
    if (!content) throw new VoiceError(422, `${field}[${i}].content가 비어 있습니다.`)
    if (content.length > LIMITS.messageMaxChars) throw new VoiceError(422, `${field}[${i}].content는 ${LIMITS.messageMaxChars}자 이내여야 합니다.`)
    return { role: m.role, content }
  })
}

/** Greeting first when the list does not already start with an assistant turn. */
export function withGreeting(scenario, messages) {
  if (messages.length > 0 && messages[0].role === 'assistant') return messages
  return [{ role: 'assistant', content: scenario.greeting }, ...messages]
}

/** Messages actually sent to the model: last N, greeting prepended if needed. */
export function buildChatMessages(scenario, messages) {
  return withGreeting(scenario, messages.slice(-LIMITS.historyKeep))
}

/**
 * Sentence terminator: punctuation, or a polite Korean ending (…요 / …니다) followed by a space/end.
 * The 요-ending is restricted to common verb endings so words like 필요·중요·주요 do not split.
 * A period followed by a digit (6.30) is not a boundary.
 */
const SENTENCE_END_RE = /[.!?。]+(?=\s|$)|(?<=[세어아게네데래려줘봐해되돼가까나지군에예죠]요|니다)(?=\s|$)/g

export function splitSentences(text) {
  const out = []
  let last = 0
  for (const m of text.matchAll(SENTENCE_END_RE)) {
    const end = m.index + m[0].length
    const piece = text.slice(last, end).trim()
    if (piece) out.push(piece)
    last = end
  }
  const rest = text.slice(last).trim()
  if (rest) out.push(rest)
  return out
}

/**
 * Strip <think> remnants / markdown / speaker labels, collapse whitespace,
 * keep only the first `sentences` sentences, then hard-cap at `max` chars.
 */
export function cleanReply(raw, max = LIMITS.replyMaxChars, sentences = LIMITS.replySentences) {
  let s = String(raw ?? '')
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '')   // closed think blocks
  s = s.replace(/^[\s\S]*?<\/think>/i, '')           // stray closing tag → drop everything before it
  s = s.replace(/<think>[\s\S]*$/i, '')              // unclosed opening tag → drop the rest
  s = s.replace(/\*\*?|__|`/g, '')                   // markdown emphasis/code markers
  s = s.replace(/[㐀-䶿一-鿿]+/g, ' ') // CJK ideographs: qwen occasionally code-switches to Chinese mid-sentence
  s = s.replace(/\s*고객\s*[:：][\s\S]*$/, '')         // few-shot format leak: model keeps going with the next "고객:" line
  s = s.replace(/(^|\s)(?:콜바|상담원|AI|assistant)\s*[:：]\s*/gi, '$1') // speaker labels anywhere
  s = s.replace(/\s+([,.!?])/g, '$1').replace(/\s+/g, ' ').trim()

  const parts = splitSentences(s)
  if (parts.length > sentences) s = parts.slice(0, sentences).join(' ')

  if (s.length > max) {
    // prefer dropping whole sentences, then cut at a space, then hard cut
    const first = parts[0] ?? ''
    if (first && first.length <= max) s = first
    else {
      const head = s.slice(0, max)
      const sp = head.lastIndexOf(' ')
      s = (sp > max * 0.6 ? head.slice(0, sp) : head).trim()
    }
  }
  return s
}

/* ---------- semaphore: max 2 model pipelines running, 4 waiting ---------- */
class Semaphore {
  constructor(max, maxQueue) {
    this.max = max
    this.maxQueue = maxQueue
    this.active = 0
    this.waiters = []
  }

  get stats() {
    return { active: this.active, queued: this.waiters.length }
  }

  /** Resolves to a release() function; throws VoiceError(503) synchronously when the queue is full. */
  acquire() {
    if (this.active < this.max) {
      this.active += 1
      return Promise.resolve(this.#releaser())
    }
    if (this.waiters.length >= this.maxQueue) throw new VoiceError(503, MESSAGES.busy)
    return new Promise((resolve) => this.waiters.push(resolve))
  }

  #releaser() {
    let released = false
    return () => {
      if (released) return
      released = true
      const next = this.waiters.shift()
      if (next) next(this.#releaser())      // hand the slot straight to the next waiter
      else this.active -= 1
    }
  }
}

export const pipelineSlots = new Semaphore(2, 4)

/** Run `task` inside one pipeline slot (the whole ASR→LLM→TTS chain counts as one). */
export async function withSlot(task) {
  const release = await pipelineSlots.acquire()
  try {
    return await task()
  } finally {
    release()
  }
}

/* ---------- fetch helpers ---------- */
const now = () => performance.now()
const since = (t0) => Math.round(now() - t0)

function toVoiceError(err, label) {
  if (err instanceof VoiceError) return err
  const name = err?.name ?? err?.cause?.name
  if (name === 'TimeoutError' || name === 'AbortError') return new VoiceError(504, label.timeout, err)
  return new VoiceError(502, label.connect, err)
}

async function upstreamFetch(url, init, timeoutMs, label) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  } catch (err) {
    throw toVoiceError(err, label)
  }
}

async function readJson(res, label) {
  try {
    return await res.json()
  } catch (err) {
    throw toVoiceError(err, label)
  }
}

async function readBuffer(res, label) {
  try {
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    throw toVoiceError(err, label)
  }
}

/** Short, log-only excerpt of an upstream error body (never sent to the browser). */
async function errorExcerpt(res) {
  try {
    return (await res.text()).replace(/\s+/g, ' ').slice(0, 200)
  } catch {
    return ''
  }
}

function upstreamHttpError(res, label, excerpt) {
  console.warn(`[voice] ${label.name} upstream HTTP ${res.status}${excerpt ? `: ${excerpt}` : ''}`)
  return new VoiceError(502, `${label.name} 서버 오류 (HTTP ${res.status})`)
}

const numHeader = (res, name) => {
  const n = Number(res.headers.get(name))
  return Number.isFinite(n) ? n : null
}

/* ---------- health ---------- */
let healthCache = null // { at, promise }

/** Probe LLM/TTS/ASR in parallel (3 s each). The in-flight promise is cached for 10 s. */
export function probeHealth() {
  const t = Date.now()
  if (healthCache && t - healthCache.at < HEALTH_TTL_MS) return healthCache.promise
  const promise = runHealthProbe()
  healthCache = { at: t, promise }
  return promise
}

async function runHealthProbe() {
  const cfg = getVoiceConfig()
  const checkedAt = new Date().toISOString()
  if (!cfg.configured) {
    const off = { ok: false, latencyMs: null, error: MESSAGES.disabled }
    return { enabled: false, llm: { ...off, model: cfg.model }, tts: { ...off }, asr: { ...off }, checkedAt }
  }
  const [llm, tts, asr] = await Promise.all([probeLlm(cfg), probeService(cfg.ttsUrl, LABEL.tts, true), probeService(cfg.asrUrl, LABEL.asr, false)])
  return { enabled: llm.ok && tts.ok, llm, tts, asr, checkedAt }
}

async function probeLlm({ llmUrl, model }) {
  const t0 = now()
  try {
    const res = await upstreamFetch(`${llmUrl}/api/tags`, { method: 'GET' }, TIMEOUTS.health, LABEL.llm)
    if (!res.ok) return { ok: false, model, latencyMs: since(t0), error: `AI 서버 오류 (HTTP ${res.status})` }
    const data = await readJson(res, LABEL.llm)
    const models = Array.isArray(data?.models) ? data.models : []
    const listed = models.some((m) => m?.name === model || m?.model === model)
    if (!listed) return { ok: false, model, latencyMs: since(t0), error: `모델 ${model}이(가) AI 서버에 없습니다` }
    return { ok: true, model, latencyMs: since(t0) }
  } catch (err) {
    return { ok: false, model, latencyMs: since(t0), error: err instanceof VoiceError ? err.message : LABEL.llm.connect }
  }
}

async function probeService(baseUrl, label, withSpeaker) {
  const t0 = now()
  try {
    const res = await upstreamFetch(`${baseUrl}/healthz`, { method: 'GET' }, TIMEOUTS.health, label)
    if (!res.ok) return { ok: false, latencyMs: since(t0), error: `${label.name} 서버 오류 (HTTP ${res.status})` }
    const data = await readJson(res, label)
    const out = { ok: false, latencyMs: since(t0) }
    if (withSpeaker && typeof data?.speaker === 'string') out.speaker = data.speaker
    if (data?.ok !== true) out.error = `${label.name} 서버가 정상 상태가 아닙니다`
    else if (data?.loaded === false) out.error = `${label.name} 모델을 아직 불러오는 중입니다`
    else out.ok = true
    return out
  } catch (err) {
    return { ok: false, latencyMs: since(t0), error: err instanceof VoiceError ? err.message : label.connect }
  }
}

/* ---------- LLM ---------- */
/**
 * @param {{ system: string, messages: {role:string,content:string}[], timeoutMs?: number }} p
 * @returns {Promise<{ reply: string, llmMs: number, evalCount: number, doneReason: string|null }>}
 * `llmMs` is wall-clock around the HTTP call (includes the tunnel), not Ollama's eval_duration.
 */
export async function llmChat({ system, messages, timeoutMs = TIMEOUTS.chat }) {
  const { llmUrl, model } = getVoiceConfig()
  const t0 = now()
  const res = await upstreamFetch(`${llmUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      think: false,                 // mandatory: otherwise qwen3.5 emits long reasoning first
      keep_alive: '15m',            // keep the model resident between demo turns
      options: { num_ctx: 4096, num_predict: 60, temperature: 0.5, repeat_penalty: 1.1 },
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  }, timeoutMs, LABEL.llm)
  if (!res.ok) throw upstreamHttpError(res, LABEL.llm, await errorExcerpt(res))
  const data = await readJson(res, LABEL.llm)
  const reply = cleanReply(typeof data?.message?.content === 'string' ? data.message.content : '')
  if (!reply) throw new VoiceError(502, 'AI 응답이 비어 있습니다. 다시 시도해 주세요.')
  return {
    reply,
    llmMs: since(t0),
    evalCount: Number.isFinite(data?.eval_count) ? data.eval_count : 0,
    doneReason: typeof data?.done_reason === 'string' ? data.done_reason : null,
  }
}

/* ---------- TTS ---------- */
/**
 * @returns {Promise<{ buffer: Buffer, seconds: number|null, elapsedMs: number|null, sampleRate: number|null, contentType: string, ttsMs: number }>}
 */
export async function synthesize(text, { timeoutMs = TIMEOUTS.tts } = {}) {
  const { ttsUrl } = getVoiceConfig()
  const t0 = now()
  const res = await upstreamFetch(`${ttsUrl}/v1/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
    body: JSON.stringify({ text }),
  }, timeoutMs, LABEL.tts)
  if (res.status === 422) {
    console.warn(`[voice] TTS rejected text: ${await errorExcerpt(res)}`)
    throw new VoiceError(422, '음성 합성 입력이 올바르지 않습니다. (1~300자)')
  }
  if (res.status === 503) throw new VoiceError(502, '음성 합성 서버가 아직 준비되지 않았습니다')
  if (!res.ok) throw upstreamHttpError(res, LABEL.tts, await errorExcerpt(res))
  const buffer = await readBuffer(res, LABEL.tts)
  if (buffer.length === 0) throw new VoiceError(502, '음성 합성 결과가 비어 있습니다')
  return {
    buffer,
    seconds: numHeader(res, 'x-audio-seconds'),
    elapsedMs: numHeader(res, 'x-elapsed-ms'),
    sampleRate: numHeader(res, 'x-sample-rate'),
    contentType: res.headers.get('content-type') || 'audio/wav',
    ttsMs: since(t0),
  }
}

/* ---------- ASR ---------- */
/** `RIFF....WAVE` magic — cheap local check before the upstream round trip. */
export function looksLikeWav(buf) {
  return Buffer.isBuffer(buf) && buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WAVE'
}

/**
 * @returns {Promise<{ text: string, audioSeconds: number|null, elapsedMs: number|null, asrMs: number }>}
 */
export async function transcribe(wav, { timeoutMs = TIMEOUTS.asr } = {}) {
  const { asrUrl } = getVoiceConfig()
  const t0 = now()
  const res = await upstreamFetch(`${asrUrl}/v1/asr`, {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: wav,
  }, timeoutMs, LABEL.asr)
  if (res.status === 415) throw new VoiceError(415, '읽을 수 있는 WAV(PCM) 오디오가 아닙니다.')
  if (res.status === 413) throw new VoiceError(413, '오디오가 너무 깁니다. (최대 30초)')
  if (res.status === 422) throw new VoiceError(422, '오디오가 비어 있습니다.')
  if (res.status === 503) throw new VoiceError(502, '음성 인식 서버가 아직 준비되지 않았습니다')
  if (!res.ok) throw upstreamHttpError(res, LABEL.asr, await errorExcerpt(res))
  const data = await readJson(res, LABEL.asr)
  const text = typeof data?.text === 'string' ? data.text.replace(/\s+/g, ' ').trim() : ''
  const num = (v) => (Number.isFinite(v) ? v : null)
  return { text, audioSeconds: num(data?.audio_seconds), elapsedMs: num(data?.elapsed_ms), asrMs: since(t0) }
}
