<script setup lang="ts">
import { Check, Minus } from 'lucide-vue-next'
import { prosCons } from '@/data/compare'
import { ui } from '@/lib/ui'
</script>

<template>
  <div class="grid gap-5 md:grid-cols-3">
    <article v-for="item in prosCons" :key="item.title" :class="[ui.card, 'flex flex-col']">
      <h3 :class="ui.h3">{{ item.title }}</h3>

      <p class="mt-6 text-xs font-semibold uppercase tracking-wider text-emerald-700">장점</p>
      <ul class="mt-3 space-y-2.5 text-sm text-stone-700">
        <li v-for="p in item.pros" :key="p" class="flex items-start gap-2.5">
          <Check class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{{ p }}</span>
        </li>
      </ul>

      <p class="mt-6 text-xs font-semibold uppercase tracking-wider text-amber-700">한계</p>
      <ul class="mt-3 space-y-2.5 text-sm text-stone-700">
        <li v-for="c in item.cons" :key="c" class="flex items-start gap-2.5">
          <Minus class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <span>{{ c }}</span>
        </li>
      </ul>

      <div class="mt-auto pt-6">
        <div class="rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200">
          <p class="text-xs font-semibold text-stone-500">적합한 경우</p>
          <p class="mt-1.5 text-sm font-medium leading-relaxed text-stone-900">{{ item.fit }}</p>
        </div>
      </div>
    </article>
  </div>
</template>
