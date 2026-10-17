/**
 * /api/voice — live AI call demo (LLM / TTS / ASR via OpenAI or the GPU server, per VOICE_*_PROVIDER).
 *
 *   GET  /health      probe the active providers (+ openai / qwen detail), cached 10 s
 *   GET  /scenarios   persona + scenario list (no `handoff`)
 *   GET  /personas    voice personas + speeds for the UI (no `style` / `instructions`)
 *   POST /chat        { scenarioId, messages[], voice? } → { reply, timings, usage }
 *   POST /tts         { text, voice? } → audio/wav (X-Audio-Seconds / X-Elapsed-Ms / X-Sample-Rate / X-Voice-*)
 *   POST /asr         raw audio/wav (?scenarioId= for a keyword hint) → { text, audioSeconds, elapsedMs, provider }
 *   POST /turn        { scenarioId, text | audioBase64, history?, voice? } → ASR → LLM → TTS in one call
 *
 * `voice` = { persona?: string, speed?: 'slow'|'normal'|'fast' } (defaults from shared/voicePersonas.json).
 * Body parsers are mounted per route (12 MB JSON / 8 MB raw) — this router is mounted BEFORE the
 * app-wide 100 KB JSON parser in index.mjs.
 * Validation errors → 422, unknown scenario → 404, voice not configured → 503, upstream failures → 502/504
 * (message names the provider). Always `{ error }` in Korean, never a stack.
 * Each request appends its step timings + providers (+ token usage, log only) to `res.locals.log`.
 */
import { Router, json, raw } from 'express'
import {
  LIMITS, MESSAGES, VoiceError,
  getVoiceConfig, probeHealth, getPersona, listScenarios, findScenario, getVoiceOptions, resolveVoice,
  buildSystemPrompt, buildChatMessages, normalizeMessages, withGreeting,
  llmChat, synthesize, transcribe, looksLikeWav, withSlot, pipelineSlots,
} from '../lib/voice.mjs'

export const voiceRouter = Router()

const jsonBody = json({ limit: '12mb' })
const wavBody = raw({ type: ['audio/wav', 'audio/wave', 'audio/x-wav', 'application/octet-stream'], limit: '8mb' })
const BASE64_MAX_LEN = Math.ceil(LIMITS.asrMaxBytes / 3) * 4 + 64
const EXPOSED_HEADERS = 'X-Audio-Seconds, X-Elapsed-Ms, X-Sample-Rate, X-Voice-Persona, X-Voice-Provider'

