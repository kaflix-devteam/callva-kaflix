/**
 * Voice-model clients for the live AI call demo. Each service has two providers:
 *
 *   LLM : openai  POST /chat/completions          | qwen  Ollama /api/chat on the GPU server
 *   TTS : openai  POST /audio/speech (wav)         | qwen  POST /v1/tts
 *   ASR : openai  POST /audio/transcriptions       | qwen  POST /v1/asr
 *
 * Provider per service comes from VOICE_{LLM,TTS,ASR}_PROVIDER (openai|qwen); the default is
 * openai when OPENAI_API_KEY is set, else qwen. There is NO automatic cross-provider fallback —
 * a failing provider surfaces as a 502/504 whose message names the provider.
 *
 *   - getVoiceConfig()       env → providers / models / readiness (read lazily; index.mjs loads .env)
 *   - probeHealth()          openai /models + qwen /healthz probes in parallel, cached 10 s
 *   - llmChat / synthesize / transcribe   dispatchers → llmOpenai|llmQwen, ttsOpenai|ttsQwen, asrOpenai|asrQwen
 *   - getVoiceOptions / resolveVoice / ttsParams   personas + speeds from shared/voicePersonas.json
 *   - buildSystemPrompt / buildChatMessages / cleanReply
 *   - withSlot()             one process-wide semaphore (2 running, 4 queued)
 *
 * Nothing here puts a hostname, an API key or a stack trace in a message meant for the browser.
 */
import scenarioData from '../../shared/voiceScenarios.json' with { type: 'json' }
import personaData from '../../shared/voicePersonas.json' with { type: 'json' }

/* ---------- constants ---------- */
export const TIMEOUTS = { health: 3_000, chat: 20_000, tts: 30_000, asr: 15_000 }
export const LIMITS = {
  ttsMaxChars: 300,          // qwen TTS accepts 1–300 chars (openai allows more; we keep one limit)
  replyMaxChars: 120,        // LLM reply hard cap (TTS time is proportional to reply length)
  replySentences: 2,         // keep at most the first N sentences of a reply
  userTextMaxChars: 1_000,   // one user utterance
  messageMaxChars: 2_000,    // one history message
  historyKeep: 12,           // messages sent to the model
  asrMaxBytes: 8 * 1024 * 1024,
}
const HEALTH_TTL_MS = 10_000
const PROVIDERS = new Set(['openai', 'qwen'])
const DEFAULTS = {
  qwenModel: 'qwen3.5:4b',
  openaiBase: 'https://api.openai.com/v1',
  openaiTts: 'gpt-4o-mini-tts',
  openaiLlm: 'gpt-4.1-mini',
  openaiAsr: 'gpt-4o-mini-transcribe',
}
const SPEED_MIN = 0.5
const SPEED_MAX = 2.0

export const MESSAGES = {
  disabled: '음성 서버 설정이 없습니다 (VOICE_* / OPENAI_API_KEY env)',
  asrDisabled: '음성 인식 설정이 없습니다 (VOICE_ASR_URL 또는 OPENAI_API_KEY env)',
  busy: '음성 데모가 혼잡합니다. 잠시 후 다시 시도해 주세요.',
  llmTimeout: 'AI 응답 시간이 초과되었습니다',
  emptyTranscript: '죄송해요, 잘 못 들었어요. 다시 한 번 말씀해 주시겠어요?',
}

