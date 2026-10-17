<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Bot, CheckCircle2, Info, Loader2, PhoneCall, PhoneOutgoing, Radio, RotateCcw, User, X } from 'lucide-vue-next'
import type { DemoScenario } from '@/data/demoScenarios'
import { demoTranscripts, type TranscriptLine } from '@/data/demoTranscripts'
import { ui } from '@/lib/ui'
import {
  describeVoiceUnavailable,
  fetchVoiceHealth,
  fetchVoicePersonas,
  type VoiceHealth,
  type VoicePersonasResponse,
  type VoiceScenario,
} from '@/lib/voice/client'
import voiceScenarios from '@shared/voiceScenarios.json'
import voicePersonas from '@shared/voicePersonas.json'
import LiveCallPanel from './live/LiveCallPanel.vue'
import LiveUnavailable from './live/LiveUnavailable.vue'

const props = defineProps<{ scenario: DemoScenario | null }>()
const emit = defineEmits<{ close: [] }>()

const LINE_INTERVAL_MS = 900
const HEALTH_INTERVAL_MS = 20_000
/** The live tab waits at most this long for the first health answer before falling back to the script. */
const HEALTH_TIMEOUT_MS = 6_000

const isOpen = computed(() => props.scenario !== null)
const transcript = computed(() => (props.scenario ? demoTranscripts[props.scenario.id] : undefined))
const titleId = computed(() => `demo-modal-title-${props.scenario?.id ?? 'none'}`)

/* ---------- mode: AI 통화 (default) | 대본 미리보기 ---------- */
type Mode = 'sim' | 'live'
const mode = ref<Mode>('live')
const dialogEl = ref<HTMLElement | null>(null)
/** first health check of this open has answered (ok or not) */
const healthResolved = ref(false)
/** we moved the user to the script because the voice server was unavailable on open */
const autoSwitched = ref(false)
let userPickedTab = false

const voiceEntry = computed<VoiceScenario | null>(() => {
  const id = props.scenario?.id
  if (!id) return null
  return (voiceScenarios.scenarios as VoiceScenario[]).find((s) => s.id === id) ?? null
})

/* ---------- voice personas (local JSON first, API when it answers) ---------- */
function localVoiceCatalog(): VoicePersonasResponse {
  // Narrow to the contract shape — openai/qwen/style fields are server-side only.
  return {
    default: voicePersonas.default,
    speeds: voicePersonas.speeds.map((s) => ({ id: s.id as VoicePersonasResponse['speeds'][number]['id'], label: s.label, factor: s.factor })),
    personas: voicePersonas.personas.map((p) => {
      const raw = p as Record<string, unknown>
      return {
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        sample: p.sample,
        gender: p.gender,
        provider: raw.provider === 'qwen' || raw.provider === 'openai' ? raw.provider : null,
        supportsSpeed: raw.supportsSpeed !== false,
      }
    }),
  }
}
const voiceCatalog = ref<VoicePersonasResponse>(localVoiceCatalog())
let personasFetched = false

async function loadVoicePersonas() {
  if (personasFetched) return
  try {
    const res = await fetchVoicePersonas()
    if (Array.isArray(res.personas) && res.personas.length > 0 && Array.isArray(res.speeds) && res.speeds.length > 0) {
      voiceCatalog.value = res
      personasFetched = true
    }
  } catch {
    /* older server / tunnel down → keep the local catalog */
  }
}

/* ---------- live health ---------- */
const health = ref<VoiceHealth | null>(null)
const healthError = ref<unknown>(null)
const healthChecking = ref(false)
let healthTimer: ReturnType<typeof setInterval> | null = null
let healthAbort: AbortController | null = null

const liveEnabled = computed(() => !healthError.value && health.value?.enabled === true)
/** true from 통화 시작 to 통화 종료 — a transient health failure must not unmount a live conversation. */
const liveActive = ref(false)
const liveReason = computed(() => describeVoiceUnavailable(health.value, healthError.value) ?? '')

function healthSignal(controller: AbortController): AbortSignal {
  // TimeoutError (not AbortError) → mapped to "unreachable" by the client, so a hung proxy still resolves the UI.
  if (typeof AbortSignal.any === 'function' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.any([controller.signal, AbortSignal.timeout(HEALTH_TIMEOUT_MS)])
  }
  return controller.signal
}

