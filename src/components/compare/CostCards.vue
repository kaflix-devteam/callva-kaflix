<script setup lang="ts">
import { CircleCheck } from 'lucide-vue-next'
import { costCards, costIntro } from '@/data/compare'
</script>

<template>
  <div class="grid gap-5 md:grid-cols-3">
    <article
      v-for="card in costCards"
      :key="card.title"
      class="flex flex-col rounded-2xl border p-6 shadow-sm"
      :class="card.fixed ? 'border-stone-900 bg-white ring-1 ring-stone-900' : 'border-stone-200 bg-white'"
    >
      <h3 class="text-sm font-semibold text-stone-600">{{ card.title }}</h3>
      <p class="mt-2 tracking-tight text-stone-950" :class="card.fixed ? 'text-3xl font-bold' : 'text-xl font-semibold'">{{ card.headline }}</p>

      <ul class="mt-6 divide-y divide-stone-100 border-t border-stone-200 text-sm">
        <li v-for="line in card.lines" :key="line.label" class="flex items-start justify-between gap-4 py-3">
          <span class="text-stone-500">{{ line.label }}</span>
          <span class="text-right font-medium text-stone-900">{{ line.value }}</span>
        </li>
      </ul>

      <div class="mt-4 flex items-end justify-between gap-4 rounded-xl p-4" :class="card.fixed ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900 ring-1 ring-stone-200'">
        <span class="text-sm" :class="card.fixed ? 'text-stone-300' : 'text-stone-500'">{{ card.annualLabel }}</span>
        <span class="text-right font-bold tracking-tight" :class="card.fixed ? 'text-2xl' : 'text-sm'">{{ card.annual }}</span>
      </div>

      <div v-if="card.checks" class="mt-6">
        <p class="text-xs font-semibold uppercase tracking-wider text-stone-500">{{ costIntro.checksTitle }}</p>
        <ul class="mt-3 space-y-2 text-sm text-stone-700">
          <li v-for="c in card.checks" :key="c" class="flex items-start gap-2.5">
            <CircleCheck class="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
            <span>{{ c }}</span>
          </li>
        </ul>
      </div>
    </article>
  </div>
</template>
