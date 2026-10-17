<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Bot, CheckCircle2, PhoneCall, PhoneOutgoing, RotateCcw, User, X } from 'lucide-vue-next'
import type { DemoScenario } from '@/data/demoScenarios'
import { demoTranscripts, type TranscriptLine } from '@/data/demoTranscripts'
import { ui } from '@/lib/ui'

const props = defineProps<{ scenario: DemoScenario | null }>()
const emit = defineEmits<{ close: [] }>()

const LINE_INTERVAL_MS = 900

const isOpen = computed(() => props.scenario !== null)
const transcript = computed(() => (props.scenario ? demoTranscripts[props.scenario.id] : undefined))
const titleId = computed(() => `demo-modal-title-${props.scenario?.id ?? 'none'}`)

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

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
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
}

watch(isOpen, async (open) => {
  if (open) {
    lock()
    await nextTick()
    closeBtn.value?.focus()
  } else {
    unlock()
  }
})

watch(() => props.scenario?.id, () => resetCall())

onBeforeUnmount(() => {
  if (isOpen.value) unlock()
  stopTimer()
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
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-6">
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

        <!-- Body -->
        <div class="grid grid-cols-1 gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-[0.85fr_1.15fr] sm:px-6 sm:py-6">
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
      </div>
    </div>
  </Teleport>
</template>
