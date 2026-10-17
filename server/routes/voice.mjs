/**
 * /api/voice — live AI call demo (real LLM / TTS / ASR on the GPU server).
 *
 *   GET  /health      probe all three services (cached 10 s)
 *   GET  /scenarios   persona + scenario list (no `handoff`)
 *   POST /chat        { scenarioId, messages[] } → { reply, timings, usage }
 *   POST /tts         { text } → audio/wav (X-Audio-Seconds / X-Elapsed-Ms / X-Sample-Rate)
 *   POST /asr         raw audio/wav → { text, audioSeconds, elapsedMs }
 *   POST /turn        { scenarioId, text | audioBase64, history? } → ASR → LLM → TTS in one call
 *
 * Body parsers are mounted per route (12 MB JSON / 8 MB raw) — this router is
 * mounted BEFORE the app-wide 100 KB JSON parser in index.mjs.
 * Validation errors → 422, unknown scenario → 404, voice not configured → 503,
 * upstream failures → 502/504. Always `{ error }` in Korean, never a stack.
 * Each request appends its step timings to `res.locals.log` (printed by the app logger).
 */
import { Router, json, raw } from 'express'
import {
  LIMITS, MESSAGES, VoiceError,
  getVoiceConfig, probeHealth, getPersona, listScenarios, findScenario,
  buildSystemPrompt, buildChatMessages, normalizeMessages, withGreeting,
  llmChat, synthesize, transcribe, looksLikeWav, withSlot, pipelineSlots,
} from '../lib/voice.mjs'

export const voiceRouter = Router()

const jsonBody = json({ limit: '12mb' })
const wavBody = raw({ type: ['audio/wav', 'audio/wave', 'audio/x-wav', 'application/octet-stream'], limit: '8mb' })
const BASE64_MAX_LEN = Math.ceil(LIMITS.asrMaxBytes / 3) * 4 + 64

/* ---------- small helpers ---------- */
const now = () => performance.now()
const since = (t0) => Math.round(now() - t0)
const fmt = (v) => (typeof v === 'number' ? `${v}ms` : '-')

