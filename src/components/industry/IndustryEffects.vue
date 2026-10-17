<script setup lang="ts">
import { ArrowRight, TrendingUp } from 'lucide-vue-next'
import type { IndustryEffect } from '@/data/industries'

defineProps<{ effects: IndustryEffect[] }>()
</script>

<template>
  <ul class="space-y-4">
    <li v-for="e in effects" :key="e.label" class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-center">
        <p class="font-medium text-stone-900 md:w-1/4">{{ e.label }}</p>

        <div class="flex flex-1 items-center gap-4">
          <div class="flex-1">
            <p class="mb-1 text-xs text-stone-400">Before</p>
            <p class="text-base text-stone-400 line-through">{{ e.before }}</p>
          </div>
          <ArrowRight class="h-5 w-5 shrink-0 text-stone-300" aria-hidden="true" />
          <div class="flex-1">
            <p class="mb-1 text-xs text-stone-400">After</p>
            <p class="text-base font-semibold text-stone-950">{{ e.after }}</p>
          </div>
        </div>

        <div class="md:w-1/4 md:text-right">
          <span class="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <TrendingUp class="h-3 w-3" aria-hidden="true" />{{ e.note }}
          </span>
        </div>
      </div>
    </li>
  </ul>
</template>
