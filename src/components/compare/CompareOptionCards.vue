<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { compareOptions } from '@/data/compare'
</script>

<template>
  <div class="grid gap-5 md:grid-cols-3">
    <article
      v-for="opt in compareOptions"
      :key="opt.title"
      class="rounded-2xl border p-6 shadow-sm sm:p-8"
      :class="opt.dark ? 'border-stone-900 bg-stone-950 text-white shadow-2xl shadow-stone-900/20' : 'border-stone-200 bg-white text-stone-950'"
    >
      <h3 class="text-sm font-semibold" :class="opt.dark ? 'text-stone-200' : 'text-stone-600'">{{ opt.title }}</h3>
      <p class="mt-3 text-3xl font-semibold tracking-tight sm:text-[32px]">{{ opt.price }}</p>
      <ul class="mt-6 space-y-3 text-sm">
        <li v-for="b in opt.bullets" :key="b" class="flex items-start gap-2.5">
          <Check class="mt-0.5 h-4 w-4 shrink-0" :class="opt.dark ? 'text-emerald-400' : 'text-emerald-600'" aria-hidden="true" />
          <span :class="opt.dark ? 'text-stone-200' : 'text-stone-700'">{{ b }}</span>
        </li>
      </ul>
    </article>
  </div>
</template>