async function checkHealth() {
  healthAbort?.abort()
  const controller = new AbortController()
  healthAbort = controller
  healthChecking.value = true
  let settled = false
  try {
    const result = await fetchVoiceHealth(healthSignal(controller))
    if (healthAbort !== controller) return
    health.value = result
    healthError.value = null
    settled = true
  } catch (err) {
    if (healthAbort !== controller) return
    if (err instanceof DOMException && err.name === 'AbortError') return
    health.value = null
    healthError.value = err
    settled = true
  } finally {
    if (healthAbort === controller) {
      healthChecking.value = false
      healthAbort = null
    }
  }
  if (settled && !healthResolved.value) {
    healthResolved.value = true
    // First answer of this open: fall back to the script only if the user has not picked a tab yet.
    if (!liveEnabled.value && mode.value === 'live' && !userPickedTab && !liveActive.value) {
      mode.value = 'sim'
      autoSwitched.value = true
    }
  }
}

function startHealthPolling() {
  stopHealthPolling()
  healthTimer = setInterval(() => {
    if (document.visibilityState === 'visible') void checkHealth()
  }, HEALTH_INTERVAL_MS)
}

function stopHealthPolling() {
  if (healthTimer !== null) {
    clearInterval(healthTimer)
    healthTimer = null
  }
}

function setMode(next: Mode) {
  userPickedTab = true
  if (mode.value === next) return
  if (next === 'live') resetCall()
  else liveActive.value = false
  mode.value = next
}

watch(
  () => isOpen.value && mode.value === 'live',
  (liveVisible) => {
    if (liveVisible) {
      // user came back to the live tab after a failed check → ask again (the open itself already checks once)
      if (healthResolved.value && !liveEnabled.value) void checkHealth()
      startHealthPolling()
    } else {
      stopHealthPolling()
    }
  },
)

/* ---------- simulated playback (unchanged) ---------- */
type CallState = 'idle' | 'playing' | 'done'
const callState = ref<CallState>('idle')
const shownLines = ref<TranscriptLine[]>([])
const logEl = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)

let timer: ReturnType<typeof setTimeout> | null = null
let prevBodyOverflow = ''

function stopTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function resetCall() {
  stopTimer()
  shownLines.value = []
  callState.value = 'idle'
}

function scrollLog() {
  nextTick(() => {
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  })
}

function startCall() {
  const lines = transcript.value?.lines ?? []
  resetCall()
  if (lines.length === 0) return
  callState.value = 'playing'

  let index = 0
  const tick = () => {
    const line = lines[index]
    if (!line) {
      callState.value = 'done'
      timer = null
      scrollLog()
      return
    }
    shownLines.value.push(line)
    index += 1
    scrollLog()
    timer = setTimeout(tick, LINE_INTERVAL_MS)
  }
  tick()
}

