<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { ClipboardList } from 'lucide-vue-next'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import QuizCard from '@/components/consultation/QuizCard.vue'
import QuizResult, { type SaveState } from '@/components/consultation/QuizResult.vue'
import {
  buildInsights,
  computeEstimate,
  questions,
  toConsultationPayload,
  TOTAL_QUESTIONS,
  type Answers,
} from '@/data/consultation'
import { submitConsultation } from '@/lib/api'
import { ui } from '@/lib/ui'

const AUTO_ADVANCE_MS = 250

const step = ref(0)
const direction = ref<'forward' | 'back'>('forward')
const answers = reactive<Answers>({})
const locked = ref(false)
const saveState = ref<SaveState>('idle')

let advanceTimer: ReturnType<typeof setTimeout> | undefined
let submitted = false

const current = computed(() => questions[step.value])
const finished = computed(() => step.value >= TOTAL_QUESTIONS)
const estimate = computed(() => (finished.value ? computeEstimate(answers) : null))
const insights = computed(() => (estimate.value ? buildInsights(answers, estimate.value) : []))

function clearTimer() {
  if (advanceTimer !== undefined) {
    clearTimeout(advanceTimer)
    advanceTimer = undefined
  }
}

function select(optionId: string) {
  const q = current.value
  if (!q || locked.value) return
  answers[q.id] = optionId
  direction.value = 'forward'
  locked.value = true
  advanceTimer = setTimeout(() => {
    advanceTimer = undefined
    locked.value = false
    step.value += 1
    if (step.value >= TOTAL_QUESTIONS) finish()
  }, AUTO_ADVANCE_MS)
}

function back() {
  clearTimer()
  locked.value = false
  direction.value = 'back'
  if (step.value > 0) step.value -= 1
}

/** Fire-and-forget: save the result once; failure is silent for the visitor. */
function finish() {
  const e = computeEstimate(answers)
  if (!e || submitted) return
  submitted = true
  saveState.value = 'saving'
  submitConsultation(toConsultationPayload(answers, e))
    .then(() => { saveState.value = 'saved' })
    .catch(() => { saveState.value = 'failed' })
}

function reset() {
  clearTimer()
  for (const q of questions) delete answers[q.id]
  step.value = 0
  direction.value = 'forward'
  locked.value = false
  submitted = false
  saveState.value = 'idle'
}

onBeforeUnmount(clearTimer)
</script>

<template>
  <section class="container-x pb-24 pt-32">
    <div class="animate-fade-up text-center">
      <SectionLabel variant="badge" center>
        <template #icon><ClipboardList class="h-4 w-4" /></template>
        무료 진단
      </SectionLabel>
      <h1 :class="ui.h1" class="mt-6">얼마나 아낄 수 있을까?</h1>
      <p class="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-stone-600">6개 질문에 답하면 예상 절감 효과를 알려드려요</p>
    </div>

    <div class="mt-14">
      <QuizResult
        v-if="finished && estimate"
        :estimate="estimate"
        :insights="insights"
        :save-state="saveState"
        @reset="reset"
      />
      <QuizCard
        v-else-if="current"
        :question="current"
        :index="step"
        :total="TOTAL_QUESTIONS"
        :selected="answers[current.id]"
        :locked="locked"
        :direction="direction"
        @select="select"
        @back="back"
      />
    </div>
  </section>
</template>