/* ---------- small helpers ---------- */
const now = () => performance.now()
const since = (t0) => Math.round(now() - t0)
const fmtMs = (v) => (typeof v !== 'number' ? '-' : v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`)
/** "openai 812ms" / "-" for a stage that did not run */
const stage = (provider, ms) => (provider ? `${provider} ${fmtMs(ms)}` : '-')
const tok = (usage) => (usage && (usage.prompt !== null || usage.completion !== null) ? `${usage.prompt ?? '?'}/${usage.completion ?? '?'}` : null)

function stamp(res, parts) {
  const slots = pipelineSlots.stats
  const body = Object.entries(parts).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => `${k}=${v}`).join(' ')
  res.locals.log = `[voice ${body} slots=${slots.active}/${slots.queued}]`
}

function requireObject(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new VoiceError(422, 'JSON 객체 본문이 필요합니다.')
  return body
}

function requireScenario(id) {
  if (typeof id !== 'string' || !id) throw new VoiceError(422, 'scenarioId가 필요합니다.')
  const scenario = findScenario(id)
  if (!scenario) throw new VoiceError(404, '시나리오를 찾을 수 없습니다.')
  return scenario
}

function requireText(value, field, max) {
  if (typeof value !== 'string') throw new VoiceError(422, `${field}는 문자열이어야 합니다.`)
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) throw new VoiceError(422, `${field}가 비어 있습니다.`)
  if (text.length > max) throw new VoiceError(422, `${field}는 ${max}자 이내여야 합니다.`)
  return text
}

/** base64 (optionally `data:audio/wav;base64,` prefixed) → WAV Buffer, size/magic checked. */
function decodeWavBase64(value) {
  if (typeof value !== 'string') throw new VoiceError(422, 'audioBase64는 문자열이어야 합니다.')
  const b64 = value.replace(/^data:[^,]*,/, '').trim()
  if (!b64) throw new VoiceError(422, 'audioBase64가 비어 있습니다.')
  if (b64.length > BASE64_MAX_LEN) throw new VoiceError(413, '오디오가 너무 큽니다. (최대 8MB)')
  const buf = Buffer.from(b64, 'base64')
  if (buf.length === 0) throw new VoiceError(422, 'audioBase64를 해석할 수 없습니다.')
  if (buf.length > LIMITS.asrMaxBytes) throw new VoiceError(413, '오디오가 너무 큽니다. (최대 8MB)')
  if (!looksLikeWav(buf)) throw new VoiceError(415, 'WAV(RIFF) 형식의 오디오가 아닙니다.')
  return buf
}

const present = (v) => v !== undefined && v !== null && v !== ''
/** actual provider/voice used (a qwen-pinned persona may have fallen back to openai → `fallbackFrom`) */
const voiceInfo = (persona, out) => ({ persona: persona.id, provider: out.provider, voice: out.voice, ...(out.fallbackFrom ? { fallbackFrom: out.fallbackFrom } : {}) })
const ttsStage = (out) => `${stage(out.provider, out.ttsMs)}${out.fallbackFrom ? ` (fallback from ${out.fallbackFrom})` : ''}`

/* ---------- always available (no model needed) ---------- */
voiceRouter.get('/health', async (_req, res, next) => {
  try {
    const health = await probeHealth()
    res.set('Cache-Control', 'no-store')
    res.json(health)
  } catch (err) {
    next(err)
  }
})

voiceRouter.get('/scenarios', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ persona: getPersona(), scenarios: listScenarios() })
})

voiceRouter.get('/personas', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(getVoiceOptions())
})

/* ---------- model routes: 503 when the active llm/tts providers are not configured ---------- */
voiceRouter.use((_req, res, next) => {
  if (!getVoiceConfig().configured) return res.status(503).json({ error: MESSAGES.disabled })
  next()
})

voiceRouter.post('/chat', jsonBody, async (req, res, next) => {
  const t0 = now()
  try {
    const body = requireObject(req.body)
    const scenario = requireScenario(body.scenarioId)
    const { persona } = resolveVoice(body.voice)
    const messages = normalizeMessages(body.messages, 'messages')
    if (messages.length === 0) throw new VoiceError(422, 'messages에 최소 1개의 메시지가 필요합니다.')
    if (messages.at(-1).role !== 'user') throw new VoiceError(422, '마지막 메시지는 user 역할이어야 합니다.')

    const r = await withSlot(() => llmChat({
      system: buildSystemPrompt(scenario, persona),
      messages: buildChatMessages(scenario, messages),
    }))
    stamp(res, { route: 'chat', scenario: scenario.id, persona: persona.id, llm: stage(r.provider, r.llmMs), tok: tok(r.usage), total: fmtMs(since(t0)) })
    res.json({ reply: r.reply, timings: { llmMs: r.llmMs, providers: { llm: r.provider } }, usage: { evalCount: r.evalCount } })
  } catch (err) {
    stamp(res, { route: 'chat', error: err?.status ?? 500, total: fmtMs(since(t0)) })
    next(err)
  }
})

voiceRouter.post('/tts', jsonBody, async (req, res, next) => {
  const t0 = now()
  try {
    const body = requireObject(req.body)
    const text = requireText(body.text, 'text', LIMITS.ttsMaxChars)
    const { persona, speed } = resolveVoice(body.voice)

    const out = await withSlot(() => synthesize(text, { persona, speed }))
    stamp(res, { route: 'tts', persona: persona.id, speed: speed.id, chars: text.length, tts: ttsStage(out), audio: `${out.seconds ?? '-'}s`, total: fmtMs(since(t0)) })
    res.set('Content-Type', out.contentType)
    res.set('Content-Length', String(out.buffer.length))
    res.set('Cache-Control', 'no-store')
    if (out.seconds !== null) res.set('X-Audio-Seconds', String(out.seconds))
    if (out.elapsedMs !== null) res.set('X-Elapsed-Ms', String(out.elapsedMs))
    if (out.sampleRate !== null) res.set('X-Sample-Rate', String(out.sampleRate))
    res.set('X-Voice-Persona', persona.id)
    res.set('X-Voice-Provider', out.provider)
    res.set('Access-Control-Expose-Headers', EXPOSED_HEADERS)
    res.send(out.buffer)
  } catch (err) {
    stamp(res, { route: 'tts', error: err?.status ?? 500, total: fmtMs(since(t0)) })
    next(err)
  }
})

voiceRouter.post('/asr', wavBody, async (req, res, next) => {
  const t0 = now()
  try {
    if (!getVoiceConfig().ready.asr) throw new VoiceError(503, MESSAGES.asrDisabled)
    if (!Buffer.isBuffer(req.body)) throw new VoiceError(415, 'Content-Type: audio/wav 로 WAV 본문을 보내주세요.')
    if (req.body.length === 0) throw new VoiceError(422, '오디오가 비어 있습니다.')
    if (!looksLikeWav(req.body)) throw new VoiceError(415, 'WAV(RIFF) 형식의 오디오가 아닙니다.')
    const scenario = typeof req.query.scenarioId === 'string' ? findScenario(req.query.scenarioId) : null

    const out = await withSlot(() => transcribe(req.body, { scenario }))
    stamp(res, { route: 'asr', bytes: req.body.length, asr: stage(out.provider, out.asrMs), audio: `${out.audioSeconds ?? '-'}s`, total: fmtMs(since(t0)) })
    res.set('Cache-Control', 'no-store')
    res.json({ text: out.text, audioSeconds: out.audioSeconds, elapsedMs: out.elapsedMs, provider: out.provider })
  } catch (err) {
    stamp(res, { route: 'asr', error: err?.status ?? 500, total: fmtMs(since(t0)) })
    next(err)
  }
})

/**
 * One full turn: (ASR) → LLM → TTS, holding a single pipeline slot throughout.
 * timings.* is null for a stage that did not run (asrMs on text input, llmMs when
 * the transcript was empty); timings.providers mirrors that. TTS failure is non-fatal:
 * audio=null + timings.ttsError.
 */
voiceRouter.post('/turn', jsonBody, async (req, res, next) => {
  const t0 = now()
  let scenarioId = '-'
  try {
    const body = requireObject(req.body)
    const scenario = requireScenario(body.scenarioId)
    scenarioId = scenario.id
    const hasText = present(body.text)
    const hasAudio = present(body.audioBase64)
    if (hasText === hasAudio) throw new VoiceError(422, 'text 또는 audioBase64 중 하나만 보내주세요.')
    const { persona, speed } = resolveVoice(body.voice)
    const history = normalizeMessages(body.history, 'history')
    const text = hasText ? requireText(body.text, 'text', LIMITS.userTextMaxChars) : null
    const wav = hasAudio ? decodeWavBase64(body.audioBase64) : null
    if (wav && !getVoiceConfig().ready.asr) throw new VoiceError(503, MESSAGES.asrDisabled)

    const timings = { asrMs: null, llmMs: null, ttsMs: null, totalMs: null, providers: { asr: null, llm: null, tts: null } }
    let usage = null
    const result = await withSlot(async () => {
      let transcript = text
      if (wav) {
        const t1 = now()
        try {
          const a = await transcribe(wav, { scenario })
          timings.asrMs = a.asrMs
          timings.providers.asr = a.provider
          transcript = a.text
        } catch (err) {
          // upstream "empty audio" (422) → treat as nothing heard; other failures propagate (4xx/502/504)
          if (!(err instanceof VoiceError && err.status === 422)) throw err
          timings.asrMs = since(t1)
          timings.providers.asr = getVoiceConfig().providers.asr
          transcript = ''
        }
      }

      let reply
      if (!transcript) {
        reply = MESSAGES.emptyTranscript
      } else {
        const r = await llmChat({
          system: buildSystemPrompt(scenario, persona),
          messages: buildChatMessages(scenario, [...history, { role: 'user', content: transcript }]),
        })
        timings.llmMs = r.llmMs
        timings.providers.llm = r.provider
        usage = r.usage
        reply = r.reply
      }

      let audio = null
      let ttsOut = null
      try {
        ttsOut = await synthesize(reply, { persona, speed })
        timings.ttsMs = ttsOut.ttsMs
        timings.providers.tts = ttsOut.provider
        audio = { base64: ttsOut.buffer.toString('base64'), mime: 'audio/wav', seconds: ttsOut.seconds, voice: voiceInfo(persona, ttsOut) }
      } catch (err) {
        timings.ttsMs = null
        timings.providers.tts = getVoiceConfig().providers.tts
        timings.ttsError = err instanceof VoiceError ? err.message : '음성 합성에 실패했습니다'
        console.warn(`[voice] turn ${scenario.id}: TTS failed (${err?.status ?? '?'}) ${err?.message ?? err}`)
      }
      return { transcript: transcript ?? '', reply, audio }
    })
    timings.totalMs = since(t0)

    const base = withGreeting(scenario, history)
    const nextHistory = result.transcript
      ? [...base, { role: 'user', content: result.transcript }, { role: 'assistant', content: result.reply }]
      : base

    stamp(res, {
      route: 'turn', scenario: scenario.id, persona: persona.id, speed: speed.id, input: wav ? 'audio' : 'text',
      asr: stage(timings.providers.asr, timings.asrMs),
      llm: stage(timings.providers.llm, timings.llmMs),
      tts: timings.ttsError ? `${timings.providers.tts} ERR` : ttsStage({ provider: timings.providers.tts, ttsMs: timings.ttsMs, fallbackFrom: result.audio?.voice?.fallbackFrom }),
      audio: result.audio ? `${result.audio.seconds ?? '-'}s` : null,
      tok: tok(usage),
      total: fmtMs(timings.totalMs),
    })
    res.set('Cache-Control', 'no-store')
    res.json({ transcript: result.transcript, reply: result.reply, audio: result.audio, timings, history: nextHistory })
  } catch (err) {
    stamp(res, { route: 'turn', scenario: scenarioId, error: err?.status ?? 500, total: fmtMs(since(t0)) })
    next(err)
  }
})

/* ---------- router-level error handler: voice errors never reach the app handler ---------- */
// eslint-disable-next-line no-unused-vars
voiceRouter.use((err, _req, res, next) => {
  if (err instanceof VoiceError) {
    if (err.status >= 500) {
      const c = err.cause
      const why = typeof c?.code === 'string' ? c.code : (c?.name ?? (c ? String(c) : ''))
      console.warn(`[voice] ${err.status} ${err.message}${why ? ` ← ${why}` : ''}`)
    }
    return res.status(err.status).json({ error: err.message })
  }
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: '요청 본문이 너무 큽니다. (오디오 최대 8MB)' })
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: '요청 본문(JSON) 형식이 올바르지 않습니다.' })
  if (err?.type === 'encoding.unsupported' || err?.type === 'charset.unsupported') return res.status(415).json({ error: '지원하지 않는 요청 인코딩입니다.' })
  next(err) // unexpected → app-level handler
})