const LABEL = {
  llm: { name: 'AI', timeout: MESSAGES.llmTimeout, connect: 'AI 서버에 연결할 수 없습니다' },
  tts: { name: '음성 합성', timeout: '음성 합성 시간이 초과되었습니다', connect: '음성 합성 서버에 연결할 수 없습니다' },
  asr: { name: '음성 인식', timeout: '음성 인식 시간이 초과되었습니다', connect: '음성 인식 서버에 연결할 수 없습니다' },
  openai: { name: 'OpenAI', timeout: 'OpenAI 응답 시간이 초과되었습니다', connect: 'OpenAI에 연결할 수 없습니다' },
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

const warnedProviderKeys = new Set()
function providerFromEnv(key, fallback) {
  const v = envString(key).toLowerCase()
  if (!v) return fallback
  if (PROVIDERS.has(v)) return v
  if (!warnedProviderKeys.has(key)) {
    warnedProviderKeys.add(key)
    console.warn(`[voice] ${key}="${v}" is not openai|qwen — using "${fallback}"`)
  }
  return fallback
}

/**
 * @returns {{
 *   providers: { llm: 'openai'|'qwen', tts: 'openai'|'qwen', asr: 'openai'|'qwen' },
 *   models: { llm: string, tts: string|null, asr: string|null },
 *   ready: { llm: boolean, tts: boolean, asr: boolean },
 *   configured: boolean,   // llm + tts usable → model routes enabled (asr missing → text input only)
 *   llmUrl, ttsUrl, asrUrl, qwenModel, openaiKey, openaiBase
 * }}
 * `openaiKey` is for request headers only — never log or return this object as a whole.
 */
export function getVoiceConfig() {
  const llmUrl = envString('VOICE_LLM_URL')
  const ttsUrl = envString('VOICE_TTS_URL')
  const asrUrl = envString('VOICE_ASR_URL')
  const qwenModel = envString('VOICE_LLM_MODEL') || DEFAULTS.qwenModel
  const openaiKey = (process.env.OPENAI_API_KEY ?? '').trim()
  const openaiBase = envString('OPENAI_BASE_URL') || DEFAULTS.openaiBase
  const fallback = openaiKey ? 'openai' : 'qwen'
  const providers = {
    llm: providerFromEnv('VOICE_LLM_PROVIDER', fallback),
    tts: providerFromEnv('VOICE_TTS_PROVIDER', fallback),
    asr: providerFromEnv('VOICE_ASR_PROVIDER', fallback),
  }
  const models = {
    llm: providers.llm === 'openai' ? envString('OPENAI_LLM_MODEL') || DEFAULTS.openaiLlm : qwenModel,
    tts: providers.tts === 'openai' ? envString('OPENAI_TTS_MODEL') || DEFAULTS.openaiTts : null, // qwen: reported by /healthz
    asr: providers.asr === 'openai' ? envString('OPENAI_ASR_MODEL') || DEFAULTS.openaiAsr : null,
  }
  const ready = {
    llm: providers.llm === 'openai' ? Boolean(openaiKey) : Boolean(llmUrl),
    tts: providers.tts === 'openai' ? Boolean(openaiKey) : Boolean(ttsUrl),
    asr: providers.asr === 'openai' ? Boolean(openaiKey) : Boolean(asrUrl),
  }
  return { providers, models, ready, configured: ready.llm && ready.tts, llmUrl, ttsUrl, asrUrl, qwenModel, openaiKey, openaiBase }
}

/* ---------- scenarios ---------- */
export function getPersona() {
  return { name: scenarioData.persona.name, style: scenarioData.persona.style }
}

/** Public scenario list — explicit field list so `handoff` / `promptFacts` never leak. */
export function listScenarios() {
  return scenarioData.scenarios.map(({ id, industry, outbound, title, desc, greeting, facts }) => ({
    id, industry, outbound, title, desc, greeting, facts: [...facts],
  }))
}

export function findScenario(id) {
  if (typeof id !== 'string') return null
  return scenarioData.scenarios.find((s) => s.id === id) ?? null
}

/* ---------- voice personas + speeds (shared/voicePersonas.json) ---------- */
export function findVoicePersona(id) {
  if (typeof id !== 'string') return null
  return personaData.personas.find((p) => p.id === id) ?? null
}

export function findSpeed(id) {
  if (typeof id !== 'string') return null
  return personaData.speeds.find((s) => s.id === id) ?? null
}

/** Public persona list for the UI — explicit mapping so `style` / `instructions` never leak. */
export function getVoiceOptions(cfg = getVoiceConfig()) {
  const provider = cfg.providers.tts
  return {
    default: personaData.default,
    speeds: personaData.speeds.map(({ id, label, factor }) => ({ id, label, factor })),
    personas: personaData.personas.map((p) => ({
      id: p.id, name: p.name, tagline: p.tagline, sample: p.sample, gender: p.gender,
      provider, voice: provider === 'openai' ? p.openai.voice : p.qwen.speaker,
    })),
  }
}

/** `voice?: { persona?, speed? }` from a request body → { persona, speed }; 422 on anything unknown. */
export function resolveVoice(input) {
  if (input !== undefined && input !== null && (typeof input !== 'object' || Array.isArray(input))) {
    throw new VoiceError(422, 'voice는 { persona?, speed? } 객체여야 합니다.')
  }
  const v = input ?? {}
  const personaId = v.persona === undefined || v.persona === null || v.persona === '' ? personaData.default : v.persona
  const persona = findVoicePersona(personaId)
  if (!persona) throw new VoiceError(422, '알 수 없는 목소리(voice.persona)입니다.')
  const speedId = v.speed === undefined || v.speed === null || v.speed === '' ? 'normal' : v.speed
  const speed = findSpeed(speedId)
  if (!speed) throw new VoiceError(422, 'voice.speed는 slow, normal, fast 중 하나여야 합니다.')
  return { persona, speed }
}

const clampSpeed = (x) => Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(x * 100) / 100))

