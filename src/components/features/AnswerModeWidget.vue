<script setup lang="ts">
import { ref } from 'vue'
import { PhoneCall } from 'lucide-vue-next'
import WidgetFrame from './WidgetFrame.vue'
import { answerModeOptions, availabilityOptions, type RadioOption } from '@/data/features'
import { ui } from '@/lib/ui'

const DEFAULTS = { mode: 'ai-first', availability: 'always' }

const mode = ref(DEFAULTS.mode)
const availability = ref(DEFAULTS.availability)
const savedNote = ref('')
let timer = 0

function reset() {
  mode.value = DEFAULTS.mode
  availability.value = DEFAULTS.availability
  savedNote.value = ''
}

function save() {
  savedNote.value = '설정이 저장되었습니다'
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (savedNote.value = ''), 2200)
}

const groups: { key: 'mode' | 'availability'; label: string; options: RadioOption[] }[] = [
  { key: 'mode', label: '전화 응대 방식', options: answerModeOptions },
  { key: 'availability', label: '대표님 연결 가능 시간', options: availabilityOptions },
]

function selected(key: 'mode' | 'availability') {
  return key === 'mode' ? mode.value : availability.value
}
function select(key: 'mode' | 'availability', id: string) {
  if (key === 'mode') mode.value = id
  else availability.value = id
}
</script>

<template>
  <WidgetFrame title="전화 응대 모드" sub="전화가 오면 누가 먼저 받을지 설정해요">
    <template #icon><PhoneCall class="h-4 w-4" /></template>

    <div class="space-y-8 px-5 py-6 sm:px-6">
      <fieldset v-for="g in groups" :key="g.key">
        <legend class="mb-3 text-sm font-semibold text-stone-800">{{ g.label }}</legend>
        <div class="grid gap-3" :class="g.options.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'" role="radiogroup" :aria-label="g.label">
          <button
            v-for="opt in g.options"
            :key="opt.id"
            type="button"
            role="radio"
            :aria-checked="selected(g.key) === opt.id"
            class="flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all"
            :class="selected(g.key) === opt.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-white hover:border-stone-300'"
            @click="select(g.key, opt.id)"
          >
            <span
              class="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
              :class="selected(g.key) === opt.id ? 'border-stone-900' : 'border-stone-300'"
              aria-hidden="true"
            >
              <span v-if="selected(g.key) === opt.id" class="h-2 w-2 rounded-full bg-stone-900" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-stone-900">{{ opt.title }}</span>
              <span class="mt-1 block text-xs leading-relaxed text-stone-500">{{ opt.desc }}</span>
            </span>
          </button>
        </div>
      </fieldset>
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-stone-100 bg-stone-50 px-5 py-4 sm:px-6">
      <p class="text-sm text-emerald-700 transition-opacity" :class="savedNote ? 'opacity-100' : 'opacity-0'" aria-live="polite">{{ savedNote || ' ' }}</p>
      <div class="flex gap-2">
        <button type="button" :class="ui.btnPillLight" @click="reset">취소</button>
        <button type="button" :class="ui.btnPill" @click="save">저장</button>
      </div>
    </div>
  </WidgetFrame>
</template>
