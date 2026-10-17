<script setup lang="ts">
/**
 * 통화 전 목소리(페르소나) + 말 빠르기 선택. Cards are `role="radio"` divs so the
 * per-card 미리듣기 control can be a real <button> (buttons cannot nest).
 */
import { computed } from 'vue'
import { AlertTriangle, Loader2, Play, Square } from 'lucide-vue-next'
import type { VoicePersona, VoicePersonasResponse, VoiceSpeedId } from '@/lib/voice/client'

const props = defineProps<{
  catalog: VoicePersonasResponse
  persona: string
  speed: VoiceSpeedId
  disabled?: boolean
  /** persona id whose sample is loading/playing */
  previewing?: string | null
  previewLoading?: boolean
  previewError?: string | null
}>()
const emit = defineEmits<{
  'update:persona': [id: string]
  'update:speed': [id: VoiceSpeedId]
  preview: [id: string]
}>()

const selected = computed<VoicePersona | null>(
  () => props.catalog.personas.find((p) => p.id === props.persona) ?? props.catalog.personas[0] ?? null,
)
const speedLabel = computed(() => props.catalog.speeds.find((s) => s.id === props.speed)?.label ?? '보통')

function select(id: string) {
  if (props.disabled || id === props.persona) return
  emit('update:persona', id)
}
</script>

<template>
  <section data-testid="voice-picker" :aria-disabled="disabled ? 'true' : 'false'">
    <div class="flex items-baseline justify-between gap-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-stone-500">목소리</p>
      <p class="text-[11px] text-stone-400">카드의 ▶ 로 미리 들어볼 수 있어요</p>
    </div>

    <div class="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="목소리 선택">
      <div
        v-for="p in catalog.personas"
        :key="p.id"
        role="radio"
        :aria-checked="p.id === persona ? 'true' : 'false'"
        :aria-label="`${p.name} · ${p.tagline}`"
        :tabindex="disabled ? -1 : 0"
        class="relative flex min-w-0 cursor-pointer flex-col gap-1.5 rounded-2xl border bg-white p-3 pr-9 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
        :class="[
          p.id === persona ? 'border-stone-950 ring-1 ring-stone-950' : 'border-stone-200 hover:border-stone-300',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ]"
        data-testid="voice-card"
        :data-persona="p.id"
        @click="select(p.id)"
        @keydown.enter.prevent="select(p.id)"
        @keydown.space.prevent="select(p.id)"
      >
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
          :class="p.id === persona ? 'bg-stone-950 text-white' : 'bg-stone-100 text-stone-700'"
          aria-hidden="true"
        >
          {{ p.name.charAt(0) }}
        </span>
        <p class="text-sm font-semibold leading-5 text-stone-950">{{ p.name }}</p>
        <p class="text-[11px] leading-4 text-stone-500">{{ p.tagline }}</p>
        <p class="line-clamp-2 text-xs italic leading-4 text-stone-600">“{{ p.sample }}”</p>

        <button
          type="button"
          class="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
          :class="previewing === p.id ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'"
          :disabled="disabled"
          :aria-label="previewing === p.id ? `${p.name} 미리듣기 중지` : `${p.name} 목소리 미리듣기`"
          :aria-pressed="previewing === p.id ? 'true' : 'false'"
          data-testid="voice-preview"
          :data-persona="p.id"
          @click.stop="emit('preview', p.id)"
          @keydown.enter.stop
          @keydown.space.stop
        >
          <Loader2 v-if="previewing === p.id && previewLoading" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          <Square v-else-if="previewing === p.id" class="h-3 w-3" aria-hidden="true" />
          <Play v-else class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <p v-if="previewError" class="mt-2 flex items-start gap-1.5 text-xs leading-5 text-amber-700" role="alert" data-testid="voice-preview-error">
      <AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{{ previewError }}</span>
    </p>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p class="text-xs font-semibold uppercase tracking-wider text-stone-500">말 빠르기</p>
      <div class="inline-flex rounded-full bg-stone-100 p-1" role="radiogroup" aria-label="말 빠르기">
        <button
          v-for="s in catalog.speeds"
          :key="s.id"
          type="button"
          role="radio"
          :aria-checked="s.id === speed ? 'true' : 'false'"
          :disabled="disabled"
          class="rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 disabled:cursor-not-allowed"
          :class="s.id === speed ? 'bg-stone-950 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'"
          data-testid="voice-speed"
          :data-speed="s.id"
          @click="!disabled && s.id !== speed && emit('update:speed', s.id)"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <p v-if="selected" class="mt-3 text-xs leading-5 text-stone-600" data-testid="voice-summary">
      <span class="font-semibold text-stone-900">{{ selected.name }} · 한국어 · {{ speedLabel }}</span>
      <span class="text-stone-400"> — </span>
      <span class="italic">“{{ selected.sample }}”</span>
    </p>
  </section>
</template>
