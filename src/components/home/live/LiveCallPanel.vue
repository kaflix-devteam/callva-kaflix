<script setup lang="ts">
/**
 * "실제 AI 통화" — browser side of the live demo.
 *
 * Default = hands-free call: 통화 시작 opens the mic ONCE (one permission prompt,
 * stream kept open for the whole call), plays the greeting, then listens
 * continuously. An RMS VAD (src/lib/voice/vad.ts) decides when an utterance
 * starts/ends; the clip is encoded to 16 kHz WAV and sent to POST /api/voice/turn,
 * the reply is played (mic input gated/ignored meanwhile), then we listen again —
 * until 통화 종료. The VAD calibrates once per call (first listen; again only after
 * a 30 s idle pause via 다시 듣기) and keeps its threshold across cycles.
 * Hands-free off = hold-to-talk + text composer. Tracks are stopped only on
 * 통화 종료 / modal close / tab switch / unmount.
 *
 * The server does not stream progress, so the 인식 중 → 생각 중 transition shown
 * while an audio turn is in flight is a client-side estimate (~1.2 s).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  Headphones,
  Keyboard,
  Mic,
  PhoneCall,
  PhoneOff,
  PhoneOutgoing,
  RotateCcw,
  SendHorizontal,
  User,
  Volume2,
  X,
} from 'lucide-vue-next'
import type { DemoScenario } from '@/data/demoScenarios'
import { ui } from '@/lib/ui'
import {
  VoiceApiError,
  describeVoiceModels,
  fetchVoiceTts,
  postVoiceTurn,
  type VoiceHealth,
  type VoiceHistoryItem,
  type VoicePersona,
  type VoicePersonasResponse,
  type VoiceScenario,
  type VoiceSelection,
  type VoiceSpeedId,
  type VoiceTimings,
} from '@/lib/voice/client'
import { arrayBufferToBase64, encodeWav } from '@/lib/voice/wav'
import { MicRecorder, describeMicError, isRecorderSupported } from '@/lib/voice/recorder'
import { WavPlayer } from '@/lib/voice/player'
import { Vad, rmsToLevel } from '@/lib/voice/vad'
import MicButton from './MicButton.vue'
import LevelMeter from './LevelMeter.vue'
import VoicePicker from './VoicePicker.vue'

const props = defineProps<{
  scenario: DemoScenario
  voice: VoiceScenario | null
  health: VoiceHealth | null
  /** 목소리/말 빠르기 catalog (local JSON until /api/voice/personas answers) */
  catalog: VoicePersonasResponse
}>()
const emit = defineEmits<{ close: []; active: [value: boolean] }>()

/* ---------- constants ---------- */
const MAX_RECORD_MS = 15_000 // hold-to-talk hard stop
const MIN_HOLD_SEC = 0.3 // hold-to-talk minimum
const MIN_UTTERANCE_SEC = 0.4 // hands-free minimum speech length
const PRE_ROLL_MS = 400 // audio kept before the detected onset
const ASR_ESTIMATE_MS = 1_200
const RELISTEN_DELAY_MS = 400 // let the speaker tail die before listening again
const VAD_FALLBACK_THRESHOLD = 0.02
const ERROR_RELISTEN_MS = 1_500
const HINT_AFTER_MS = 12_000
const IDLE_STOP_MS = 30_000
const MIC_TOOLTIP = '마이크를 사용할 수 없어 텍스트로만 대화합니다'
const TEXT_FALLBACK_NOTICE = '마이크를 쓸 수 없어 텍스트 모드로 진행합니다.'

/* ---------- state ---------- */
type Phase = 'idle' | 'connecting' | 'listening' | 'recognizing' | 'thinking' | 'speaking' | 'error'
const phaseLabel: Record<Phase, string> = {
  idle: '대기 중',
  connecting: '연결 중',
  listening: '듣는 중',
  recognizing: '인식 중',
  thinking: '생각 중',
  speaking: '말하는 중',
  error: '오류',
}

interface Bubble {
  id: number
  role: 'assistant' | 'user'
  text: string
  caption: string
  pending: boolean
  warn: boolean
}

const inCall = ref(false)
const ended = ref(false)
const phase = ref<Phase>('idle')
const bubbles = ref<Bubble[]>([])
const history = ref<VoiceHistoryItem[]>([])
const errorMsg = ref<string | null>(null)
const notice = ref<string | null>(null)
const hint = ref<string | null>(null)
const draft = ref('')
const turns = ref(0)

// hands-free
const handsFree = ref(true)
const listening = ref(false)
const listenPaused = ref(false)
const speechDetected = ref(false)
const speechSec = ref(0)
const level = ref(0)
const vadThreshold = ref<number | null>(null)
const composerOpen = ref(false)

// hold-to-talk
const recording = ref(false)
const recProgress = ref(0)
const recElapsed = ref(0)
const micLevel = ref(0)

const micDenied = ref(false)
const micSupported = isRecorderSupported()

