<script setup lang="ts">
import { computed } from 'vue'
import { Award, ChartColumn, ChartPie, Clock, Target, TrendingDown, TrendingUp, Zap } from 'lucide-vue-next'
import CountUp from './CountUp.vue'
import { callTypeShares, hourlyCalls, kpis, perfMetrics, weeklyTrend } from '@/data/features'

/* --- weekly trend (grouped bars, two series) --- */
const trendMax = computed(() => Math.max(...weeklyTrend.flatMap((d) => [d.ai, d.manual])))
const trendTotals = computed(() => ({
  ai: weeklyTrend.reduce((s, d) => s + d.ai, 0),
  manual: weeklyTrend.reduce((s, d) => s + d.manual, 0),
}))
function barHeight(v: number) {
  return `${Math.round((v / trendMax.value) * 100)}%`
}

/* --- donut --- */
const R = 15.9155 // circumference ≈ 100 so dasharray values are percents
const donutSegments = computed(() => {
  let offset = 0
  return callTypeShares.map((s) => {
    const seg = { ...s, offset }
    offset += s.percent
    return seg
  })
})

/* --- peak hours --- */
const hourMax = Math.max(...hourlyCalls)
function cellOpacity(v: number) {
  return 0.12 + 0.88 * (v / hourMax)
}
const hourLabel = (h: number) => `${String(h).padStart(2, '0')}시`
const peakHour = hourlyCalls.indexOf(hourMax)

const perfIcons = { target: Target, zap: Zap, 'trending-down': TrendingDown } as const
</script>

