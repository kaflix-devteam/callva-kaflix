<script setup lang="ts">
/**
 * "실제 AI 통화" — browser side of the live demo.
 *
 * One turn = POST /api/voice/turn (ASR → LLM → TTS on the GPU server). The server
 * does not stream progress, so the 인식 중 → 생각 중 transition shown while an
 * audio turn is in flight is a client-side estimate (~1.2 s), not a server event.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AlertTriangle, Bot, ChevronDown, PhoneCall, PhoneOff, PhoneOutgoing, SendHorizontal, User, X } from 'lucide-vue-next'
import type { DemoScenario } from '@/data/demoScenarios'
import { ui } from '@/lib/ui'
import {
  VoiceApiError,
  describeVoiceModels,
  fetchVoiceTts,
  postVoiceTurn,
  type VoiceHealth,
  type VoiceHistoryItem,
  type VoiceScenario,
  type VoiceTimings,
} from '@/lib/voice/client'
import { arrayBufferToBase64, encodeWav } from '@/lib/voice/wav'
import { MicRecorder, describeMicError, isRecorderSupported } from '@/lib/voice/recorder'
import { WavPlayer } from '@/lib/voice/player'
import MicButton from './MicButton.vue'

const props = defineProps<{
  scenario: DemoScenario
  voice: VoiceScenario | null
  health: VoiceHealth | null
}>()
const emit = defineEmits<{ close: []; active: [value: boolean] }>()

/* ---------- constants ---------- */
const MAX_RECORD_MS = 15_000
const MIN_RECORD_SEC = 0.3
const ASR_ESTIMATE_MS = 1_200
const MIC_TOOLTIP = '마이크를 사용할 수 없어 텍스트로만 대화합니다'

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
const hint = ref<string | null>(null)
const draft = ref('')
const turns = ref(0)

const recording = ref(false)
const recProgress = ref(0)
const recElapsed = ref(0)
const micLevel = ref(0)
const micDenied = ref(false)
const micSupported = isRecorderSupported()

const logEl = ref<HTMLElement | null>(null)
const audioEl = ref<HTMLAudioElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

let player: WavPlayer | null = null
const recorder = new MicRecorder()
recorder.onlevel = (level) => {
  micLevel.value = Math.min(1, level * 5)
}

/** Monotonic token: every start / end / turn / recording bumps it so stale async work is ignored. */
let seq = 0
let turnAbort: AbortController | null = null
let bubbleId = 0
let recTimer: ReturnType<typeof setInterval> | null = null
let recStartedAt = 0
let pressActive = false
let phaseTimer: ReturnType<typeof setTimeout> | null = null

/* ---------- derived ---------- */
const busy = computed(() => phase.value === 'connecting' || phase.value === 'recognizing' || phase.value === 'thinking')
const canCompose = computed(() => inCall.value && !busy.value && !recording.value)
const micAvailable = computed(() => micSupported && !micDenied.value && props.health?.asr?.ok !== false)
const micTitle = computed(() => (micAvailable.value ? '누른 채 말하기 (Space)' : MIC_TOOLTIP))
const modelInfo = computed(() => describeVoiceModels(props.health))
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

function clearPhaseTimer() {
  if (phaseTimer !== null) {
    clearTimeout(phaseTimer)
    phaseTimer = null
  }
}

function abortTurn() {
  turnAbort?.abort()
  turnAbort = null
  clearPhaseTimer()
}

/* ---------- call lifecycle ---------- */
async function startCall() {
  const token = ++seq
  abortTurn()
  player?.stop()
  bubbles.value = []
  history.value = []
  errorMsg.value = null
  hint.value = null
  turns.value = 0
  ended.value = false
  inCall.value = true
  phase.value = 'connecting'
  emit('active', true)
  player?.prime()

  const text = greeting.value
  const controller = new AbortController()
  turnAbort = controller
  try {
    const tts = await fetchVoiceTts(text, controller.signal)
    if (token !== seq) return
    turnAbort = null
    const caption = [tts.elapsedMs ? `TTS ${fmtMs(tts.elapsedMs)}` : null, tts.seconds ? `${tts.seconds.toFixed(1)}s` : null]
      .filter(Boolean)
      .join(' · ')
    push({ role: 'assistant', text, caption, pending: false, warn: false })
    phase.value = 'speaking'
    await player?.play(tts.base64, tts.mime)
    if (token === seq && phase.value === 'speaking') phase.value = 'idle'
    focusInput()
  } catch (err) {
    if (token !== seq || isAbort(err)) return
    turnAbort = null
    // Greeting voice failed — still show the text so the text conversation can continue.
    if (bubbles.value.length === 0) push({ role: 'assistant', text, caption: '음성 합성 실패 · 텍스트로 진행', pending: false, warn: true })
    setError(errorText(err))
  }
}