// voice persona / speed (chosen before the call; locked while in a call)
const personaId = ref(props.catalog.default)
const speedId = ref<VoiceSpeedId>('normal')
const previewing = ref<string | null>(null)
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
let previewToken = 0
let previewAbort: AbortController | null = null

const logEl = ref<HTMLElement | null>(null)
const audioEl = ref<HTMLAudioElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

let player: WavPlayer | null = null
const recorder = new MicRecorder()
/** One VAD per call; recreated (recalibrated) only on 다시 듣기 after an idle pause. */
let vad: Vad | null = null

/** Monotonic token: every start / end / turn / listen cycle bumps it so stale async work is ignored. */
let seq = 0
let turnAbort: AbortController | null = null
let bubbleId = 0
let phaseTimer: ReturnType<typeof setTimeout> | null = null
let hintTimer: ReturnType<typeof setTimeout> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let recTimer: ReturnType<typeof setInterval> | null = null
let recStartedAt = 0
let pressActive = false

/* ---------- derived ---------- */
const busy = computed(() => phase.value === 'connecting' || phase.value === 'recognizing' || phase.value === 'thinking')
const canCompose = computed(() => inCall.value && !busy.value && !recording.value)
const micOk = computed(() => micSupported && !micDenied.value && props.health?.asr?.ok !== false)
const handsFreeOn = computed(() => handsFree.value && micOk.value)
const showComposer = computed(() => !handsFreeOn.value || composerOpen.value)
const micTitle = computed(() => (micOk.value ? '누른 채 말하기 (Space)' : MIC_TOOLTIP))
const selectedPersona = computed<VoicePersona | null>(
  () => props.catalog.personas.find((p) => p.id === personaId.value) ?? props.catalog.personas[0] ?? null,
)
const voiceSelection = computed<VoiceSelection>(() => ({ persona: selectedPersona.value?.id ?? personaId.value, speed: speedId.value }))
const personaChip = computed(() => (selectedPersona.value ? `${selectedPersona.value.name} · ${selectedPersona.value.tagline}` : ''))
const modelInfo = computed(() => describeVoiceModels(props.health, selectedPersona.value))
const facts = computed(() => props.voice?.facts ?? [])
const greeting = computed(
  () => props.voice?.greeting ?? `안녕하세요, 콜바 ${props.scenario.industry}입니다. 무엇을 도와드릴까요?`,
)
const pillClass = computed(() => {
  switch (phase.value) {
    case 'listening':
    case 'speaking':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    case 'connecting':
    case 'recognizing':
    case 'thinking':
      return 'bg-stone-950 text-white ring-stone-950'
    case 'error':
      return 'bg-amber-100 text-amber-800 ring-amber-200'
    default:
      return inCall.value ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-stone-100 text-stone-600 ring-stone-200'
  }
})
const showDots = computed(() => busy.value)
/** Hands-free status strip under the transcript. */
const strip = computed<'listening' | 'speech' | 'busy' | 'speaking' | 'paused' | 'resume' | null>(() => {
  if (!inCall.value) return null
  // phase flips to 'listening' before the mic finishes opening — show the strip right away (level 0) to avoid a flicker
  if (listening.value || (phase.value === 'listening' && handsFreeOn.value)) return speechDetected.value ? 'speech' : 'listening'
  if (busy.value) return 'busy'
  if (phase.value === 'speaking') return 'speaking'
  if (!handsFreeOn.value) return null
  if (listenPaused.value) return 'paused'
  if (phase.value === 'idle' || phase.value === 'error') return 'resume'
  return null
})

