<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, CheckCircle2, PhoneMissed, RotateCcw, Sparkles, TrendingDown } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import { formatCount, type Estimate } from '@/data/consultation'
import { formatKrw } from '@/data/plans'

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

const props = defineProps<{
  estimate: Estimate
  insights: string[]
  saveState: SaveState
}>()

const emit = defineEmits<{ reset: [] }>()

const positive = computed(() => props.estimate.netKrw > 0)

const stats = computed(() => [
  { label: '월 통화량', value: `${formatCount(props.estimate.monthlyCalls)}건`, sub: `하루 약 ${props.estimate.dailyCalls}통 × 26일` },
  { label: '놓치는 전화', value: `약 ${formatCount(props.estimate.missedCalls)}건/월`, sub: `건당 기대 손실 ${formatKrw(props.estimate.avgCallValueKrw)}` },
  {
    label: '추천 플랜',
    value: `${props.estimate.plan.name} · ${formatKrw(props.estimate.plan.price)}/월`,
    sub: props.estimate.withinPlan || props.estimate.nearLimit
      ? `월 ${formatCount(props.estimate.plan.includedMinutes)}분 포함 · 부가세 별도`
      : `포함 분량 초과 약 ${formatCount(props.estimate.overageMinutes)}분 → 추가 상품`,
  },
  { label: '현재 응대 인건비 (추정)', value: `${formatKrw(props.estimate.laborCostKrw)}/월`, sub: '전화 응대에 쓰는 시간 기준' },
])
</script>

<template>
  <div class="animate-fade-up mx-auto w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
    <SectionLabel variant="badge" center>
      <template #icon><Sparkles class="h-4 w-4" /></template>
      진단 완료
    </SectionLabel>

    <!-- headline -->
    <div class="mt-6 text-center">
      <p class="eyebrow">월 예상 손실</p>
      <p class="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
        {{ formatKrw(estimate.estimatedLossKrw) }}
      </p>
      <p class="mt-3 inline-flex items-center gap-1.5 text-sm text-stone-600">
        <PhoneMissed class="h-4 w-4 text-amber-600" aria-hidden="true" />
        놓치는 전화 약 {{ formatCount(estimate.missedCalls) }}건/월 × {{ formatKrw(estimate.avgCallValueKrw) }}
      </p>
    </div>

    <!-- stats -->
    <dl class="mt-8 grid gap-3 sm:grid-cols-2">
      <div v-for="s in stats" :key="s.label" class="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4">
        <dt class="text-xs font-medium text-stone-500">{{ s.label }}</dt>
        <dd class="mt-1 font-semibold text-stone-950">{{ s.value }}</dd>
        <dd class="mt-0.5 text-xs text-stone-500">{{ s.sub }}</dd>
      </div>
    </dl>

    <!-- near-limit notice: recommended the lower plan + 추가 상품 instead of jumping up -->
    <p
      v-if="estimate.nearLimit && estimate.upperPlan"
      class="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900"
    >
      <AlertCircle class="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
      <span>
        포함 분량({{ formatCount(estimate.plan.includedMinutes) }}분)을 약 {{ formatCount(estimate.overageMinutes) }}분 넘는 달은 AI 처리시간 추가 상품으로 보완할 수 있어요.
        상위 플랜({{ estimate.upperPlan.name }})은 월 {{ formatKrw(estimate.upperPlan.price) }}입니다.
      </span>
    </p>

    <!-- net effect -->
    <div
      class="mt-4 rounded-xl border px-5 py-5"
      :class="positive ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-stone-50'"
    >
      <div class="flex items-start gap-3">
        <span
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          :class="positive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'"
          aria-hidden="true"
        >
          <TrendingDown v-if="!positive" class="h-4 w-4" />
          <CheckCircle2 v-else class="h-4 w-4" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-medium" :class="positive ? 'text-emerald-700' : 'text-stone-500'">예상 순효과 = 손실 − 플랜 요금</p>
          <p v-if="positive" class="mt-1 text-2xl font-semibold tracking-tight text-emerald-800">
            +{{ formatKrw(estimate.netKrw) }}<span class="text-base font-medium text-emerald-700">/월</span>
          </p>
          <p v-else class="mt-1 text-lg font-semibold tracking-tight text-stone-900">
            지금 규모에서는 플랜 요금이 예상 손실보다 커요
          </p>
          <p class="mt-1 text-sm" :class="positive ? 'text-emerald-800/80' : 'text-stone-600'">
            <template v-if="positive">
              월 예상 손실 {{ formatKrw(estimate.estimatedLossKrw) }} − {{ estimate.plan.name }} 플랜 {{ formatKrw(estimate.monthlyFeeKrw) }}
            </template>
            <template v-else>
              차이 {{ formatKrw(Math.abs(estimate.netKrw)) }}/월. 통화량이 늘거나 영업시간 외 문의가 많아지면 다시 진단해 보세요.
            </template>
          </p>
        </div>
      </div>
    </div>

    <!-- insights -->
    <ul class="mt-8 space-y-3">
      <li v-for="(line, i) in insights" :key="i" class="flex items-start gap-3 text-sm leading-relaxed text-stone-600">
        <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>{{ line }}</span>
      </li>
    </ul>

    <!-- CTAs -->
    <div class="mt-8 grid gap-3 sm:grid-cols-2">
      <BaseButton to="/contact" block>이 조건으로 도입 문의하기</BaseButton>
      <BaseButton to="/pricing" variant="secondary" block>요금 자세히 보기</BaseButton>
    </div>
    <div class="mt-6 flex flex-col items-center gap-2 text-center">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-950"
        @click="emit('reset')"
      >
        <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
        다시 진단하기
      </button>
      <p class="min-h-4 text-xs text-stone-400" aria-live="polite">
        <template v-if="saveState === 'saved'">진단 결과가 저장되었습니다</template>
        <template v-else-if="saveState === 'saving'">진단 결과 저장 중…</template>
      </p>
    </div>
    <p class="mt-4 text-center text-[11px] leading-relaxed text-stone-400">
      예상치는 입력하신 답변 기준의 단순 추정이며 실제 매출·비용과 다를 수 있습니다. 플랜 요금은 부가세 별도입니다.
    </p>
  </div>
</template>
