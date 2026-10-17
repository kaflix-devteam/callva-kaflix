<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'
import { compareRows, compareTable, type CompareCell } from '@/data/compare'

const valueColumns = compareTable.columns.slice(1)
const keys = ['callva', 'alba', 'callcenter'] as const

function cellsOf(row: (typeof compareRows)[number]): CompareCell[] {
  return keys.map((k) => row[k])
}
</script>

<template>
  <div>
    <!-- Desktop table -->
    <div class="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:block">
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-stone-200 bg-stone-50">
            <th
              v-for="(col, i) in compareTable.columns"
              :key="col"
              scope="col"
              class="px-5 py-4 font-semibold"
              :class="[i === 0 ? 'w-[26%] text-stone-500' : 'text-center', i === 1 ? 'bg-stone-100 text-stone-950' : 'text-stone-700']"
            >{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in compareRows" :key="row.feature" class="border-b border-stone-200 last:border-b-0 transition-colors hover:bg-stone-50">
            <th scope="row" class="px-5 py-5 text-sm font-medium text-stone-700">{{ row.feature }}</th>
            <td
              v-for="(cell, i) in cellsOf(row)"
              :key="i"
              class="px-4 py-5 text-center"
              :class="i === 0 ? 'bg-stone-100 font-medium text-stone-950' : 'text-stone-600'"
            >
              <template v-if="typeof cell === 'boolean'">
                <Check v-if="cell" class="mx-auto h-5 w-5 text-emerald-700" aria-label="가능" />
                <X v-else class="mx-auto h-5 w-5 text-stone-400" aria-label="해당 없음" />
              </template>
              <template v-else>{{ cell }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile: one card per row -->
    <div class="space-y-4 md:hidden">
      <article v-for="row in compareRows" :key="row.feature" class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 class="text-sm font-semibold text-stone-950">{{ row.feature }}</h3>
        <dl class="mt-3 divide-y divide-stone-100">
          <div v-for="(cell, i) in cellsOf(row)" :key="i" class="flex items-start justify-between gap-4 py-2.5 text-sm">
            <dt class="shrink-0" :class="i === 0 ? 'font-semibold text-stone-950' : 'text-stone-500'">{{ valueColumns[i] }}</dt>
            <dd class="text-right" :class="i === 0 ? 'font-medium text-stone-950' : 'text-stone-600'">
              <template v-if="typeof cell === 'boolean'">
                <Check v-if="cell" class="ml-auto h-5 w-5 text-emerald-700" aria-label="가능" />
                <X v-else class="ml-auto h-5 w-5 text-stone-400" aria-label="해당 없음" />
              </template>
              <template v-else>{{ cell }}</template>
            </dd>
          </div>
        </dl>
      </article>
    </div>

    <p class="mt-4 text-xs text-stone-500">{{ compareTable.note }}</p>
  </div>
</template>