/* ---------- helpers ---------- */
function fmtMs(ms: number | undefined | null): string | null {
  if (ms === undefined || ms === null || !Number.isFinite(ms)) return null
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

function formatTimings(t: VoiceTimings): string {
  const parts: string[] = []
  const asr = fmtMs(t.asrMs)
  if (asr) parts.push(`ASR ${asr}`)
  const llm = fmtMs(t.llmMs)
  if (llm) parts.push(`LLM ${llm}`)
  if (t.ttsError) parts.push('TTS 실패')
  else {
    const tts = fmtMs(t.ttsMs)
    if (tts) parts.push(`TTS ${tts}`)
  }
  return parts.join(' · ')
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

function errorText(err: unknown): string {
  if (err instanceof VoiceApiError) return err.message
  if (err instanceof Error && err.message) return err.message
  return '알 수 없는 오류가 발생했습니다.'
}

function push(bubble: Omit<Bubble, 'id'>): Bubble {
  const item: Bubble = { id: ++bubbleId, ...bubble }
  bubbles.value.push(item)
  scrollLog()
  return bubbles.value[bubbles.value.length - 1] as Bubble
}

function scrollLog() {
  nextTick(() => {
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  })
}

function setError(message: string) {
  errorMsg.value = message
  phase.value = 'error'
}

function clearTimer(handle: ReturnType<typeof setTimeout> | null) {
  if (handle !== null) clearTimeout(handle)
  return null
}

function abortTurn() {
  turnAbort?.abort()
  turnAbort = null
  phaseTimer = clearTimer(phaseTimer)
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Mic failed → remember, tell the user, fall back to the text composer. */
function fallbackToText(err: unknown) {
  const info = describeMicError(err)
  if (info.denied) micDenied.value = true
  notice.value = `${TEXT_FALLBACK_NOTICE} (${info.message})`
  composerOpen.value = true
}

/* ---------- hands-free listening ---------- */
function clearIdleTimers() {
  hintTimer = clearTimer(hintTimer)
  idleTimer = clearTimer(idleTimer)
}

function scheduleIdleTimers(token: number) {
  clearIdleTimers()
  hintTimer = setTimeout(() => {
    if (token === seq && listening.value && !speechDetected.value) hint.value = '말씀하시면 자동으로 인식됩니다'
  }, HINT_AFTER_MS)
  idleTimer = setTimeout(() => {
    if (token === seq && listening.value && !speechDetected.value) pauseListening()
  }, IDLE_STOP_MS)
}

/** Gate the mic (input ignored) and stop feeding the VAD. The stream stays open. */
function stopListening() {
  clearIdleTimers()
  recorder.onLevel = null
  recorder.cancel() // drop any partial capture + pause
  listening.value = false
  speechDetected.value = false
  speechSec.value = 0
  level.value = 0
}

/** 30 s without speech: stop so requests do not keep flowing while nobody is there. */
function pauseListening() {
  stopListening()
  listenPaused.value = true
  phase.value = 'idle'
  hint.value = '응답이 없어 듣기를 멈췄습니다.'
}

async function startListening(options: { recalibrate?: boolean } = {}) {
  if (!inCall.value || !handsFreeOn.value) return
  const token = ++seq
  abortTurn()
  player?.stop()
  stopListening()
  listenPaused.value = false
  hint.value = null
  phase.value = 'listening'

  if (!recorder.isOpen) {
    // normally opened in 통화 시작; happens when hands-free was switched on mid-call
    try {
      await recorder.open({ preRollMs: PRE_ROLL_MS })
    } catch (err) {
      if (token !== seq) return
      fallbackToText(err)
      phase.value = 'idle'
      return
    }
    if (token !== seq || !handsFreeOn.value || !inCall.value) {
      // call ended / hands-free switched off / mic lost while the mic was opening
      recorder.pause()
      if (token === seq && phase.value === 'listening') phase.value = 'idle'
      return
    }
  }

  // Calibrate once per call; later cycles reuse the threshold (reset state only).
  if (!vad || options.recalibrate) {
    vad = new Vad({ fallbackThreshold: vadThreshold.value ?? VAD_FALLBACK_THRESHOLD })
    vadThreshold.value = vad.threshold > 0 ? vad.threshold : null
  } else {
    vad.reset()
  }
  const activeVad = vad
  recorder.resume() // empty pre-roll ring → no speaker tail in the next capture
  listening.value = true
  recorder.onLevel = (rms, t) => {
    if (token !== seq) return
    level.value = rmsToLevel(rms)
    const ev = activeVad.feed(rms, t)
    if (activeVad.state === 'speaking') speechSec.value = activeVad.speechSecAt(t)
    if (!ev) return

    if (ev.type === 'calibrated') {
      vadThreshold.value = ev.threshold
      return
    }
    if (ev.type === 'onset') {
      speechDetected.value = true
      hint.value = null
      recorder.beginCapture()
      clearIdleTimers()
      return
    }
    if (ev.type === 'end') {
      speechDetected.value = false
      speechSec.value = 0
      const rec = recorder.endCapture()
      // Too short / too quiet → ASR tends to hallucinate text; keep listening instead.
      if (ev.speechSec < MIN_UTTERANCE_SEC || ev.peak < activeVad.threshold || rec.samples.length === 0) {
        activeVad.reset()
        scheduleIdleTimers(token)
        return
      }
      stopListening() // input gated during ASR/LLM/TTS and playback (stream stays open)
      const wav = encodeWav(rec.samples, rec.sampleRate)
      void runTurn({ audioBase64: arrayBufferToBase64(wav), seconds: rec.seconds })
    }
  }
  scheduleIdleTimers(token)
}

/** After a reply (or an error) decide what to do next in hands-free mode. */
async function afterTurn(token: number, delayMs: number) {
  if (!inCall.value || token !== seq) return
  if (handsFreeOn.value && !listenPaused.value) {
    await sleep(delayMs)
    if (token !== seq || !inCall.value) return
    void startListening()
  } else if (phase.value !== 'error') {
    phase.value = 'idle'
  }
}

function toggleHandsFree() {
  if (!micOk.value) return
  handsFree.value = !handsFree.value
  if (!handsFree.value) {
    stopListening()
    if (phase.value === 'listening') phase.value = 'idle'
    listenPaused.value = false
    composerOpen.value = true
    return
  }
  composerOpen.value = false
  if (inCall.value && !busy.value && phase.value !== 'speaking' && !recording.value) void startListening()
}

/* ---------- voice preview (before the call only) ---------- */
function stopPreview() {
  ++previewToken
  previewAbort?.abort()
  previewAbort = null
  if (previewing.value !== null) player?.stop()
  previewing.value = null
  previewLoading.value = false
}

async function previewVoice(id: string) {
  if (inCall.value) return
  if (previewing.value === id) {
    stopPreview()
    return
  }
  const persona = props.catalog.personas.find((p) => p.id === id)
  if (!persona) return
  stopPreview()
  const token = previewToken
  const controller = new AbortController()
  previewAbort = controller
  previewError.value = null
  previewing.value = id
  previewLoading.value = true
  try {
    const tts = await fetchVoiceTts(persona.sample, { voice: { persona: id, speed: speedId.value }, signal: controller.signal })
    if (token !== previewToken) return
    previewLoading.value = false
    await player?.play(tts.base64, tts.mime)
    if (token !== previewToken) return
    previewing.value = null
  } catch (err) {
    if (token !== previewToken || isAbort(err)) return
    previewing.value = null
    previewLoading.value = false
    previewError.value = `미리듣기 실패: ${errorText(err)}`
  } finally {
    if (token === previewToken) previewAbort = null
  }
}

/* ---------- call lifecycle ---------- */
async function startCall() {
  const token = ++seq
  stopPreview()
  abortTurn()
  player?.stop()
  stopListening()
  bubbles.value = []
  history.value = []
  errorMsg.value = null
  notice.value = null
  hint.value = null
  turns.value = 0
  ended.value = false
  listenPaused.value = false
  inCall.value = true
  phase.value = 'connecting'
  emit('active', true)
  player?.prime()
  vad = null
  vadThreshold.value = null

  // Permission + AudioContext unlock must start inside the click (before any await).
  // The stream is opened once here and kept for the whole call (gated while not listening).
  const micPrep = handsFreeOn.value
    ? recorder.open({ preRollMs: PRE_ROLL_MS }).then(() => recorder.pause())
    : Promise.resolve()
  const text = greeting.value
  const controller = new AbortController()
  turnAbort = controller
  const ttsPromise = fetchVoiceTts(text, { voice: voiceSelection.value, signal: controller.signal })

  try {
    await micPrep
  } catch (err) {
    if (token !== seq) return
    fallbackToText(err)
  }

  try {
    const tts = await ttsPromise
    if (token !== seq) return
    turnAbort = null
    const caption = [
      tts.elapsedMs ? `TTS ${fmtMs(tts.elapsedMs)}` : null,
      tts.seconds ? `${tts.seconds.toFixed(1)}s` : null,
      selectedPersona.value?.name ?? null,
    ]
      .filter(Boolean)
      .join(' · ')
    push({ role: 'assistant', text, caption, pending: false, warn: false })
    phase.value = 'speaking'
    await player?.play(tts.base64, tts.mime)
    if (token !== seq) return
    if (phase.value === 'speaking') phase.value = 'idle'
    await afterTurn(token, RELISTEN_DELAY_MS)
    if (token === seq && !handsFreeOn.value) focusInput()
  } catch (err) {
    if (token !== seq || isAbort(err)) return
    turnAbort = null
    // Greeting voice failed — still show the text so the conversation can continue.
    if (bubbles.value.length === 0) push({ role: 'assistant', text, caption: '음성 합성 실패 · 텍스트로 진행', pending: false, warn: true })
    setError(errorText(err))
    void afterTurn(token, ERROR_RELISTEN_MS)
  }
}

function endCall() {
  ++seq
  abortTurn()
  player?.stop()
  stopListening()
  if (recording.value || pressActive) cancelRecording()
  recorder.close() // tracks stop only here / on unmount
  vad = null
  vadThreshold.value = null
  const hadTurns = bubbles.value.length > 0
  inCall.value = false
  emit('active', false)
  ended.value = hadTurns
  phase.value = 'idle'
  errorMsg.value = null
  notice.value = null
  hint.value = null
  draft.value = ''
  listenPaused.value = false
  composerOpen.value = false
  bubbles.value = []
  history.value = []
}

/* ---------- turns ---------- */
interface TurnInput {
  text?: string
  audioBase64?: string
  seconds?: number
}

async function runTurn(input: TurnInput) {
  if (!inCall.value) return
  const token = ++seq
  abortTurn()
  player?.stop()
  stopListening()
  listenPaused.value = false // any turn (incl. typed text) proves the user is present → auto-listen may resume after the reply
  errorMsg.value = null
  hint.value = null

  const isAudio = !!input.audioBase64
  const userBubble = push({
    role: 'user',
    text: input.text ?? '',
    caption: isAudio && input.seconds ? `음성 ${input.seconds.toFixed(1)}s` : '',
    pending: isAudio,
    warn: false,
  })
  phase.value = isAudio ? 'recognizing' : 'thinking'
  if (isAudio) {
    phaseTimer = setTimeout(() => {
      if (token === seq && phase.value === 'recognizing') phase.value = 'thinking'
    }, ASR_ESTIMATE_MS)
  }

  const controller = new AbortController()
  turnAbort = controller
  try {
    const res = await postVoiceTurn(
      {
        scenarioId: props.scenario.id,
        ...(isAudio ? { audioBase64: input.audioBase64 } : { text: input.text }),
        ...(history.value.length ? { history: history.value } : {}),
        voice: voiceSelection.value,
      },
      controller.signal,
    )
    if (token !== seq) return
    turnAbort = null
    phaseTimer = clearTimer(phaseTimer)

    userBubble.pending = false
    if (isAudio) {
      userBubble.text = res.transcript?.trim() || '(인식된 내용이 없습니다)'
      const asr = fmtMs(res.timings?.asrMs)
      userBubble.caption = [userBubble.caption, asr ? `ASR ${asr}` : null].filter(Boolean).join(' · ')
    }
    const timings = res.timings ?? { llmMs: 0, totalMs: 0 }
    push({
      role: 'assistant',
      text: res.reply,
      caption: [formatTimings(timings), res.audio?.voice?.voice ?? null].filter(Boolean).join(' · '),
      pending: false,
      warn: !!timings.ttsError || !res.audio,
    })
    history.value = Array.isArray(res.history) ? res.history : history.value
    turns.value += 1

    if (res.audio?.base64) {
      phase.value = 'speaking'
      try {
        await player?.play(res.audio.base64, res.audio.mime || 'audio/wav')
      } catch (err) {
        if (token === seq) {
          setError(errorText(err))
          void afterTurn(token, ERROR_RELISTEN_MS)
        }
        return
      }
    }
    if (token !== seq) return
    if (phase.value === 'speaking') phase.value = 'idle'
    await afterTurn(token, RELISTEN_DELAY_MS)
    if (token === seq && !isAudio && !handsFreeOn.value) focusInput()
  } catch (err) {
    if (token !== seq || isAbort(err)) return
    turnAbort = null
    phaseTimer = clearTimer(phaseTimer)
    userBubble.pending = false
    if (!userBubble.text) userBubble.text = '(음성 메시지)'
    setError(errorText(err))
    void afterTurn(token, ERROR_RELISTEN_MS)
  }
}

function sendText() {
  const text = draft.value.trim()
  if (!text || !canCompose.value) return
  draft.value = ''
  void runTurn({ text })
}

function focusInput() {
  nextTick(() => {
    const el = inputEl.value
    if (el && !el.disabled && !recording.value && document.activeElement !== el && window.matchMedia('(hover: hover)').matches) el.focus()
  })
}

/* ---------- hold-to-talk (hands-free off) ---------- */
async function onMicPress() {
  if (!inCall.value || busy.value || recording.value || listening.value || !micOk.value) return
  pressActive = true
  const token = ++seq
  abortTurn()
  player?.stop()
  errorMsg.value = null
  hint.value = null
  phase.value = 'listening'
  recorder.onLevel = (rms) => {
    micLevel.value = Math.min(1, rms * 5)
  }
  try {
    await recorder.start()
  } catch (err) {
    pressActive = false
    recorder.onLevel = null
    if (token !== seq) return
    const info = describeMicError(err)
    if (info.denied) micDenied.value = true
    phase.value = 'idle'
    hint.value = info.message
    return
  }
  if (token !== seq || !pressActive) {
    // Released (or call ended) before the mic opened.
    recorder.cancel()
    recorder.onLevel = null
    if (token === seq) phase.value = 'idle'
    pressActive = false
    return
  }
  recording.value = true
  recStartedAt = performance.now()
  recProgress.value = 0
  recElapsed.value = 0
  recTimer = setInterval(() => {
    const elapsed = performance.now() - recStartedAt
    recElapsed.value = elapsed / 1000
    recProgress.value = Math.min(1, elapsed / MAX_RECORD_MS)
    if (elapsed >= MAX_RECORD_MS) finishRecording()
  }, 100)
}

function onMicRelease() {
  if (!pressActive && !recording.value) return
  pressActive = false
  if (recording.value) finishRecording()
}

function stopRecTimer() {
  if (recTimer !== null) {
    clearInterval(recTimer)
    recTimer = null
  }
}

function finishRecording() {
  if (!recording.value) return
  stopRecTimer()
  recording.value = false
  pressActive = false
  recProgress.value = 0
  micLevel.value = 0
  recorder.onLevel = null
  const rec = recorder.stop()
  if (rec.seconds < MIN_HOLD_SEC) {
    phase.value = 'idle'
    hint.value = '녹음이 너무 짧습니다. 버튼을 누른 채 말씀해 주세요.'
    return
  }
  const wav = encodeWav(rec.samples, rec.sampleRate)
  void runTurn({ audioBase64: arrayBufferToBase64(wav), seconds: rec.seconds })
}

function cancelRecording() {
  stopRecTimer()
  recorder.onLevel = null
  recorder.cancel()
  recording.value = false
  pressActive = false
  recProgress.value = 0
  recElapsed.value = 0
  micLevel.value = 0
}

/* ---------- lifecycle ---------- */
onMounted(() => {
  if (audioEl.value) {
    player = new WavPlayer(audioEl.value)
    player.onstate = (state) => {
      if (state === 'idle' && phase.value === 'speaking') phase.value = 'idle'
    }
  }
})

onBeforeUnmount(() => {
  ++seq
  stopPreview()
  abortTurn()
  player?.stop()
  stopListening()
  cancelRecording()
  void recorder.dispose()
  emit('active', false)
})

watch(micOk, (ok) => {
  if (!ok) {
    if (listening.value) {
      stopListening()
      if (phase.value === 'listening') phase.value = 'idle'
    }
    if (recording.value) cancelRecording()
    recorder.close()
    composerOpen.value = true
  }
})

watch(phase, () => scrollLog())
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="live-panel">
    <!-- Call card -->
    <div class="flex min-h-[360px] flex-col rounded-2xl border border-stone-200 bg-white">
      <!-- Header strip -->
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-stone-100 px-4 py-3">
        <div class="flex min-w-0 items-center gap-2.5">
          <span :class="ui.iconCircleEmerald">
            <component :is="scenario.outbound ? PhoneOutgoing : PhoneCall" class="h-4 w-4" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <span :class="ui.chip">{{ scenario.industry }}</span>
              <span v-if="scenario.outbound" :class="ui.chipAmber">아웃바운드</span>
              <span :class="ui.chipEmerald">GPU</span>
              <span v-if="inCall && selectedPersona" :class="ui.chip" data-testid="live-persona-chip">{{ selectedPersona.name }}</span>
            </div>
            <p class="mt-1 truncate text-sm font-semibold text-stone-950">{{ scenario.title }}</p>
            <p v-if="modelInfo" class="mt-0.5 truncate text-[11px] text-stone-400" data-testid="live-models">{{ modelInfo }}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <!-- hands-free switch -->
          <button
            type="button"
            role="switch"
            :aria-checked="handsFree ? 'true' : 'false'"
            :disabled="!micOk"
            :title="micOk ? '켜면 말을 자동으로 감지해 보냅니다' : MIC_TOOLTIP"
            class="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11px] font-semibold transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :class="handsFreeOn ? 'text-emerald-800' : 'text-stone-600'"
            data-testid="live-handsfree"
            @click="toggleHandsFree"
          >
            <span
              class="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors"
              :class="handsFreeOn ? 'bg-emerald-600' : 'bg-stone-300'"
              aria-hidden="true"
            >
              <span
                class="absolute left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
                :class="handsFreeOn ? 'translate-x-3' : 'translate-x-0'"
              />
            </span>
            <Headphones class="h-3.5 w-3.5" aria-hidden="true" />
            핸즈프리
          </button>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1"
            :class="pillClass"
            aria-live="polite"
            data-testid="live-status"
          >
            <span
              v-if="phase !== 'idle' && phase !== 'error'"
              class="h-1.5 w-1.5 rounded-full bg-current motion-reduce:animate-none"
              :class="phase === 'listening' || phase === 'speaking' ? 'animate-pulse-soft' : 'animate-pulse'"
              aria-hidden="true"
            />
            {{ phaseLabel[phase] }}
          </span>
          <button
            v-if="inCall"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
            data-testid="live-end"
            @click="endCall"
          >
            <PhoneOff class="h-3.5 w-3.5" aria-hidden="true" />
            통화 종료
          </button>
        </div>
      </div>

      <!-- Idle / start screen: voice picker + 통화 시작 -->
      <div v-if="!inCall" class="flex flex-1 flex-col px-4 py-5 sm:px-5">
        <div class="flex flex-col items-center text-center">
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
            <component :is="scenario.outbound ? PhoneOutgoing : PhoneCall" class="h-5 w-5" aria-hidden="true" />
          </span>
          <p v-if="ended" class="mt-4 text-sm font-semibold text-stone-900">통화가 종료되었습니다</p>
          <p class="mt-2 text-sm leading-6 text-stone-600">
          <template v-if="ended">같은 시나리오로 다시 시작하거나 데모를 닫을 수 있습니다.</template>
          <template v-else-if="handsFreeOn">
            버튼을 누르면 마이크 권한을 묻고 AI 상담원이 먼저 인사합니다.<br />
            인사가 끝나면 전화처럼 그냥 말씀하세요 — 자동으로 인식합니다.
          </template>
          <template v-else-if="micOk">
            버튼을 누르면 AI 상담원이 먼저 인사합니다.<br />
            마이크를 누른 채 말하거나, 텍스트로 대화해 보세요.
          </template>
          <template v-else>
            버튼을 누르면 AI 상담원이 먼저 인사합니다.<br />
            텍스트로 대화해 보세요.
          </template>
          </p>
        </div>

        <VoicePicker
          class="mt-5"
          :catalog="catalog"
          :persona="personaId"
          :speed="speedId"
          :previewing="previewing"
          :preview-loading="previewLoading"
          :preview-error="previewError"
          @update:persona="personaId = $event"
          @update:speed="speedId = $event"
          @preview="previewVoice"
        />

        <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button type="button" :class="ui.btnPrimary" data-testid="live-start" @click="startCall">
            <PhoneCall class="h-4 w-4" aria-hidden="true" />
            {{ ended ? '다시 통화 시작' : '통화 시작' }}
          </button>
          <button v-if="ended" type="button" :class="ui.linkEmerald" @click="emit('close')">
            <X class="h-4 w-4" aria-hidden="true" />
            데모 닫기
          </button>
        </div>
      </div>

      <!-- Conversation -->
      <div v-else class="flex flex-1 flex-col">
        <div ref="logEl" class="flex max-h-[min(50vh,22rem)] min-h-[200px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite" data-testid="live-log">
          <div
            v-for="bubble in bubbles"
            :key="bubble.id"
            class="flex max-w-[85%] animate-fade-up flex-col gap-1"
            :class="bubble.role === 'assistant' ? 'self-start items-start' : 'self-end items-end'"
            data-testid="live-bubble"
            :data-role="bubble.role"
          >
            <span class="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400">
              <component :is="bubble.role === 'assistant' ? Bot : User" class="h-3 w-3" aria-hidden="true" />
              {{ bubble.role === 'assistant' ? 'AI 상담원' : '나' }}
            </span>
            <p
              class="rounded-2xl px-4 py-2.5 text-sm leading-6"
              :class="[
                bubble.role === 'assistant' ? 'rounded-bl-md bg-stone-100 text-stone-800' : 'rounded-br-md bg-stone-950 text-white',
                bubble.pending ? 'italic opacity-70' : '',
              ]"
              data-testid="live-bubble-text"
            >
              <template v-if="bubble.pending">음성 인식 중…</template>
              <template v-else>{{ bubble.text }}</template>
            </p>
            <span
              v-if="bubble.caption"
              class="inline-flex items-center gap-1 px-1 text-[10px] tabular-nums"
              :class="bubble.warn ? 'text-amber-700' : 'text-stone-400'"
              data-testid="live-timing"
            >
              <AlertTriangle v-if="bubble.warn" class="h-3 w-3" aria-hidden="true" />
              {{ bubble.caption }}
            </span>
          </div>
          <div v-if="showDots" class="flex items-center gap-1.5 self-start px-1 text-xs text-stone-400" aria-hidden="true">
            <span class="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone-400 motion-reduce:animate-none" />
            <span class="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone-400 motion-reduce:animate-none [animation-delay:200ms]" />
            <span class="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone-400 motion-reduce:animate-none [animation-delay:400ms]" />
          </div>
        </div>

        <!-- Notices -->
        <div
          v-if="notice"
          class="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
          role="status"
          data-testid="live-notice"
        >
          <Mic class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span class="min-w-0 flex-1">{{ notice }}</span>
          <button type="button" class="shrink-0 rounded px-1 font-semibold hover:bg-amber-100" aria-label="안내 닫기" @click="notice = null">
            <X class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <div
          v-if="errorMsg"
          class="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
          role="alert"
          data-testid="live-error"
        >
          <AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span class="min-w-0 flex-1">{{ errorMsg }}</span>
          <button type="button" class="shrink-0 rounded px-1 font-semibold hover:bg-amber-100" aria-label="오류 닫기" @click="errorMsg = null; if (phase === 'error') phase = 'idle'">
            <X class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <!-- Hands-free status strip -->
        <div
          v-if="strip"
          class="flex min-h-[3.25rem] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-stone-100 px-4 py-2.5"
          data-testid="live-strip"
          :data-strip="strip"
          :data-threshold="vadThreshold ?? ''"
        >
          <span v-if="personaChip" class="order-last basis-full text-[11px] text-stone-400 sm:order-none sm:basis-auto" data-testid="live-strip-persona">
            <span :class="ui.chip">{{ personaChip }}</span>
          </span>
          <template v-if="strip === 'listening' || strip === 'speech'">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                :class="strip === 'speech' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'"
                aria-hidden="true"
              >
                <Mic class="h-4 w-4" />
              </span>
              <LevelMeter :level="level" :active="strip === 'speech'" />
            </div>
            <p class="text-xs leading-5" :class="strip === 'speech' ? 'font-semibold text-emerald-700' : hint ? 'text-amber-700' : 'text-stone-500'" data-testid="live-strip-text">
              <template v-if="strip === 'speech'">음성 감지 중 · <span class="tabular-nums">{{ speechSec.toFixed(1) }}초</span></template>
              <template v-else-if="hint">{{ hint }}</template>
              <template v-else>듣고 있어요 — 편하게 말씀하세요</template>
            </p>
          </template>
          <template v-else-if="strip === 'busy'">
            <div class="flex items-center gap-3 text-xs text-stone-500">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-950 text-white" aria-hidden="true">
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              </span>
              <span data-testid="live-strip-text">{{ phase === 'recognizing' ? '음성을 인식하는 중…' : '답변을 생성하는 중…' }}</span>
            </div>
          </template>
          <template v-else-if="strip === 'speaking'">
            <div class="flex items-center gap-3 text-xs text-stone-500">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" aria-hidden="true">
                <Volume2 class="h-4 w-4" />
              </span>
              <span data-testid="live-strip-text">AI가 말하는 중 · 마이크 꺼짐</span>
            </div>
          </template>
          <template v-else>
            <p class="text-xs leading-5" :class="strip === 'paused' ? 'text-amber-700' : 'text-stone-500'" data-testid="live-strip-text">
              {{ strip === 'paused' ? (hint ?? '응답이 없어 듣기를 멈췄습니다.') : '듣기가 멈춰 있습니다.' }}
            </p>
            <button type="button" :class="[ui.btnPillLight, 'py-2 text-xs']" data-testid="live-resume" @click="startListening({ recalibrate: true })">
              <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
              다시 듣기
            </button>
          </template>
        </div>

        <!-- Text composer (collapsible in hands-free mode) -->
        <div class="border-t border-stone-100">
          <button
            v-if="handsFreeOn"
            type="button"
            class="flex w-full items-center justify-between px-4 py-2 text-[11px] font-semibold text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            :aria-expanded="composerOpen ? 'true' : 'false'"
            aria-controls="live-composer"
            data-testid="live-composer-toggle"
            @click="composerOpen = !composerOpen"
          >
            <span class="inline-flex items-center gap-1.5"><Keyboard class="h-3.5 w-3.5" aria-hidden="true" /> 텍스트로 입력</span>
            <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="composerOpen ? 'rotate-180' : ''" aria-hidden="true" />
          </button>
          <form v-show="showComposer" id="live-composer" class="px-4 pb-3" :class="handsFreeOn ? 'pt-1' : 'pt-3'" data-testid="live-composer" @submit.prevent="sendText">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label for="live-text-input" class="sr-only">메시지 입력</label>
              <input
                id="live-text-input"
                ref="inputEl"
                v-model="draft"
                type="text"
                autocomplete="off"
                enterkeyhint="send"
                maxlength="300"
                :disabled="!canCompose"
                :placeholder="recording ? '듣고 있어요… 버튼을 떼면 전송됩니다' : busy ? 'AI가 응답을 준비하는 중입니다…' : '예: 토요일 저녁 6시에 8명 단체석 되나요?'"
                class="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-50 disabled:text-stone-400"
                data-testid="live-input"
              />
              <div class="flex items-center justify-end gap-2">
                <MicButton
                  v-if="!handsFreeOn"
                  :disabled="!inCall || busy || !micOk || listening"
                  :recording="recording"
                  :progress="recProgress"
                  :level="micLevel"
                  :title="micTitle"
                  @press="onMicPress"
                  @release="onMicRelease"
                />
                <button
                  type="submit"
                  class="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!canCompose || !draft.trim()"
                  data-testid="live-send"
                >
                  <SendHorizontal class="h-4 w-4" aria-hidden="true" />
                  보내기
                </button>
              </div>
            </div>
            <p v-if="!handsFreeOn" class="mt-2 min-h-[1.25rem] text-[11px] leading-5" :class="hint ? 'text-amber-700' : 'text-stone-400'" data-testid="live-hint">
              <template v-if="recording">
                <span class="font-semibold text-emerald-700 tabular-nums">{{ recElapsed.toFixed(1) }}초</span>
                · 버튼을 떼면 전송 · 최대 15초
              </template>
              <template v-else-if="hint">{{ hint }}</template>
              <template v-else-if="!micOk">{{ MIC_TOOLTIP }}</template>
              <template v-else>마이크 버튼을 누른 채 말하고, 떼면 전송됩니다 · 최대 15초 · Enter로 텍스트 전송</template>
            </p>
          </form>
        </div>
      </div>

      <audio ref="audioEl" preload="auto" class="hidden" data-testid="live-audio" />
    </div>

    <!-- Sample info -->
    <details class="group rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 sm:px-5" data-testid="live-facts">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-stone-500 [&::-webkit-details-marker]:hidden">
        샘플 정보
        <ChevronDown class="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <ul class="mt-3 space-y-2">
        <li v-for="fact in facts" :key="fact" class="flex items-start gap-2 text-sm leading-6 text-stone-700">
          <span class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>{{ fact }}</span>
        </li>
        <li v-if="facts.length === 0" class="text-sm text-stone-500">이 시나리오의 샘플 정보가 없습니다.</li>
      </ul>
    </details>

    <p class="px-1 text-xs leading-5 text-stone-500">
      GPU 서버의 Qwen3.5 4B · Qwen3-TTS · Qwen3-ASR 모델로 처리됩니다. 실제 전화망 연결이 아닌 웹 데모이며 숫자·고유명사 인식이 틀릴 수 있습니다.
    </p>
  </div>
</template>
