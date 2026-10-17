/**
 * Callva clone API — Express 5, ESM.
 *
 * Endpoints (contract: src/lib/api.ts)
 *   GET  /api/health
 *   GET  /api/status-page
 *   POST /api/contact
 *   POST /api/consultation
 *   GET  /api/submissions?type=contact|consultation   (dev only)
 *   /api/voice/*  — live AI call demo (LLM/TTS/ASR on the GPU server), see routes/voice.mjs
 *
 * In production (NODE_ENV=production) it also serves ../dist with an SPA fallback.
 */
import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { validateContact, validateConsultation, validateSubmissionType } from './lib/validate.mjs'
import { appendRecord, listRecords, DATA_DIR } from './lib/store.mjs'
import { voiceRouter } from './routes/voice.mjs'
import { getVoiceConfig } from './lib/voice.mjs'

// Local config (VOICE_* etc.) from the project-root `.env` — gitignored, see .env.example.
// Variables already present in the environment win over the file. No file → env only.
try {
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
} catch {
  /* no .env — fine */
}

// Process-level guards: log and keep serving instead of dying on a stray async error.
process.on('unhandledRejection', (reason) => {
  console.error('[api] unhandledRejection:', reason instanceof Error ? reason.stack : reason)
})
process.on('uncaughtException', (err) => {
  console.error('[api] uncaughtException:', err?.stack ?? err)
})
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => {
    console.error(`[api] received ${sig} — shutting down`)
    process.exit(0)
  })
}

const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT ?? 3001)
const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url))

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 'loopback')

/* ---------- middleware ---------- */
app.use(cors())

// tiny request logger: METHOD path → status (ms) [+ whatever a route left in res.locals.log]
app.use((req, res, next) => {
  const started = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6
    const extra = typeof res.locals.log === 'string' ? ` ${res.locals.log}` : ''
    console.log(`[api] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms.toFixed(1)}ms)${extra}`)
  })
  next()
})

// Voice demo router mounts its own body parsers (12 MB JSON / 8 MB raw WAV),
// so it must come BEFORE the app-wide 100 KB JSON parser.
app.use('/api/voice', voiceRouter)

app.use(express.json({ limit: '100kb' }))

/* ---------- helpers ---------- */
const jitter = (min, max) => Math.round(min + Math.random() * (max - min))
const clientMeta = (req) => ({
  ip: req.ip ?? req.socket?.remoteAddress ?? null,
  userAgent: typeof req.get('user-agent') === 'string' ? req.get('user-agent').slice(0, 300) : null,
})

/* ---------- routes ---------- */
app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ ok: true, uptimeSec: Math.round(process.uptime()), now: new Date().toISOString() })
})

app.get('/api/status-page', (_req, res) => {
  const now = new Date().toISOString()
  const apiMs = jitter(90, 160)
  const infraMs = jitter(140, 220)
  // mostly 100, occasionally 99.98 so the number feels alive
  const uptime24h = Math.random() < 0.15 ? 99.98 : 100
  res.set('Cache-Control', 'no-store')
  res.json({
    overall: 'operational',
    uptime24h,
    operationalServices: '2/2',
    avgResponseMs: Math.round((apiMs + infraMs) / 2),
    services: [
      { id: 'api', name: 'API 서버', status: 'operational', lastCheckedAt: now, responseMs: apiMs },
      { id: 'call-infra', name: 'Call Infra', status: 'operational', lastCheckedAt: now, responseMs: infraMs },
    ],
    updatedAt: now,
    statusUrl: '/#status-section',
  })
})

app.post('/api/contact', async (req, res, next) => {
  try {
    const result = validateContact(req.body)
    if (!result.ok) return res.status(400).json({ error: result.error, fields: result.fields })
    const stored = await appendRecord('contacts', 'ct_', { ...result.value, ...clientMeta(req) })
    res.status(201).json({ ok: true, id: stored.id, receivedAt: stored.receivedAt })
  } catch (err) {
    next(err)
  }
})

app.post('/api/consultation', async (req, res, next) => {
  try {
    const result = validateConsultation(req.body)
    if (!result.ok) return res.status(400).json({ error: result.error, fields: result.fields })
    const stored = await appendRecord('consultations', 'cs_', { ...result.value, ...clientMeta(req) })
    res.status(201).json({ ok: true, id: stored.id, receivedAt: stored.receivedAt })
  } catch (err) {
    next(err)
  }
})

// dev-only inspection list (latest 50, newest first)
app.get('/api/submissions', async (req, res, next) => {
  if (isProd) return res.status(404).json({ error: '요청하신 API를 찾을 수 없습니다.' })
  try {
    const type = req.query.type
    if (!validateSubmissionType(type)) {
      return res.status(400).json({ error: 'type 쿼리는 contact 또는 consultation 이어야 합니다.', fields: { type: 'contact | consultation' } })
    }
    const collection = type === 'contact' ? 'contacts' : 'consultations'
    const items = await listRecords(collection, 50)
    res.set('Cache-Control', 'no-store')
    res.json({ type, count: items.length, items })
  } catch (err) {
    next(err)
  }
})

// JSON 404 for any other /api/* request (Express 5: no '*' wildcard strings)
app.use('/api', (_req, res) => {
  res.status(404).json({ error: '요청하신 API를 찾을 수 없습니다.' })
})

/* ---------- production: static dist + SPA fallback ---------- */
if (isProd) {
  if (!existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.warn('[api] dist/index.html not found — run `npm run build` first. API only.')
  } else {
    // hashed assets may be cached; index.html must not be (SPA redeploys)
    app.use(express.static(DIST_DIR, { index: false, maxAge: '1h' }))
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next()
      res.set('Cache-Control', 'no-cache')
      res.sendFile(path.join(DIST_DIR, 'index.html'))
    })
  }
}

// anything else (non-API, or non-GET in production) → JSON 404
app.use((_req, res) => {
  res.status(404).json({ error: '페이지를 찾을 수 없습니다.' })
})

/* ---------- error handler (always JSON, never leaks stack in production) ---------- */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err?.status) ? err.status : Number.isInteger(err?.statusCode) ? err.statusCode : 500
  let message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  if (err?.type === 'entity.parse.failed') message = '요청 본문(JSON) 형식이 올바르지 않습니다.'
  else if (err?.type === 'entity.too.large') message = '요청 본문이 너무 큽니다. (최대 100KB)'
  else if (status >= 400 && status < 500 && typeof err?.message === 'string') message = err.message

  if (status >= 500) console.error('[api] error:', err)
  const body = { error: message }
  if (!isProd && status >= 500 && err?.stack) body.stack = String(err.stack)
  res.status(status).json(body)
})

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}${isProd ? ' (production)' : ''}`)
  console.log(`[api] submissions are stored in ${DATA_DIR}`)
  const voice = getVoiceConfig()
  const svc = (kind) => `${kind}=${voice.providers[kind]}${voice.models[kind] ? `:${voice.models[kind]}` : ''}`
  console.log(voice.configured
    ? `[api] voice demo enabled — ${svc('llm')} ${svc('tts')} ${svc('asr')}${voice.ready.asr ? '' : ' (asr not configured → text input only)'} — GET /api/voice/health`
    : '[api] voice demo disabled — set OPENAI_API_KEY or VOICE_LLM_URL / VOICE_TTS_URL / VOICE_ASR_URL in .env (see .env.example)')
})