function stamp(res, parts) {
  const slots = pipelineSlots.stats
  res.locals.log = `[voice ${Object.entries(parts).map(([k, v]) => `${k}=${v}`).join(' ')} slots=${slots.active}/${slots.queued}]`
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

/* ---------- always available (no GPU needed) ---------- */
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

/* ---------- model routes: 503 when VOICE_* env is missing ---------- */
voiceRouter.use((_req, res, next) => {
  if (!getVoiceConfig().configured) return res.status(503).json({ error: MESSAGES.disabled })
  next()
})

voiceRouter.post('/chat', jsonBody, async (req, res, next) => {
  const t0 = now()
  try {
    const body = requireObject(req.body)
    const scenario = requireScenario(body.scenarioId)
    const messages = normalizeMessages(body.messages, 'messages')
    if (messages.length === 0) throw new VoiceError(422, 'messages에 최소 1개의 메시지가 필요합니다.')
    if (messages.at(-1).role !== 'user') throw new VoiceError(422, '마지막 메시지는 user 역할이어야 합니다.')

    const result = await withSlot(() => llmChat({
      system: buildSystemPrompt(scenario),
      messages: buildChatMessages(scenario, messages),
    }))
    stamp(res, { route: 'chat', scenario: scenario.id, llm: fmt(result.llmMs), tokens: result.evalCount, total: fmt(since(t0)) })
    res.json({ reply: result.reply, timings: { llmMs: result.llmMs }, usage: { evalCount: result.evalCount } })
  } catch (err) {
    stamp(res, { route: 'chat', error: err?.status ?? 500, total: fmt(since(t0)) })
    next(err)
  }
})

voiceRouter.post('/tts', jsonBody, async (req, res, next) => {
  const t0 = now()
  try {
    const body = requireObject(req.body)
    const text = requireText(body.text, 'text', LIMITS.ttsMaxChars)

    const out = await withSlot(() => synthesize(text))
    stamp(res, { route: 'tts', chars: text.length, tts: fmt(out.ttsMs), audio: `${out.seconds ?? '-'}s`, total: fmt(since(t0)) })
    res.set('Content-Type', out.contentType)
    res.set('Content-Length', String(out.buffer.length))
    res.set('Cache-Control', 'no-store')
    if (out.seconds !== null) res.set('X-Audio-Seconds', String(out.seconds))
    if (out.elapsedMs !== null) res.set('X-Elapsed-Ms', String(out.elapsedMs))
    if (out.sampleRate !== null) res.set('X-Sample-Rate', String(out.sampleRate))
    res.set('Access-Control-Expose-Headers', 'X-Audio-Seconds, X-Elapsed-Ms, X-Sample-Rate')
    res.send(out.buffer)
  } catch (err) {
    stamp(res, { route: 'tts', error: err?.status ?? 500, total: fmt(since(t0)) })
    next(err)
  }
})

voiceRouter.post('/asr', wavBody, async (req, res, next) => {
  const t0 = now()
  try {
    if (!Buffer.isBuffer(req.body)) throw new VoiceError(415, 'Content-Type: audio/wav 로 WAV 본문을 보내주세요.')
    if (req.body.length === 0) throw new VoiceError(422, '오디오가 비어 있습니다.')
    if (!looksLikeWav(req.body)) throw new VoiceError(415, 'WAV(RIFF) 형식의 오디오가 아닙니다.')

    const out = await withSlot(() => transcribe(req.body))
    stamp(res, { route: 'asr', bytes: req.body.length, asr: fmt(out.asrMs), audio: `${out.audioSeconds ?? '-'}s`, total: fmt(since(t0)) })
    res.set('Cache-Control', 'no-store')
    res.json({ text: out.text, audioSeconds: out.audioSeconds, elapsedMs: out.elapsedMs })
  } catch (err) {
    stamp(res, { route: 'asr', error: err?.status ?? 500, total: fmt(since(t0)) })
    next(err)
  }
})

/**
 * One full turn: (ASR) → LLM → TTS, holding a single pipeline slot throughout.
 * timings.* is null for a stage that did not run (asrMs on text input, llmMs when
 * the transcript was empty). TTS failure is non-fatal: audio=null + timings.ttsError.
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
    const history = normalizeMessages(body.history, 'history')
    const text = hasText ? requireText(body.text, 'text', LIMITS.userTextMaxChars) : null
    const wav = hasAudio ? decodeWavBase64(body.audioBase64) : null

    const timings = { asrMs: null, llmMs: null, ttsMs: null, totalMs: null }
    const result = await withSlot(async () => {
      let transcript = text
      if (wav) {
        const t1 = now()
        try {
          const a = await transcribe(wav)
          timings.asrMs = a.asrMs
          transcript = a.text
        } catch (err) {
          // upstream "empty audio" (422) → treat as nothing heard; other failures propagate (4xx/502/504)
          if (!(err instanceof VoiceError && err.status === 422)) throw err
          timings.asrMs = since(t1)
          transcript = ''
        }
      }

      let reply
      if (!transcript) {
        reply = MESSAGES.emptyTranscript
      } else {
        const r = await llmChat({
          system: buildSystemPrompt(scenario),
          messages: buildChatMessages(scenario, [...history, { role: 'user', content: transcript }]),
        })
        timings.llmMs = r.llmMs
        reply = r.reply
      }

      let audio = null
      try {
        const t = await synthesize(reply)
        timings.ttsMs = t.ttsMs
        audio = { base64: t.buffer.toString('base64'), mime: 'audio/wav', seconds: t.seconds }
      } catch (err) {
        timings.ttsMs = null
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
      route: 'turn', scenario: scenario.id, input: wav ? 'audio' : 'text',
      asr: fmt(timings.asrMs), llm: fmt(timings.llmMs), tts: timings.ttsError ? 'ERR' : fmt(timings.ttsMs), total: fmt(timings.totalMs),
    })
    res.set('Cache-Control', 'no-store')
    res.json({ transcript: result.transcript, reply: result.reply, audio: result.audio, timings, history: nextHistory })
  } catch (err) {
    stamp(res, { route: 'turn', scenario: scenarioId, error: err?.status ?? 500, total: fmt(since(t0)) })
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