/** Provider-specific synthesis parameters for a persona + speed. */
export function ttsParams(persona, speed, cfg = getVoiceConfig()) {
  if (cfg.providers.tts === 'openai') {
    return {
      provider: 'openai',
      voice: persona.openai.voice,
      speed: clampSpeed((Number(persona.openai.speed) || 1) * (Number(speed.factor) || 1)),
      instructions: persona.openai.instructions,
    }
  }
  return { provider: 'qwen', voice: persona.qwen.speaker, speaker: persona.qwen.speaker }
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
 * `voicePersona` (from voicePersonas.json) adds a "말투:" paragraph; the rules stay as they are.
 */
export function buildSystemPrompt(scenario, voicePersona = null) {
  const { persona } = scenarioData
  const facts = promptFactsOf(scenario)
  return [
    `당신은 "${persona.name}"라는 이름의 AI 전화 상담원입니다. 업종: ${scenario.industry}. 역할: ${scenario.title} — ${scenario.desc}.`,
    '가장 중요한 규칙: 아래 매장 정보 목록에 없는 시간·가격·조건·가능 여부는 절대 말하지 않습니다. 목록에 없는 내용은 담당자가 확인 후 연락드린다고만 안내하고, 예약을 임의로 확정하지 않습니다.',
    '답변은 한 문장, 40자 이내. 확인 질문도 그 한 문장 안에서 합니다. 한국어만 사용하고 영어·중국어·이모지·마크다운·괄호 설명을 쓰지 않으며, 숫자는 한글로 풀어 씁니다(여섯 시, 여덟 명).',
    persona.style,
    ...(voicePersona?.style ? [`말투: ${voicePersona.style}`] : []),
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

/** Short keyword hint for the ASR model (proper nouns / domain words) — whisper-style prompts are tiny. */
export function asrPrompt(scenario) {
  if (!scenario) return '콜바 전화 상담. 예약, 문의, 견적.'
  return `콜바 ${scenario.industry} 전화 상담. ${scenario.title}. ${scenario.desc}.`.slice(0, 200)
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
const INTERJECTION_MAX = 8 // "네네!", "아, 그러시구나!" — merged into the following sentence, not counted as one

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
  if (out.length > 1 && out[0].length <= INTERJECTION_MAX) out.splice(0, 2, `${out[0]} ${out[1]}`)
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
const num = (v) => (Number.isFinite(v) ? v : null)
const round2 = (x) => Math.round(x * 100) / 100

function toVoiceError(err, label, provider) {
  if (err instanceof VoiceError) return err
  const name = err?.name ?? err?.cause?.name
  const tag = provider ? ` (${provider})` : ''
  if (name === 'TimeoutError' || name === 'AbortError') return new VoiceError(504, `${label.timeout}${tag}`, err)
  return new VoiceError(502, `${label.connect}${tag}`, err)
}

async function upstreamFetch(url, init, timeoutMs, label, provider) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  } catch (err) {
    throw toVoiceError(err, label, provider)
  }
}

async function readJson(res, label, provider) {
  try {
    return await res.json()
  } catch (err) {
    throw toVoiceError(err, label, provider)
  }
}

async function readBuffer(res, label, provider) {
  try {
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    throw toVoiceError(err, label, provider)
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

function qwenHttpError(res, label, excerpt) {
  console.warn(`[voice] qwen ${label.name} upstream HTTP ${res.status}${excerpt ? `: ${excerpt}` : ''}`)
  return new VoiceError(502, `${label.name} 서버 오류 (HTTP ${res.status}) (qwen)`)
}

/** OpenAI non-2xx → VoiceError. 401/429 get specific Korean messages; the body goes to the log only. */
async function openaiHttpError(res, label) {
  const excerpt = await errorExcerpt(res)
  console.warn(`[voice] openai ${label.name} HTTP ${res.status}${excerpt ? `: ${excerpt}` : ''}`)
  if (res.status === 401) return new VoiceError(502, '음성 API 키가 올바르지 않습니다 (openai)')
  if (res.status === 429) return new VoiceError(502, `음성 API 사용량 한도를 초과했습니다 (openai ${label.name})`)
  if (res.status === 400 || res.status === 422) return new VoiceError(502, `${label.name} 요청이 거부되었습니다 (openai HTTP ${res.status})`)
  return new VoiceError(502, `${label.name} 서버 오류 (openai HTTP ${res.status})`)
}

const openaiHeaders = (cfg, extra = {}) => ({ Authorization: `Bearer ${cfg.openaiKey}`, ...extra })

const numHeader = (res, name) => num(Number(res.headers.get(name)))

/* ---------- WAV helpers ---------- */
/** `RIFF....WAVE` magic — cheap local check before the upstream round trip. */
export function looksLikeWav(buf) {
  return Buffer.isBuffer(buf) && buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WAVE'
}

/**
 * Walk the RIFF chunks → { channels, sampleRate, bitsPerSample, dataOffset, dataBytes, declaredDataBytes, seconds }.
 * Streamed WAVs (OpenAI) carry placeholder sizes (0 / 0xFFFFFFFF); those are resolved against the real length.
 */
export function wavInfo(buf) {
  if (!looksLikeWav(buf)) return null
  let pos = 12
  let fmt = null
  let data = null
  while (pos + 8 <= buf.length) {
    const id = buf.toString('latin1', pos, pos + 4)
    const size = buf.readUInt32LE(pos + 4)
    const body = pos + 8
    if (id === 'fmt ' && body + 16 <= buf.length) {
      fmt = { channels: buf.readUInt16LE(body + 2), sampleRate: buf.readUInt32LE(body + 4), bitsPerSample: buf.readUInt16LE(body + 14) }
    }
    if (id === 'data') {
      const remaining = buf.length - body
      data = { offset: body, declared: size, bytes: size === 0 || size > remaining ? remaining : size }
      break
    }
    if (size === 0xffffffff) break
    pos = body + size + (size & 1)
  }
  if (!fmt || !data) return null
  const bytesPerSec = fmt.sampleRate * fmt.channels * (fmt.bitsPerSample / 8)
  return {
    ...fmt,
    dataOffset: data.offset,
    dataBytes: data.bytes,
    declaredDataBytes: data.declared,
    seconds: bytesPerSec > 0 ? round2(data.bytes / bytesPerSec) : null,
  }
}

/** Patch RIFF/data sizes in place when they are placeholders, so every player (Safari included) accepts the file. */
export function fixWavHeader(buf) {
  const info = wavInfo(buf)
  if (!info) return { buffer: buf, info: null, patched: false }
  let patched = false
  const wantRiff = buf.length - 8
  if (buf.readUInt32LE(4) !== wantRiff) { buf.writeUInt32LE(wantRiff, 4); patched = true }
  if (info.declaredDataBytes !== info.dataBytes) { buf.writeUInt32LE(info.dataBytes, info.dataOffset - 4); patched = true }
  return { buffer: buf, info, patched }
}

/* ---------- health ---------- */
let healthCache = null // { at, promise }

/** Probe openai (/models) and the qwen servers (/healthz, /api/tags) in parallel (3 s each). The in-flight promise is cached for 10 s. */
export function probeHealth() {
  const t = Date.now()
  if (healthCache && t - healthCache.at < HEALTH_TTL_MS) return healthCache.promise
  const promise = runHealthProbe()
  healthCache = { at: t, promise }
  return promise
}

const NO_URL = (key) => ({ ok: false, latencyMs: null, error: `${key} 설정이 없습니다` })

async function runHealthProbe() {
  const cfg = getVoiceConfig()
  const checkedAt = new Date().toISOString()
  const [openai, qwenLlm, qwenTts, qwenAsr] = await Promise.all([
    cfg.openaiKey ? probeOpenai(cfg) : { ok: false, latencyMs: null, error: 'OPENAI_API_KEY 없음', models: new Set() },
    cfg.llmUrl ? probeQwenLlm(cfg) : { ...NO_URL('VOICE_LLM_URL'), model: cfg.qwenModel },
    cfg.ttsUrl ? probeQwenService(cfg.ttsUrl, LABEL.tts, true) : NO_URL('VOICE_TTS_URL'),
    cfg.asrUrl ? probeQwenService(cfg.asrUrl, LABEL.asr, false) : NO_URL('VOICE_ASR_URL'),
  ])
  const qwen = { llm: qwenLlm, tts: qwenTts, asr: qwenAsr }

  const service = (kind) => {
    const provider = cfg.providers[kind]
    if (provider === 'openai') {
      const model = cfg.models[kind]
      const entry = { ok: openai.ok, provider, model, latencyMs: openai.latencyMs }
      if (!openai.ok) entry.error = openai.error
      else if (openai.models.size > 0 && !openai.models.has(model)) {
        entry.ok = false
        entry.error = `모델 ${model}을(를) 이 API 키로 사용할 수 없습니다 (openai)`
      }
      return entry
    }
    const q = qwen[kind]
    const entry = { ok: q.ok, provider: 'qwen', model: q.model ?? null, latencyMs: q.latencyMs }
    if (q.speaker) entry.speaker = q.speaker
    if (q.error) entry.error = q.error
    return entry
  }
  const llm = service('llm')
  const tts = service('tts')
  const asr = service('asr')
  const { models: _models, ...openaiPublic } = openai
  return { enabled: llm.ok && tts.ok, providers: { ...cfg.providers }, llm, tts, asr, openai: openaiPublic, qwen, checkedAt }
}

async function probeOpenai(cfg) {
  const t0 = now()
  try {
    const res = await upstreamFetch(`${cfg.openaiBase}/models`, { method: 'GET', headers: openaiHeaders(cfg) }, TIMEOUTS.health, LABEL.openai, 'openai')
    if (res.status === 401) return { ok: false, latencyMs: since(t0), error: '음성 API 키가 올바르지 않습니다 (openai)', models: new Set() }
    if (!res.ok) return { ok: false, latencyMs: since(t0), error: `OpenAI 응답 오류 (HTTP ${res.status})`, models: new Set() }
    const data = await readJson(res, LABEL.openai, 'openai')
    const models = new Set((Array.isArray(data?.data) ? data.data : []).map((m) => m?.id).filter((id) => typeof id === 'string'))
    return { ok: true, latencyMs: since(t0), models }
  } catch (err) {
    return { ok: false, latencyMs: since(t0), error: err instanceof VoiceError ? err.message : LABEL.openai.connect, models: new Set() }
  }
}

async function probeQwenLlm({ llmUrl, qwenModel: model }) {
  const t0 = now()
  try {
    const res = await upstreamFetch(`${llmUrl}/api/tags`, { method: 'GET' }, TIMEOUTS.health, LABEL.llm, 'qwen')
    if (!res.ok) return { ok: false, model, latencyMs: since(t0), error: `AI 서버 오류 (HTTP ${res.status}) (qwen)` }
    const data = await readJson(res, LABEL.llm, 'qwen')
    const models = Array.isArray(data?.models) ? data.models : []
    const listed = models.some((m) => m?.name === model || m?.model === model)
    if (!listed) return { ok: false, model, latencyMs: since(t0), error: `모델 ${model}이(가) AI 서버에 없습니다 (qwen)` }
    return { ok: true, model, latencyMs: since(t0) }
  } catch (err) {
    return { ok: false, model, latencyMs: since(t0), error: err instanceof VoiceError ? err.message : `${LABEL.llm.connect} (qwen)` }
  }
}

async function probeQwenService(baseUrl, label, withSpeaker) {
  const t0 = now()
  try {
    const res = await upstreamFetch(`${baseUrl}/healthz`, { method: 'GET' }, TIMEOUTS.health, label, 'qwen')
    if (!res.ok) return { ok: false, latencyMs: since(t0), error: `${label.name} 서버 오류 (HTTP ${res.status}) (qwen)` }
    const data = await readJson(res, label, 'qwen')
    const out = { ok: false, latencyMs: since(t0) }
    if (typeof data?.model === 'string') out.model = data.model
    if (withSpeaker && typeof data?.speaker === 'string') out.speaker = data.speaker
    if (data?.ok !== true) out.error = `${label.name} 서버가 정상 상태가 아닙니다 (qwen)`
    else if (data?.loaded === false) out.error = `${label.name} 모델을 아직 불러오는 중입니다 (qwen)`
    else out.ok = true
    return out
  } catch (err) {
    return { ok: false, latencyMs: since(t0), error: err instanceof VoiceError ? err.message : `${label.connect} (qwen)` }
  }
}

/* ---------- LLM ---------- */
/**
 * @param {{ system: string, messages: {role:string,content:string}[], timeoutMs?: number }} p
 * @returns {Promise<{ reply: string, llmMs: number, provider: string, model: string, evalCount: number,
 *                     usage: { prompt: number|null, completion: number|null, total: number|null }, doneReason: string|null }>}
 * `llmMs` is wall-clock around the HTTP call (includes the tunnel / internet), not the upstream's own timing.
 */
export async function llmChat({ system, messages, timeoutMs = TIMEOUTS.chat }) {
  const cfg = getVoiceConfig()
  return cfg.providers.llm === 'openai'
    ? llmOpenai({ system, messages, timeoutMs }, cfg)
    : llmQwen({ system, messages, timeoutMs }, cfg)
}

function finishReply(raw, provider) {
  const reply = cleanReply(typeof raw === 'string' ? raw : '')
  if (!reply) throw new VoiceError(502, `AI 응답이 비어 있습니다. 다시 시도해 주세요. (${provider})`)
  return reply
}

export async function llmOpenai({ system, messages, timeoutMs = TIMEOUTS.chat }, cfg = getVoiceConfig()) {
  const model = cfg.models.llm
  const t0 = now()
  const res = await upstreamFetch(`${cfg.openaiBase}/chat/completions`, {
    method: 'POST',
    headers: openaiHeaders(cfg, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 120,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  }, timeoutMs, LABEL.llm, 'openai')
  if (!res.ok) throw await openaiHttpError(res, LABEL.llm)
  const data = await readJson(res, LABEL.llm, 'openai')
  const choice = data?.choices?.[0]
  const u = data?.usage ?? {}
  const usage = { prompt: num(u.prompt_tokens), completion: num(u.completion_tokens), total: num(u.total_tokens) }
  return {
    reply: finishReply(choice?.message?.content, 'openai'),
    llmMs: since(t0),
    provider: 'openai',
    model,
    evalCount: usage.completion ?? 0,
    usage,
    doneReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : null,
  }
}

export async function llmQwen({ system, messages, timeoutMs = TIMEOUTS.chat }, cfg = getVoiceConfig()) {
  const model = cfg.qwenModel
  const t0 = now()
  const res = await upstreamFetch(`${cfg.llmUrl}/api/chat`, {
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
  }, timeoutMs, LABEL.llm, 'qwen')
  if (!res.ok) throw qwenHttpError(res, LABEL.llm, await errorExcerpt(res))
  const data = await readJson(res, LABEL.llm, 'qwen')
  const prompt = num(data?.prompt_eval_count)
  const completion = num(data?.eval_count)
  return {
    reply: finishReply(data?.message?.content, 'qwen'),
    llmMs: since(t0),
    provider: 'qwen',
    model,
    evalCount: completion ?? 0,
    usage: { prompt, completion, total: prompt !== null && completion !== null ? prompt + completion : null },
    doneReason: typeof data?.done_reason === 'string' ? data.done_reason : null,
  }
}

/* ---------- TTS ---------- */
/**
 * @param {string} text 1–300 chars
 * @param {{ persona: object, speed: object, timeoutMs?: number }} opts persona/speed objects from resolveVoice()
 * @returns {Promise<{ buffer: Buffer, seconds: number|null, elapsedMs: number|null, sampleRate: number|null,
 *                     contentType: string, ttsMs: number, provider: string, model: string|null, voice: string, speed: number|null }>}
 */
export async function synthesize(text, { persona, speed, timeoutMs = TIMEOUTS.tts }) {
  const cfg = getVoiceConfig()
  const params = ttsParams(persona, speed, cfg)
  return params.provider === 'openai'
    ? ttsOpenai(text, params, cfg, timeoutMs)
    : ttsQwen(text, params, cfg, timeoutMs)
}

export async function ttsOpenai(text, { voice, speed, instructions }, cfg = getVoiceConfig(), timeoutMs = TIMEOUTS.tts) {
  const model = cfg.models.tts
  const t0 = now()
  const res = await upstreamFetch(`${cfg.openaiBase}/audio/speech`, {
    method: 'POST',
    headers: openaiHeaders(cfg, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ model, input: text, voice, speed, instructions, response_format: 'wav' }),
  }, timeoutMs, LABEL.tts, 'openai')
  if (!res.ok) throw await openaiHttpError(res, LABEL.tts)
  const raw = await readBuffer(res, LABEL.tts, 'openai')
  if (raw.length === 0) throw new VoiceError(502, '음성 합성 결과가 비어 있습니다 (openai)')
  const { buffer, info } = fixWavHeader(raw)
  return {
    buffer,
    seconds: info?.seconds ?? null,
    elapsedMs: null,
    sampleRate: info?.sampleRate ?? null,
    contentType: 'audio/wav',
    ttsMs: since(t0),
    provider: 'openai',
    model,
    voice,
    speed,
  }
}

export async function ttsQwen(text, { speaker }, cfg = getVoiceConfig(), timeoutMs = TIMEOUTS.tts) {
  const t0 = now()
  const res = await upstreamFetch(`${cfg.ttsUrl}/v1/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
    body: JSON.stringify(speaker ? { text, speaker } : { text }),
  }, timeoutMs, LABEL.tts, 'qwen')
  if (res.status === 422) {
    console.warn(`[voice] qwen TTS rejected text: ${await errorExcerpt(res)}`)
    throw new VoiceError(422, '음성 합성 입력이 올바르지 않습니다. (1~300자) (qwen)')
  }
  if (res.status === 503) throw new VoiceError(502, '음성 합성 서버가 아직 준비되지 않았습니다 (qwen)')
  if (!res.ok) throw qwenHttpError(res, LABEL.tts, await errorExcerpt(res))
  const buffer = await readBuffer(res, LABEL.tts, 'qwen')
  if (buffer.length === 0) throw new VoiceError(502, '음성 합성 결과가 비어 있습니다 (qwen)')
  return {
    buffer,
    seconds: numHeader(res, 'x-audio-seconds'),
    elapsedMs: numHeader(res, 'x-elapsed-ms'),
    sampleRate: numHeader(res, 'x-sample-rate'),
    contentType: res.headers.get('content-type') || 'audio/wav',
    ttsMs: since(t0),
    provider: 'qwen',
    model: null,
    voice: speaker ?? null,
    speed: null, // qwen TTS has no speed control
  }
}

/* ---------- ASR ---------- */
/**
 * @param {Buffer} wav
 * @param {{ scenario?: object|null, timeoutMs?: number }} opts
 * @returns {Promise<{ text: string, audioSeconds: number|null, elapsedMs: number|null, asrMs: number, provider: string, model: string|null }>}
 */
export async function transcribe(wav, { scenario = null, timeoutMs = TIMEOUTS.asr } = {}) {
  const cfg = getVoiceConfig()
  return cfg.providers.asr === 'openai'
    ? asrOpenai(wav, { prompt: asrPrompt(scenario) }, cfg, timeoutMs)
    : asrQwen(wav, cfg, timeoutMs)
}

const cleanTranscript = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '')

export async function asrOpenai(wav, { prompt } = {}, cfg = getVoiceConfig(), timeoutMs = TIMEOUTS.asr) {
  const model = cfg.models.asr
  const t0 = now()
  const form = new FormData()
  form.append('file', new Blob([wav], { type: 'audio/wav' }), 'audio.wav')
  form.append('model', model)
  form.append('language', 'ko')
  form.append('response_format', 'json')
  if (prompt) form.append('prompt', prompt)
  const res = await upstreamFetch(`${cfg.openaiBase}/audio/transcriptions`, {
    method: 'POST',
    headers: openaiHeaders(cfg),
    body: form,
  }, timeoutMs, LABEL.asr, 'openai')
  if (res.status === 400) {
    console.warn(`[voice] openai ASR rejected audio: ${await errorExcerpt(res)}`)
    throw new VoiceError(415, '읽을 수 있는 오디오가 아니거나 너무 깁니다 (openai)')
  }
  if (!res.ok) throw await openaiHttpError(res, LABEL.asr)
  const data = await readJson(res, LABEL.asr, 'openai')
  return {
    text: cleanTranscript(data?.text),
    audioSeconds: wavInfo(wav)?.seconds ?? null,
    elapsedMs: null,
    asrMs: since(t0),
    provider: 'openai',
    model,
  }
}

export async function asrQwen(wav, cfg = getVoiceConfig(), timeoutMs = TIMEOUTS.asr) {
  const t0 = now()
  const res = await upstreamFetch(`${cfg.asrUrl}/v1/asr`, {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: wav,
  }, timeoutMs, LABEL.asr, 'qwen')
  if (res.status === 415) throw new VoiceError(415, '읽을 수 있는 WAV(PCM) 오디오가 아닙니다. (qwen)')
  if (res.status === 413) throw new VoiceError(413, '오디오가 너무 깁니다. (최대 30초) (qwen)')
  if (res.status === 422) throw new VoiceError(422, '오디오가 비어 있습니다. (qwen)')
  if (res.status === 503) throw new VoiceError(502, '음성 인식 서버가 아직 준비되지 않았습니다 (qwen)')
  if (!res.ok) throw qwenHttpError(res, LABEL.asr, await errorExcerpt(res))
  const data = await readJson(res, LABEL.asr, 'qwen')
  return {
    text: cleanTranscript(data?.text),
    audioSeconds: num(data?.audio_seconds),
    elapsedMs: num(data?.elapsed_ms),
    asrMs: since(t0),
    provider: 'qwen',
    model: null,
  }
}
