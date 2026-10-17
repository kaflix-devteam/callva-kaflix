<script setup lang="ts">
/**
 * Hold-to-talk mic button. Press (pointer or Space) → `press`, release → `release`.
 * Pointer capture keeps `release` firing even when the finger slides off.
 * Shows a countdown ring (`progress` 0..1) and a soft level halo while recording.
 */
import { Mic } from 'lucide-vue-next'

const props = defineProps<{
  disabled?: boolean
  recording?: boolean
  /** 0..1 — fraction of the max recording time used */
  progress?: number
  /** 0..1 — mic input level */
  level?: number
  title?: string
}>()
const emit = defineEmits<{ press: []; release: [] }>()

const RADIUS = 21
const CIRC = 2 * Math.PI * RADIUS

let pointerActive = false
let keyActive = false

function onPointerDown(event: PointerEvent) {
  if (props.disabled || event.button !== 0) return
  event.preventDefault()
  pointerActive = true
  const el = event.currentTarget as HTMLElement
  try {
    el.setPointerCapture(event.pointerId)
  } catch {
    /* unsupported */
  }
  emit('press')
}

function onPointerUp(event: PointerEvent) {
  if (!pointerActive) return
  pointerActive = false
  const el = event.currentTarget as HTMLElement
  try {
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
  } catch {
    /* ignore */
  }
  emit('release')
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== ' ' && event.key !== 'Spacebar') return
  event.preventDefault()
  if (event.repeat || props.disabled || keyActive || props.recording) return
  keyActive = true
  emit('press')
}

function onKeyUp(event: KeyboardEvent) {
  if (event.key !== ' ' && event.key !== 'Spacebar') return
  event.preventDefault()
  // Release even if the mic has not opened yet (quick tap before getUserMedia resolves).
  if (keyActive || props.recording) {
    keyActive = false
    emit('release')
  }
}

function onBlur() {
  if (pointerActive || keyActive || props.recording) {
    pointerActive = false
    keyActive = false
    emit('release')
  }
}
</script>

<template>
  <button
    type="button"
    class="relative inline-flex h-12 w-12 shrink-0 touch-none select-none items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="recording ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'"
    :disabled="disabled"
    :title="title"
    :aria-label="recording ? '녹음 중 — 떼면 전송' : '누른 채 말하기'"
    :aria-pressed="recording ? 'true' : 'false'"
    data-testid="live-mic"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
    @blur="onBlur"
    @contextmenu.prevent
  >
    <!-- level halo -->
    <span
      v-if="recording"
      class="pointer-events-none absolute inset-0 rounded-full bg-emerald-500/30 transition-transform duration-100"
      :style="{ transform: `scale(${1 + Math.min(1, level ?? 0) * 0.45})` }"
      aria-hidden="true"
    />
    <!-- countdown ring -->
    <svg v-if="recording" class="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" :r="RADIUS" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2.5" />
      <circle
        cx="24"
        cy="24"
        :r="RADIUS"
        fill="none"
        stroke="white"
        stroke-width="2.5"
        stroke-linecap="round"
        :stroke-dasharray="CIRC"
        :stroke-dashoffset="CIRC * Math.min(1, Math.max(0, progress ?? 0))"
        class="transition-[stroke-dashoffset] duration-100 ease-linear"
      />
    </svg>
    <Mic class="relative h-5 w-5" aria-hidden="true" />
  </button>
</template>