/* ---------- dialog chrome ---------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

function trapTab(event: KeyboardEvent) {
  const root = dialogEl.value
  if (!root) return
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement)
  if (nodes.length === 0) return
  const first = nodes[0] as HTMLElement
  const last = nodes[nodes.length - 1] as HTMLElement
  const active = document.activeElement
  if (event.shiftKey) {
    if (active === first || !root.contains(active)) {
      event.preventDefault()
      last.focus()
    }
  } else if (active === last || !root.contains(active)) {
    event.preventDefault()
    first.focus()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
  else if (event.key === 'Tab') trapTab(event)
}

function lock() {
  prevBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
}

function unlock() {
  document.body.style.overflow = prevBodyOverflow
  window.removeEventListener('keydown', onKeydown)
  resetCall()
  liveActive.value = false
  stopHealthPolling()
  healthAbort?.abort()
  healthAbort = null
  healthChecking.value = false
}

watch(isOpen, async (open) => {
  if (open) {
    // Fresh check on every open. A previously-seen "enabled" health shows the live panel right away (optimistic);
    // otherwise the live tab waits in "연결 확인 중" until the answer arrives (≤ HEALTH_TIMEOUT_MS).
    healthResolved.value = false
    autoSwitched.value = false
    userPickedTab = false
    mode.value = 'live'
    lock()
    void checkHealth()
    void loadVoicePersonas()
    await nextTick()
    closeBtn.value?.focus()
  } else {
    unlock()
  }
})

watch(() => props.scenario?.id, () => {
  resetCall()
  liveActive.value = false
})

onBeforeUnmount(() => {
  if (isOpen.value) unlock()
  stopTimer()
  stopHealthPolling()
})

const stateLabel: Record<CallState, string> = {
  idle: '대기 중',
  playing: '통화 중',
  done: '통화 종료',
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="scenario"
      class="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
    >
      <div class="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" aria-hidden="true" @click="emit('close')" />

      <div
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <!-- Header -->
        <div class="border-b border-stone-200 px-5 pt-5 sm:px-6">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1.5">
                <span :class="ui.chip">{{ scenario.industry }}</span>
                <span v-if="scenario.outbound" :class="ui.chipAmber">아웃바운드</span>
              </div>
              <h2 :id="titleId" class="mt-3 text-lg font-semibold leading-snug text-stone-950 sm:text-xl">{{ scenario.title }}</h2>
              <p class="mt-1 text-sm leading-6 text-stone-600">{{ scenario.desc }}</p>
            </div>
            <button
              ref="closeBtn"
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
              aria-label="데모 닫기"
              @click="emit('close')"
            >
              <X class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <!-- Mode switch: AI 통화 (default) | 대본 미리보기 -->
          <div class="mt-4 flex items-center gap-1" :class="mode === 'sim' && autoSwitched ? 'pb-2' : 'pb-4'" role="tablist" aria-label="데모 방식">
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'live' ? 'true' : 'false'"
              class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 sm:text-sm"
              :class="mode === 'live' ? 'bg-stone-950 text-white' : 'text-stone-600 hover:bg-stone-100'"
              data-testid="demo-mode-live"
              @click="setMode('live')"
            >
              <Radio class="h-3.5 w-3.5" aria-hidden="true" />
              AI 통화
              <span
                class="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ring-1"
                :class="mode === 'live'
                  ? 'bg-emerald-500 text-white ring-emerald-400'
                  : liveEnabled
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-stone-100 text-stone-500 ring-stone-200'"
                :title="liveEnabled ? 'GPU 서버 연결됨' : 'GPU 서버 미연결'"
              >
                GPU
              </span>
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'sim' ? 'true' : 'false'"
              class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 sm:text-sm"
              :class="mode === 'sim' ? 'bg-stone-950 text-white' : 'text-stone-600 hover:bg-stone-100'"
              data-testid="demo-mode-sim"
              @click="setMode('sim')"
            >
              대본 미리보기
            </button>
          </div>
          <p
            v-if="mode === 'sim' && autoSwitched"
            class="flex items-start gap-1.5 pb-3 text-xs leading-5 text-amber-800"
            role="status"
            data-testid="demo-live-notice"
          >
            <Info class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            음성 서버에 연결되지 않아 대본 시뮬레이션으로 보여드립니다.
          </p>
        </div>

        <!-- Body: 시뮬레이션 -->
        <div v-if="mode === 'sim'" class="grid grid-cols-1 gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-[0.85fr_1.15fr] sm:px-6 sm:py-6">
          <!-- Sample info -->
          <aside class="rounded-xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-stone-500">샘플 정보</p>
            <ul class="mt-3 space-y-2.5">
              <li v-for="fact in transcript?.sample ?? []" :key="fact" class="flex items-start gap-2 text-sm leading-6 text-stone-700">
                <span class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>{{ fact }}</span>
              </li>
            </ul>
            <p class="mt-4 text-xs leading-5 text-stone-500">
              실제 도입 시에는 회사 정보·응대 규칙을 등록하고, 같은 방식으로 AI가 응대합니다.
            </p>
          </aside>

          <!-- Call panel -->
          <div class="flex min-h-[320px] flex-col rounded-xl border border-stone-200 bg-white">
            <div class="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-stone-950">
                <span :class="ui.iconCircleEmerald">
                  <component :is="scenario.outbound ? PhoneOutgoing : PhoneCall" class="h-4 w-4" aria-hidden="true" />
                </span>
                {{ scenario.outbound ? 'AI 발신 통화' : 'AI 수신 통화' }}
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1"
                :class="callState === 'playing'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                  : callState === 'done'
                    ? 'bg-stone-950 text-white ring-stone-950'
                    : 'bg-stone-100 text-stone-600 ring-stone-200'"
                aria-live="polite"
              >
                {{ stateLabel[callState] }}
              </span>
            </div>

            <!-- Idle -->
            <div v-if="callState === 'idle'" class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              <span class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
                <component :is="scenario.outbound ? PhoneOutgoing : PhoneCall" class="h-6 w-6" aria-hidden="true" />
              </span>
              <p class="mt-5 text-sm leading-6 text-stone-600">
                버튼을 누르면 샘플 정보를 바탕으로 한<br />통화 시뮬레이션이 재생됩니다.
              </p>
              <button type="button" :class="[ui.btnPrimary, 'mt-6']" :disabled="!transcript" @click="startCall">
                <PhoneCall class="h-4 w-4" aria-hidden="true" />
                통화 시작
              </button>
            </div>

            <!-- Transcript -->
            <div v-else class="flex flex-1 flex-col">
              <div ref="logEl" class="flex max-h-72 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
                <div
                  v-for="(line, i) in shownLines"
                  :key="i"
                  class="flex max-w-[88%] animate-fade-up flex-col gap-1"
                  :class="line.role === 'ai' ? 'self-start items-start' : 'self-end items-end'"
                >
                  <span class="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400">
                    <component :is="line.role === 'ai' ? Bot : User" class="h-3 w-3" aria-hidden="true" />
                    {{ line.role === 'ai' ? 'AI 상담원' : '고객' }}
                  </span>
                  <p
                    class="rounded-2xl px-4 py-2.5 text-sm leading-6"
                    :class="line.role === 'ai'
                      ? 'rounded-bl-md bg-stone-100 text-stone-800'
                      : 'rounded-br-md bg-stone-950 text-white'"
                  >
                    {{ line.text }}
                  </p>
                </div>
                <div v-if="callState === 'playing'" class="flex items-center gap-1.5 self-start px-1 text-xs text-stone-400" aria-hidden="true">
                  <span class="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone-400 motion-reduce:animate-none" />
                  <span class="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone-400 motion-reduce:animate-none [animation-delay:200ms]" />
                  <span class="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone-400 motion-reduce:animate-none [animation-delay:400ms]" />
                </div>
              </div>

              <p class="border-t border-stone-100 px-4 py-2.5 text-xs text-stone-500">
                AI 응답 3초 이내 · 통화 녹음·요약 자동
              </p>

              <div v-if="callState === 'done' && transcript" class="border-t border-stone-100 px-4 py-4">
                <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div class="flex items-start gap-2.5">
                    <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <p class="text-sm font-medium leading-6 text-stone-800">{{ transcript.result }}</p>
                  </div>
                </div>
                <button type="button" :class="[ui.linkEmerald, 'mt-3']" @click="startCall">
                  <RotateCcw class="h-4 w-4" aria-hidden="true" />
                  다시 재생
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Body: 실제 AI 통화 -->
        <div v-else class="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <LiveCallPanel
            v-if="liveEnabled || liveActive"
            :key="scenario.id"
            :scenario="scenario"
            :voice="voiceEntry"
            :health="health"
            :catalog="voiceCatalog"
            @active="liveActive = $event"
            @close="emit('close')"
          />
          <div
            v-else-if="!healthResolved"
            class="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 px-6 py-12 text-center"
            role="status"
            aria-live="polite"
            data-testid="live-checking"
          >
            <Loader2 class="h-6 w-6 animate-spin text-emerald-600 motion-reduce:animate-none" aria-hidden="true" />
            <p class="mt-4 text-sm font-semibold text-stone-900">연결 확인 중…</p>
            <p class="mt-1 text-xs leading-5 text-stone-500">GPU 음성 서버 상태를 확인하고 있습니다</p>
          </div>
          <LiveUnavailable v-else :reason="liveReason" :checking="healthChecking" @retry="checkHealth" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