<template>
  <div class="space-y-4">
    <!-- KPI tiles -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="k in kpis" :key="k.label" class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-medium text-stone-500">{{ k.label }}</p>
        <p class="mt-2 flex items-baseline gap-1">
          <span class="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl"><CountUp :value="k.value" :decimals="k.decimals" /></span>
          <span class="text-sm text-stone-500">{{ k.unit }}</span>
        </p>
        <p v-if="k.delta" class="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" :class="k.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
          <TrendingUp v-if="k.delta.startsWith('+')" class="h-3 w-3" aria-hidden="true" />
          <TrendingDown v-else class="h-3 w-3" aria-hidden="true" />
          {{ k.delta }}
        </p>
        <p v-else class="mt-2 text-xs text-stone-400">최근 30일 평균</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <!-- weekly trend -->
      <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <ChartColumn class="h-4 w-4 text-stone-500" aria-hidden="true" />
            <span class="text-sm font-semibold text-stone-700">통화 트렌드</span>
          </div>
          <ul class="flex items-center gap-3 text-xs" aria-label="범례">
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-stone-900" aria-hidden="true" /><span class="text-stone-600">AI 처리</span><span class="text-stone-400">{{ trendTotals.ai.toLocaleString() }}</span></li>
            <li class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-stone-300" aria-hidden="true" /><span class="text-stone-600">수동 처리</span><span class="text-stone-400">{{ trendTotals.manual.toLocaleString() }}</span></li>
          </ul>
        </div>
        <div class="relative h-48">
          <div class="absolute inset-x-0 top-0 h-full" aria-hidden="true">
            <div v-for="i in 4" :key="i" class="absolute inset-x-0 border-t border-stone-100" :style="{ top: `${(i - 1) * 25}%` }" />
          </div>
          <div class="absolute inset-0 flex items-end justify-between gap-1 border-b border-stone-200" role="img" aria-label="요일별 AI 처리 및 수동 처리 통화 수">
            <div v-for="d in weeklyTrend" :key="d.day" class="group relative flex h-full flex-1 items-end justify-center gap-0.5">
              <div class="flex h-full w-3 items-end sm:w-4">
                <div class="w-full rounded-t bg-stone-900 transition-opacity group-hover:opacity-80" :style="{ height: barHeight(d.ai) }" />
              </div>
              <div class="flex h-full w-3 items-end sm:w-4">
                <div class="w-full rounded-t bg-stone-300 transition-opacity group-hover:opacity-80" :style="{ height: barHeight(d.manual) }" />
              </div>
              <div class="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-[11px] text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
                {{ d.day }} · AI {{ d.ai }} / 수동 {{ d.manual }}
              </div>
            </div>
          </div>
        </div>
        <div class="mt-2 flex justify-between">
          <span v-for="d in weeklyTrend" :key="d.day" class="flex-1 text-center text-xs font-medium text-stone-400">{{ d.day }}</span>
        </div>
      </div>

      <!-- call type distribution -->
      <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="mb-5 flex items-center gap-2">
          <ChartPie class="h-4 w-4 text-stone-500" aria-hidden="true" />
          <span class="text-sm font-semibold text-stone-700">통화 유형 분포</span>
        </div>
        <div class="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <div class="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 36 36" class="h-full w-full -rotate-90" role="img" aria-label="통화 유형 비율 도넛 차트">
              <circle cx="18" cy="18" :r="R" fill="none" stroke="#f5f5f4" stroke-width="4" />
              <circle
                v-for="s in donutSegments"
                :key="s.label"
                cx="18" cy="18" :r="R" fill="none" :stroke="s.color" stroke-width="4"
                :stroke-dasharray="`${s.percent} ${100 - s.percent}`"
                :stroke-dashoffset="-s.offset"
              >
                <title>{{ s.label }} {{ s.percent }}%</title>
              </circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-bold text-stone-950">100%</span>
              <span class="text-xs text-stone-500">총계</span>
            </div>
          </div>
          <ul class="w-full max-w-[220px] space-y-2.5">
            <li v-for="s in callTypeShares" :key="s.label" class="flex items-center gap-2 text-xs">
              <span class="h-3 w-3 shrink-0 rounded-sm" :style="{ backgroundColor: s.color }" aria-hidden="true" />
              <span class="flex-1 text-stone-600">{{ s.label }}</span>
              <span class="font-semibold text-stone-900">{{ s.percent }}%</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- peak hours -->
      <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Clock class="h-4 w-4 text-stone-500" aria-hidden="true" />
            <span class="text-sm font-semibold text-stone-700">피크 시간대 분석</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-stone-500">낮음</span>
            <div class="flex gap-0.5" aria-hidden="true">
              <span v-for="o in [0.2, 0.4, 0.6, 0.8, 1]" :key="o" class="h-3 w-3 rounded-sm bg-stone-900" :style="{ opacity: o }" />
            </div>
            <span class="text-stone-500">높음</span>
          </div>
        </div>
        <div class="grid grid-cols-12 gap-1.5" role="img" :aria-label="`시간대별 통화 수. 가장 많은 시간은 ${hourLabel(peakHour)} ${hourMax}건`">
          <div v-for="(count, h) in hourlyCalls" :key="h" class="group relative">
            <div class="aspect-square rounded-lg bg-stone-900 transition-transform group-hover:scale-110" :style="{ opacity: cellOpacity(count) }" />
            <div class="pointer-events-none absolute -bottom-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-[11px] text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
              {{ hourLabel(h) }}: {{ count }}건
            </div>
          </div>
        </div>
        <div class="mt-3 flex justify-between text-xs font-medium text-stone-400">
          <span>00시</span><span>06시</span><span>12시</span><span>18시</span><span>23시</span>
        </div>
      </div>

      <!-- AI performance -->
      <div class="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <div class="mb-5 flex items-center gap-2">
          <Award class="h-4 w-4 text-stone-700" aria-hidden="true" />
          <span class="text-sm font-semibold text-stone-900">AI 성과 지표</span>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="m in perfMetrics" :key="m.label" class="text-center">
            <span class="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-stone-700 shadow-sm" aria-hidden="true">
              <component :is="perfIcons[m.icon]" class="h-5 w-5" />
            </span>
            <p class="text-2xl font-bold tracking-tight text-stone-950"><CountUp :value="m.value" :decimals="m.decimals" />{{ m.unit }}</p>
            <p class="mt-0.5 text-xs text-stone-600">{{ m.label }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
