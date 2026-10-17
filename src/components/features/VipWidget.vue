<script setup lang="ts">
import { ref } from 'vue'
import { Clock, PhoneForwarded, Plus, Star, Trash2 } from 'lucide-vue-next'
import WidgetFrame from './WidgetFrame.vue'
import { vipRows } from '@/data/features'

const view = ref<'active' | 'all'>('active')
const columns = ['전화번호', '라벨', '수신 설정', '등록일', '만료일']
</script>

<template>
  <WidgetFrame title="VIP 번호 관리" sub="중요한 전화는 놓치지 않고 바로 연결해요">
    <template #icon><Star class="h-4 w-4" /></template>
    <template #aside>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold tracking-tight text-stone-950">{{ vipRows.length }}</span>
        <span class="text-sm text-stone-500">명 VIP 등록</span>
      </div>
    </template>

    <!-- toolbar -->
    <div class="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3 sm:px-6">
      <div class="inline-flex rounded-lg bg-stone-100 p-1" role="tablist" aria-label="VIP 목록 보기">
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
        <Plus class="h-4 w-4" aria-hidden="true" />VIP 추가
      </button>
    </div>

    <!-- desktop table -->
    <div class="hidden md:block">
      <table class="w-full text-left text-sm">
        <thead class="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
          <tr>
            <th v-for="col in columns" :key="col" class="px-5 py-3 font-medium sm:px-6">{{ col }}</th>
            <th class="px-5 py-3 sm:px-6"><span class="sr-only">삭제</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="row in vipRows" :key="row.phone" class="transition-colors hover:bg-stone-50/60">
            <td class="px-5 py-4 font-mono font-medium text-stone-900 sm:px-6">{{ row.phone }}</td>
            <td class="px-5 py-4 sm:px-6">
              <span class="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-200">{{ row.label }}</span>
            </td>
            <td class="px-5 py-4 text-stone-700 sm:px-6">
              <span class="inline-flex items-center gap-1.5">
                <PhoneForwarded v-if="row.mode === '무조건 대표'" class="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <Clock v-else class="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
                {{ row.mode }}
              </span>
            </td>
            <td class="px-5 py-4 text-stone-500 sm:px-6">{{ row.registeredAt }}</td>
            <td class="px-5 py-4 text-stone-500 sm:px-6">{{ row.expiresAt }}</td>
            <td class="px-5 py-4 text-right sm:px-6">
              <button type="button" class="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700" :aria-label="`${row.phone} 삭제`">
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- mobile cards -->
    <ul class="space-y-3 p-4 md:hidden">
      <li v-for="row in vipRows" :key="row.phone" class="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-sm font-semibold text-stone-900">{{ row.phone }}</span>
              <span class="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-700">{{ row.label }}</span>
            </div>
            <p class="mt-2 inline-flex items-center gap-1.5 text-sm text-stone-700">
              <PhoneForwarded v-if="row.mode === '무조건 대표'" class="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <Clock v-else class="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
              {{ row.mode }}
            </p>
            <p class="mt-1 text-xs text-stone-500">{{ row.registeredAt }} · 만료: {{ row.expiresAt }}</p>
          </div>
          <button type="button" class="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700" :aria-label="`${row.phone} 삭제`">
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </li>
    </ul>
  </WidgetFrame>
</template>
