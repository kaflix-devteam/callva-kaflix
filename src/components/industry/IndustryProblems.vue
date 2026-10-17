<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'
import type { IndustryPageData } from '@/data/industries'

defineProps<{ problems: IndustryPageData['problems'] }>()
</script>

<template>
  <ul class="space-y-4">
    <li
      v-for="p in problems"
      :key="p.pain"
      class="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md lg:p-8"
    >
      <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-100" aria-hidden="true">
        <X class="h-5 w-5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-stone-950">{{ p.pain }}</p>
        <p class="mt-2 flex items-start gap-2 text-sm leading-relaxed text-stone-600">
          <Check class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{{ p.solution }}</span>
        </p>
      </div>
    </li>
  </ul>
</template>
