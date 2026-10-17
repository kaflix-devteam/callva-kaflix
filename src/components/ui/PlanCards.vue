<script setup lang="ts">
import { planCta, planNotes, plans, formatKrw } from '@/data/plans'

withDefaults(defineProps<{ ctaTo?: string; ctaLabel?: string; showNotes?: boolean }>(), {
  ctaTo: '/contact',
  ctaLabel: planCta.label,
  showNotes: true,
})
</script>

<template>
  <div>
    <div class="grid gap-6 lg:grid-cols-3">
      <article
        v-for="plan in plans"
        :key="plan.id"
        class="relative flex min-w-0 flex-col rounded-2xl border p-6 sm:p-7"
        :class="plan.recommended
          ? 'border-stone-900 bg-stone-950 text-white shadow-2xl shadow-stone-900/20'
          : 'border-stone-200 bg-white text-stone-950'"
      >
        <span
          v-if="plan.recommended"
          class="absolute right-6 top-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white"
        >추천</span>

        <h3 class="text-sm font-semibold">{{ plan.name }}</h3>
        <p class="mt-1 text-sm" :class="plan.recommended ? 'text-stone-300' : 'text-stone-500'">{{ plan.tagline }}</p>

        <div class="mt-6 flex items-end gap-1.5">
          <span class="text-4xl font-bold tracking-tight sm:text-[40px]">{{ formatKrw(plan.price) }}</span>
          <span class="pb-1.5 text-sm" :class="plan.recommended ? 'text-stone-300' : 'text-stone-500'">/ 월</span>
        </div>
        <p class="mt-1 text-xs" :class="plan.recommended ? 'text-stone-400' : 'text-stone-500'">{{ plan.vatNote }}</p>
        <p v-if="plan.discountNote" class="mt-1.5 text-xs font-medium" :class="plan.recommended ? 'text-emerald-300' : 'text-emerald-700'">
          {{ plan.discountNote }}
        </p>

        <dl class="mt-6 divide-y border-t" :class="plan.recommended ? 'divide-white/10 border-white/10' : 'divide-stone-100 border-stone-200'">
          <div v-for="spec in plan.specs" :key="spec.label" class="flex items-center justify-between py-3 text-sm">
            <dt :class="plan.recommended ? 'text-stone-300' : 'text-stone-500'">{{ spec.label }}</dt>
            <dd class="font-semibold">{{ spec.value }}</dd>
          </div>
        </dl>

        <RouterLink
          :to="ctaTo"
          class="mt-6 inline-flex w-full items-center justify-center gap-2 break-keep rounded-lg border px-5 py-3.5 text-center text-base font-semibold transition-colors"
          :class="plan.recommended
            ? 'border-white bg-white text-stone-950 hover:bg-stone-200'
            : 'border-stone-900 text-stone-950 hover:bg-stone-100'"
        >
          {{ ctaLabel }}
        </RouterLink>
      </article>
    </div>

    <div v-if="showNotes" class="mt-6 grid gap-4 sm:grid-cols-3">
      <div v-for="note in planNotes" :key="note.label" class="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wider text-stone-500">{{ note.label }}</p>
        <p class="mt-2 font-semibold text-stone-950">{{ note.value }}</p>
        <p class="mt-1 text-sm text-stone-500">{{ note.sub }}</p>
      </div>
    </div>
  </div>
</template>
