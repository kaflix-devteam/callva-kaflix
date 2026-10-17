<script setup lang="ts">
import { BookOpen, Brain, CircleCheckBig, Database, FileText, LoaderCircle, RefreshCw, Sparkles, Tag, Upload } from 'lucide-vue-next'
import { knowledgeCategories, learningActivities, learningProgress } from '@/data/features'

const RADIUS = 42
const CIRC = 2 * Math.PI * RADIUS
const dash = CIRC * (learningProgress / 100)

const categoryIcons = [BookOpen, Tag, FileText, Database, Brain]
</script>

<template>
  <div class="space-y-4">
    <!-- progress header card -->
    <div class="flex flex-col gap-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
      <div class="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" :r="RADIUS" fill="none" stroke="#e7e5e4" stroke-width="8" />
          <circle
            cx="50" cy="50" :r="RADIUS" fill="none" stroke="#1c1917" stroke-width="8" stroke-linecap="round"
            :stroke-dasharray="`${dash} ${CIRC - dash}`"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-2xl font-bold tracking-tight text-stone-950">{{ learningProgress }}%</span>
          <span class="text-[11px] font-medium text-stone-500">학습 완료</span>
        </div>
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <Brain class="h-5 w-5 text-stone-700" aria-hidden="true" />
          <h3 class="text-lg font-bold text-stone-950">체계적 학습 진행 중</h3>
        </div>
        <p class="mt-1 text-sm text-stone-600">비즈니스 지식을 구조화하여 AI에게 학습시키고 있어요</p>
        <div class="mt-4 h-2 w-full overflow-hidden rounded-full bg-stone-200" role="progressbar" :aria-valuenow="learningProgress" aria-valuemin="0" aria-valuemax="100" aria-label="학습 진행률">
          <div class="h-full rounded-full bg-stone-900 transition-all" :style="{ width: `${learningProgress}%` }" />
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <!-- knowledge base -->
      <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Database class="h-4 w-4 text-stone-500" aria-hidden="true" />
            <span class="text-sm font-semibold text-stone-700">지식 베이스</span>
          </div>
          <span class="rounded bg-stone-100 px-2 py-1 text-xs font-medium text-stone-500">{{ knowledgeCategories.length }}개 카테고리</span>
        </div>
        <ul class="space-y-3">
          <li v-for="(cat, i) in knowledgeCategories" :key="cat.name" class="group flex items-center gap-3 rounded-xl bg-stone-50 p-3 transition-colors hover:bg-stone-100">
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 transition-transform group-hover:scale-110" aria-hidden="true">
              <component :is="categoryIcons[i % categoryIcons.length]" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="mb-1.5 flex items-center justify-between gap-2">
                <span class="truncate text-sm font-medium text-stone-900">{{ cat.name }}</span>
                <span class="shrink-0 font-mono text-xs text-stone-600">{{ cat.done }} / {{ cat.total }}</span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div class="h-full rounded-full" :class="cat.done === cat.total ? 'bg-emerald-600' : 'bg-stone-700'" :style="{ width: `${Math.round((cat.done / cat.total) * 100)}%` }" />
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- recent activity + upload -->
      <div class="flex flex-col gap-4">
        <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center gap-2">
            <RefreshCw class="h-4 w-4 text-stone-500" aria-hidden="true" />
            <span class="text-sm font-semibold text-stone-700">최근 학습 활동</span>
          </div>
          <ul class="divide-y divide-stone-100">
            <li v-for="a in learningActivities" :key="a.text" class="flex items-start gap-3 py-3">
              <CircleCheckBig v-if="a.status === 'done'" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <RefreshCw v-else-if="a.status === 'updated'" class="mt-0.5 h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />
              <LoaderCircle v-else class="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-500" aria-hidden="true" />
              <div class="min-w-0 flex-1">
                <p class="text-sm text-stone-800">{{ a.text }}</p>
                <p class="mt-0.5 text-xs text-stone-400">{{ a.when }}</p>
              </div>
            </li>
          </ul>
        </div>

        <button
          type="button"
          class="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-6 py-8 text-center transition-colors hover:border-stone-400 hover:bg-stone-50"
        >
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600" aria-hidden="true">
            <Upload class="h-5 w-5" />
          </span>
          <span class="text-sm font-medium text-stone-700">문서를 업로드하여 학습 시작</span>
        </button>
      </div>
    </div>

    <!-- note -->
    <div class="flex items-start gap-4 rounded-2xl border border-stone-200 bg-stone-100 p-6">
      <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-700 shadow-sm" aria-hidden="true">
        <Sparkles class="h-5 w-5" />
      </span>
      <div>
        <p class="font-semibold text-stone-950">AI가 비즈니스를 더 깊이 이해하고 있어요</p>
        <p class="mt-1 text-sm leading-relaxed text-stone-600">체계적으로 학습된 지식으로 더욱 정확하고 자연스러운 응대가 가능합니다.</p>
      </div>
    </div>
  </div>
</template>
