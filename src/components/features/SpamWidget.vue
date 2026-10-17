<script setup lang="ts">
import { ref } from 'vue'
import { Ban, ShieldBan, Trash2 } from 'lucide-vue-next'
import WidgetFrame from './WidgetFrame.vue'
import { spamRows } from '@/data/features'

const view = ref<'active' | 'all'>('active')
const columns = ['전화번호', '차단 사유', '차단일', '만료일', '재시도']

/** "광고전화 - 부동산 투자 권유" → ["광고전화", "부동산 투자 권유"] */
function splitReason(reason: string): [string, string] {
  const i = reason.indexOf(' - ')
  return i === -1 ? [reason, ''] : [reason.slice(0, i), reason.slice(i + 3)]
}
</script>

<template>
  <WidgetFrame title="차단번호 관리" sub="광고전화와 스팸을 자동으로 차단해요">
    <template #icon><ShieldBan class="h-4 w-4" /></template>
    <template #aside>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold tracking-tight text-stone-950">{{ spamRows.length }}</span>
        <span class="text-sm text-stone-500">건 차단 중</span>
      </div>
    </template>

    <div class="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3 sm:px-6">
      <div class="inline-flex rounded-lg bg-stone-100 p-1" role="tablist" aria-label="차단 목록 보기">
        <button
          v-for="opt in [{ id: 'active', label: '활성' }, { id: 'all', label: '전체' }] as const"
          :key="opt.id"
          type="button"
          role="tab"
          :aria-selected="view === opt.id"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="view === opt.id ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-800'"
          @click="view = opt.id"
        >
          {{ opt.label }}
        </button>
      </div>
      <button type="button" class="inline-flex items-center gap-1.5 rounded-lg bg-stone-950 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-800">
        <Ban class="h-4 w-4" aria-hidden="true" />번호 차단
      </button>
    </div>

    <!-- desktop table -->
    <div class="hidden md:block">
      <table class="w-full text-left text-sm">
        <thead class="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
          <tr>
            <th v-for="col in columns" :key="col" class="px-5 py-3 font-medium sm:px-6">{{ col }}</th>
            <th class="px-5 py-3 sm:px-6"><span class="sr-only">해제</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="row in spamRows" :key="row.phone" class="transition-colors hover:bg-stone-50/60">
            <td class="px-5 py-4 font-mono font-medium text-stone-900 sm:px-6">{{ row.phone }}</td>
            <td class="px-5 py-4 sm:px-6">
              <span class="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-200">{{ splitReason(row.reason)[0] }}</span>
              <span class="ml-2 text-stone-600">{{ splitReason(row.reason)[1] }}</span>
            </td>
            <td class="whitespace-nowrap px-5 py-4 text-stone-500 sm:px-6">{{ row.blockedAt }}</td>
            <td class="whitespace-nowrap px-5 py-4 text-stone-500 sm:px-6">{{ row.expiresAt }}</td>
            <td class="px-5 py-4 sm:px-6">
              <span v-if="row.retries !== '-'" class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">{{ row.retries }}</span>
              <span v-else class="text-stone-400">-</span>
            </td>
            <td class="px-5 py-4 text-right sm:px-6">
              <button type="button" class="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700" :aria-label="`${row.phone} 차단 해제`">
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- mobile cards -->
    <ul class="space-y-3 p-4 md:hidden">
      <li v-for="row in spamRows" :key="row.phone" class="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-sm font-semibold text-stone-900">{{ row.phone }}</span>
              <span class="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-700">{{ splitReason(row.reason)[0] }}</span>
            </div>
            <p class="mt-1.5 text-sm text-stone-700">{{ splitReason(row.reason)[1] }}</p>
            <p class="mt-1 text-xs text-stone-500">
              {{ row.blockedAt }}<template v-if="row.retries !== '-'"> · {{ row.retries }} 재시도</template>
            </p>
            <p class="text-xs text-stone-500">만료: {{ row.expiresAt }}</p>
          </div>
          <button type="button" class="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700" :aria-label="`${row.phone} 차단 해제`">
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </li>
    </ul>
  </WidgetFrame>
</template>
