<script setup lang="ts">
import { computed, ref } from 'vue'
import { Phone, PhoneMissed } from 'lucide-vue-next'
import WidgetFrame from './WidgetFrame.vue'
import { callLogFilters, callLogStats, callLogs, type CallCategory } from '@/data/features'
import { ui } from '@/lib/ui'

type FilterId = 'all' | CallCategory

const active = ref<FilterId>('all')

const visible = computed(() => (active.value === 'all' ? callLogs : callLogs.filter((c) => c.category === active.value)))
const callbackCount = computed(() => callLogs.filter((c) => c.category === '콜백 필요').length)

function countFor(id: FilterId) {
  return id === 'all' ? callLogs.length : callLogs.filter((c) => c.category === id).length
}

const categoryChip: Record<CallCategory, string> = {
  '예약/주문': 'bg-stone-900 text-white',
  '일반 문의': 'bg-stone-100 text-stone-700 ring-1 ring-stone-200',
  '콜백 필요': 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
}
</script>

<template>
  <WidgetFrame title="통화 기록" sub="콜바가 받은 전화 내역을 확인해요">
    <template #icon><Phone class="h-4 w-4" /></template>
    <template #aside>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold tracking-tight text-stone-950">{{ callLogs.length }}</span>
        <span class="text-sm text-stone-500">건</span>
      </div>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold tracking-tight text-amber-600">{{ callbackCount }}</span>
        <span class="text-sm text-stone-500">콜백 필요</span>
      </div>
    </template>

    <!-- filter tabs -->
    <div class="flex flex-wrap gap-2 border-b border-stone-100 px-5 py-3 sm:px-6" role="tablist" aria-label="통화 분류 필터">
      <button
        v-for="f in callLogFilters"
        :key="f.id"
        type="button"
        role="tab"
        :aria-selected="active === f.id"
        class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
        :class="active === f.id ? 'bg-stone-950 text-white' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900'"
        @click="active = f.id"
      >
        {{ f.label }}
        <span class="text-xs" :class="active === f.id ? 'text-stone-300' : 'text-stone-400'">{{ countFor(f.id) }}</span>
      </button>
    </div>

    <!-- rows -->
    <ul class="divide-y divide-stone-100">
      <li v-for="c in visible" :key="c.id" class="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-stone-50/60 sm:px-6">
        <div class="flex w-14 shrink-0 flex-col items-center">
          <span class="font-mono text-sm font-medium text-stone-700">{{ c.time }}</span>
          <span class="mt-1 text-xs text-stone-400">{{ c.duration }}</span>
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <span class="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-mono text-xs text-stone-600">{{ c.phone }}</span>
            <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="categoryChip[c.category]">{{ c.category }}</span>
          </div>
          <p class="text-sm leading-relaxed text-stone-800">{{ c.summary }}</p>
        </div>
        <div class="shrink-0 self-center">
          <span v-if="c.category === '콜백 필요'" :class="ui.chipAmber" class="inline-flex items-center gap-1">
            <PhoneMissed class="h-3 w-3" aria-hidden="true" />콜백 필요
          </span>
          <span v-else :class="ui.chipEmerald">AI 처리</span>
        </div>
      </li>
    </ul>

    <!-- footer stats -->
    <div class="grid grid-cols-3 divide-x divide-stone-200 border-t border-stone-100 bg-stone-50">
      <div v-for="s in callLogStats" :key="s.label" class="px-4 py-4 text-center">
        <p class="text-xs text-stone-500">{{ s.label }}</p>
        <p class="mt-1 text-lg font-bold tracking-tight text-stone-950">{{ s.value }}</p>
      </div>
    </div>
  </WidgetFrame>
</template>
