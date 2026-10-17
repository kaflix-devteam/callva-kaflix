<script setup lang="ts">
import { computed } from 'vue'
import { progressPercent, type QuizQuestion } from '@/data/consultation'

const props = withDefaults(
  defineProps<{
    question: QuizQuestion
    /** 0-based index of the current question */
    index: number
    total: number
    /** currently selected option id for this question (kept when navigating back) */
    selected?: string
    /** true while the auto-advance timer is running — ignore further clicks */
    locked?: boolean
    direction?: 'forward' | 'back'
  }>(),
  { selected: undefined, locked: false, direction: 'forward' },
)

const emit = defineEmits<{ select: [optionId: string]; back: [] }>()

const pct = computed(() => progressPercent(props.index, props.total))
const transitionName = computed(() => (props.direction === 'back' ? 'quiz-back' : 'quiz-forward'))

function choose(optionId: string) {
  if (props.locked) return
  emit('select', optionId)
}
</script>

<template>
  <div class="mx-auto w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
    <!-- progress header (outside the transition so the bar animates smoothly) -->
    <div class="flex items-center justify-between text-xs font-medium text-stone-500">
      <span>질문 {{ index + 1 }} / {{ total }}</span>
      <span class="tabular-nums">{{ pct }}%</span>
    </div>
    <div
      class="mt-2 h-1 w-full overflow-hidden rounded-full bg-stone-100"
      role="progressbar"
      :aria-valuenow="pct"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`진행률 ${pct}%`"
    >
      <div class="h-full rounded-full bg-stone-950 transition-[width] duration-500 ease-out" :style="{ width: `${pct}%` }" />
    </div>

    <Transition :name="transitionName" mode="out-in">
      <div :key="question.id">
        <div class="mt-10 text-center">
          <h3 class="text-2xl font-semibold tracking-tight text-stone-950 sm:text-[26px]">{{ question.title }}</h3>
          <p class="mt-3 text-sm text-stone-500">{{ question.hint }}</p>
        </div>

        <div class="mt-8 space-y-3" role="radiogroup" :aria-label="question.title">
          <button
            v-for="opt in question.options"
            :key="opt.id"
            type="button"
            role="radio"
            :aria-checked="selected === opt.id"
            :disabled="locked"
            class="flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:cursor-default sm:px-6 sm:py-5"
            :class="selected === opt.id
              ? 'border-stone-950 bg-stone-50 ring-1 ring-stone-950'
              : 'border-stone-200 bg-white hover:border-stone-400'"
            @click="choose(opt.id)"
          >
            <span
              class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
              :class="selected === opt.id ? 'border-stone-950 bg-stone-950' : 'border-stone-300 bg-white'"
              aria-hidden="true"
            >
              <span v-if="selected === opt.id" class="h-2 w-2 rounded-full bg-white" />
            </span>
            <span class="min-w-0">
              <span class="block font-semibold text-stone-950">{{ opt.label }}</span>
              <span class="mt-0.5 block text-sm text-stone-500">{{ opt.sub }}</span>
            </span>
          </button>
        </div>
      </div>
    </Transition>

    <div class="mt-8 flex items-center justify-between gap-4">
      <button
        v-if="index > 0"
        type="button"
        class="text-sm font-medium text-stone-500 transition-colors hover:text-stone-950"
        @click="emit('back')"
      >
        ← 이전
      </button>
      <span v-else aria-hidden="true" />
      <p class="text-xs text-stone-400">개인정보는 수집하지 않습니다</p>
    </div>
  </div>
</template>

<style scoped>
.quiz-forward-enter-active,
.quiz-forward-leave-active,
.quiz-back-enter-active,
.quiz-back-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.quiz-forward-enter-from { opacity: 0; transform: translateX(16px); }
.quiz-forward-leave-to { opacity: 0; transform: translateX(-16px); }
.quiz-back-enter-from { opacity: 0; transform: translateX(-16px); }
.quiz-back-leave-to { opacity: 0; transform: translateX(16px); }

@media (prefers-reduced-motion: reduce) {
  .quiz-forward-enter-active,
  .quiz-forward-leave-active,
  .quiz-back-enter-active,
  .quiz-back-leave-active {
    transition: none;
  }
}
</style>