function endCall() {
  ++seq
  abortTurn()
  player?.stop()
  if (recording.value || pressActive) cancelRecording()
  const hadTurns = bubbles.value.length > 0
  inCall.value = false
  emit('active', false)
  ended.value = hadTurns
  phase.value = 'idle'
  errorMsg.value = null
  hint.value = null
  draft.value = ''
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
      },
      controller.signal,
    )
    if (token !== seq) return
    turnAbort = null
    clearPhaseTimer()

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
      caption: formatTimings(timings),
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
        if (token === seq) setError(errorText(err))
        return
      }
    }
    if (token === seq && phase.value === 'speaking') phase.value = 'idle'
    if (token === seq && !isAudio) focusInput()
  } catch (err) {
    if (token !== seq || isAbort(err)) return
    turnAbort = null
    clearPhaseTimer()
    userBubble.pending = false
    if (!userBubble.text) userBubble.text = '(음성 메시지)'
    setError(errorText(err))
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

/* ---------- recording ---------- */
async function onMicPress() {
  if (!inCall.value || busy.value || recording.value || !micAvailable.value) return
  pressActive = true
  const token = ++seq
  abortTurn()
  player?.stop()
  errorMsg.value = null
  hint.value = null
  phase.value = 'listening'
  try {
    await recorder.start()
  } catch (err) {
    pressActive = false
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
  const rec = recorder.stop()
  const seconds = Math.min(rec.seconds, rec.sampleRate > 0 ? rec.samples.length / rec.sampleRate : rec.seconds)
  if (seconds < MIN_RECORD_SEC || rec.samples.length < rec.sampleRate * MIN_RECORD_SEC) {
    phase.value = 'idle'
    hint.value = '녹음이 너무 짧습니다. 버튼을 누른 채 말씀해 주세요.'
    return
  }
  const wav = encodeWav(rec.samples, rec.sampleRate)
  void runTurn({ audioBase64: arrayBufferToBase64(wav), seconds })
}

function cancelRecording() {
  stopRecTimer()
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
  abortTurn()
  player?.stop()
  cancelRecording()
  void recorder.dispose()
  emit('active', false)
})

watch(
  () => props.health?.asr?.ok,
  (ok) => {
    if (ok === false && recording.value) cancelRecording()
  },
)

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
            </div>
            <p class="mt-1 truncate text-sm font-semibold text-stone-950">{{ scenario.title }}</p>
            <p v-if="modelInfo" class="mt-0.5 truncate text-[11px] text-stone-400" data-testid="live-models">{{ modelInfo }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
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

      <!-- Idle / start screen -->
      <div v-if="!inCall" class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <span class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
          <component :is="scenario.outbound ? PhoneOutgoing : PhoneCall" class="h-6 w-6" aria-hidden="true" />
        </span>
        <p v-if="ended" class="mt-5 text-sm font-semibold text-stone-900">통화가 종료되었습니다</p>
        <p class="mt-2 text-sm leading-6 text-stone-600">
          <template v-if="ended">같은 시나리오로 다시 시작하거나 데모를 닫을 수 있습니다.</template>
          <template v-else>
            버튼을 누르면 AI 상담원이 먼저 인사합니다.<br />
            <template v-if="micAvailable">마이크를 누른 채 말하거나, 텍스트로 대화해 보세요.</template>
            <template v-else>텍스트로 대화해 보세요.</template>
          </template>
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
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

        <!-- Inline error -->
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

        <!-- Composer -->
        <form class="border-t border-stone-100 px-4 py-3" @submit.prevent="sendText">
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
                :disabled="!inCall || busy || !micAvailable"
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
          <p class="mt-2 min-h-[1.25rem] text-[11px] leading-5" :class="hint ? 'text-amber-700' : 'text-stone-400'" data-testid="live-hint">
            <template v-if="recording">
              <span class="font-semibold text-emerald-700 tabular-nums">{{ recElapsed.toFixed(1) }}초</span>
              · 버튼을 떼면 전송 · 최대 15초
            </template>
            <template v-else-if="hint">{{ hint }}</template>
            <template v-else-if="!micAvailable">{{ MIC_TOOLTIP }}</template>
            <template v-else>마이크 버튼을 누른 채 말하고, 떼면 전송됩니다 · 최대 15초 · Enter로 텍스트 전송</template>
          </p>
        </form>
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
