<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { formatKrw, recommendPlan } from '@/data/plans'
import { ui } from '@/lib/ui'

const CALLS = { min: 20, max: 3000, step: 10 } as const
const MINUTES = { min: 1, max: 10, step: 1 } as const

const monthlyCalls = ref(300)
const avgMinutes = ref(3)

const result = computed(() => recommendPlan(monthlyCalls.value, avgMinutes.value))
const spare = computed(() => result.value.plan.includedMinutes - result.value.needed)

const fmt = (n: number) => n.toLocaleString('ko-KR')
</script>

<template>
  <section class="container-x mt-16 sm:mt-20" aria-labelledby="pricing-calculator-title">
    <p class="eyebrow">월 예상 비용</p>
    <h2 id="pricing-calculator-title" :class="[ui.h2, 'mt-3']">우리 매장은 얼마일까요?</h2>
    <p :class="[ui.lead, 'mt-4 max-w-3xl whitespace-pre-line']">
      월 통화 건수와 평균 통화 시간을 움직이면 필요한 AI 처리 분량과 맞는 플랜, 월 이용료가 바로 나옵니다.
      포함 분량 안에서는 추가 요금이 없습니다.
    </p>

    <div class="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <!-- Inputs -->
      <div :class="[ui.card, 'sm:p-8']">
        <div>
          <div class="flex items-end justify-between gap-4">
            <label for="calc-calls" class="text-sm font-semibold text-stone-800">월 통화 건수</label>
            <span class="text-2xl font-bold tracking-tight text-stone-950">{{ fmt(monthlyCalls) }}건</span>
          </div>
          <input
            id="calc-calls"
            v-model.number="monthlyCalls"
            type="range"
            :min="CALLS.min"
            :max="CALLS.max"
            :step="CALLS.step"
            class="mt-4 h-2 w-full cursor-pointer accent-stone-900"
          />
          <div class="mt-2 flex justify-between text-xs text-stone-500">
            <span>{{ fmt(CALLS.min) }}건</span>
            <span>{{ fmt(CALLS.max) }}건</span>
          </div>
        </div>

        <div class="mt-8">
          <div class="flex items-end justify-between gap-4">
            <label for="calc-minutes" class="text-sm font-semibold text-stone-800">평균 통화 시간</label>
            <span class="text-2xl font-bold tracking-tight text-stone-950">{{ avgMinutes }}분</span>
          </div>
          <input
            id="calc-minutes"
            v-model.number="avgMinutes"
            type="range"
            :min="MINUTES.min"
            :max="MINUTES.max"
            :step="MINUTES.step"
            class="mt-4 h-2 w-full cursor-pointer accent-stone-900"
          />
          <div class="mt-2 flex justify-between text-xs text-stone-500">
            <span>{{ MINUTES.min }}분</span>
            <span>{{ MINUTES.max }}분</span>
          </div>
        </div>

        <p class="mt-8 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700" aria-live="polite">
          한 달 AI 처리 약 <strong class="font-semibold text-stone-950">{{ fmt(result.needed) }}분</strong>이 필요합니다.
        </p>
      </div>

      <!-- Result -->
      <div class="rounded-2xl border border-stone-900 bg-stone-950 p-6 text-white shadow-2xl shadow-stone-900/20 sm:p-8" aria-live="polite">
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">맞는 플랜</p>
        <p class="mt-2 text-3xl font-semibold tracking-tight">{{ result.plan.name }}</p>
        <div class="mt-4 flex items-end gap-1.5">
          <span class="text-4xl font-bold tracking-tight sm:text-[40px]">{{ formatKrw(result.plan.price) }}</span>
          <span class="pb-1.5 text-sm text-stone-300">/ 월</span>
        </div>
        <p class="mt-1 text-xs text-stone-400">{{ result.plan.vatNote }}</p>

        <dl class="mt-6 grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
            <dt class="text-xs text-stone-400">포함 분량</dt>
            <dd class="mt-1 text-lg font-semibold">{{ fmt(result.plan.includedMinutes) }}분</dd>
          </div>
          <div class="rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
            <dt class="text-xs text-stone-400">필요 분량</dt>
            <dd class="mt-1 text-lg font-semibold">{{ fmt(result.needed) }}분</dd>
          </div>
          <div class="rounded-xl p-3 ring-1" :class="result.withinPlan ? 'bg-white/[0.06] ring-white/10' : 'bg-amber-400/10 ring-amber-400/30'">
            <dt class="text-xs" :class="result.withinPlan ? 'text-stone-400' : 'text-amber-200'">여유</dt>
            <dd class="mt-1 text-lg font-semibold" :class="result.withinPlan ? '' : 'text-amber-300'">
              <template v-if="result.withinPlan">{{ fmt(spare) }}분</template>
              <template v-else>초과 {{ fmt(result.overage) }}분</template>
            </dd>
          </div>
        </dl>

        <p class="mt-5 text-sm leading-relaxed" :class="result.withinPlan ? 'text-stone-300' : 'text-amber-200'">
          <template v-if="result.withinPlan">포함 분량 안이라 이 금액(부가세 별도)이 월 요금의 전부입니다. 세팅비는 별도입니다.</template>
          <template v-else>포함 분량을 넘는 사용량은 AI 처리시간 추가 상품으로 결제 관리에서 선택합니다.</template>
        </p>

        <RouterLink :to="`/consultation`" :class="[ui.btnOnDark, 'mt-6 w-full']">이 플랜으로 세팅 문의하기</RouterLink>
      </div>
    </div>
  </section>
</template>
