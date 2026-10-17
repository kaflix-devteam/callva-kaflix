<script setup lang="ts">
import { Check, Minus } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { IndustryCostOption } from '@/data/industries'

defineProps<{ options: IndustryCostOption[] }>()
</script>

<template>
  <div>
    <div class="grid gap-6 lg:grid-cols-3">
      <article
        v-for="opt in options"
        :key="opt.name"
        class="relative flex flex-col rounded-2xl border p-6 lg:p-8"
        :class="opt.recommended ? 'border-stone-900 bg-stone-950 text-white shadow-2xl shadow-stone-900/20' : 'border-stone-200 bg-white text-stone-950 shadow-sm'"
      >
        <span v-if="opt.recommended" class="absolute right-6 top-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">추천</span>

        <h3 class="text-lg font-semibold">{{ opt.name }}</h3>
        <p class="mt-3 flex items-baseline gap-1.5">
          <span class="text-3xl font-semibold tracking-tight">{{ opt.price }}</span>
          <span class="text-sm" :class="opt.recommended ? 'text-stone-400' : 'text-stone-500'">/ 월</span>
        </p>

        <ul class="mt-6 space-y-2 text-sm">
          <li v-for="p in opt.pros" :key="p" class="flex items-start gap-2">
            <Check class="mt-0.5 h-4 w-4 shrink-0" :class="opt.recommended ? 'text-emerald-400' : 'text-emerald-600'" aria-hidden="true" />
            <span :class="opt.recommended ? 'text-stone-100' : 'text-stone-700'">{{ p }}</span>
          </li>
        </ul>
        <ul class="mt-4 space-y-2 border-t pt-4 text-sm" :class="opt.recommended ? 'border-white/10' : 'border-stone-200'">
          <li v-for="c in opt.cons" :key="c" class="flex items-start gap-2">
            <Minus class="mt-0.5 h-4 w-4 shrink-0" :class="opt.recommended ? 'text-stone-500' : 'text-stone-400'" aria-hidden="true" />
            <span :class="opt.recommended ? 'text-stone-400' : 'text-stone-500'">{{ c }}</span>
          </li>
        </ul>
      </article>
    </div>

    <div class="mt-10 text-center">
      <BaseButton to="/#demo-section" variant="primary">데모 체험하기</BaseButton>
    </div>
  </div>
</template>
