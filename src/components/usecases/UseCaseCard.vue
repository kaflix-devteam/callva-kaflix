<script setup lang="ts">
import { CircleX, Quote, Sparkles } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCaseCta, type UseCaseTab } from '@/data/useCases'

defineProps<{ tab: UseCaseTab }>()
</script>

<template>
  <article
    :id="`usecase-panel-${tab.id}`"
    role="tabpanel"
    :aria-labelledby="`usecase-tab-${tab.id}`"
    class="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
  >
    <!-- headline + stats -->
    <div class="border-b border-stone-200 p-8 sm:p-12">
      <h2 class="text-3xl font-light leading-tight tracking-tight text-stone-950 sm:text-4xl lg:text-5xl">
        {{ tab.title[0] }}<br />{{ tab.title[1] }}
      </h2>
      <p class="mt-4 text-lg text-stone-500">{{ tab.sub }}</p>
      <p class="mt-8 max-w-3xl text-lg leading-relaxed text-stone-700">{{ tab.paragraph }}</p>

      <div class="mt-10 grid gap-4 sm:grid-cols-3">
        <div v-for="s in tab.stats" :key="s.label" class="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center">
          <p class="text-4xl font-light tracking-tight text-stone-950 lg:text-5xl">{{ s.value }}</p>
          <p class="mt-3 font-medium text-stone-900">{{ s.label }}</p>
          <p class="mt-1 text-sm text-stone-500">{{ s.sub }}</p>
        </div>
      </div>
    </div>

    <!-- pains + solution -->
    <div class="p-8 sm:p-12">
      <div class="grid gap-10 lg:grid-cols-2">
        <div>
          <h3 class="mb-5 text-xs font-medium uppercase tracking-widest text-stone-700">이런 고민 있으시죠?</h3>
          <ul class="space-y-4">
            <li v-for="p in tab.pains" :key="p" class="flex items-start gap-3 text-stone-700">
              <CircleX class="mt-0.5 h-5 w-5 shrink-0 text-stone-400" aria-hidden="true" />
              <span>{{ p }}</span>
            </li>
          </ul>
        </div>
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
          <h3 class="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-emerald-800">
            <Sparkles class="h-4 w-4" aria-hidden="true" />Callva AI 솔루션
          </h3>
          <p class="leading-relaxed text-stone-800">{{ tab.solution }}</p>
        </div>
      </div>

      <div class="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <BaseButton :to="useCaseCta.demo.to" variant="primary">{{ useCaseCta.demo.label }}</BaseButton>
        <RouterLink :to="useCaseCta.consult.to" class="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
          {{ useCaseCta.consult.label }}
        </RouterLink>
      </div>

      <!-- testimonial -->
      <figure class="relative mt-12 rounded-2xl border border-stone-200 bg-stone-50 p-8">
        <Quote class="absolute left-6 top-6 h-12 w-12 text-stone-300" aria-hidden="true" />
        <blockquote class="relative pl-8 text-xl font-light leading-relaxed text-stone-900 lg:text-2xl">“ {{ tab.testimonial.quote }} ”</blockquote>
        <figcaption class="mt-6 pl-8 font-medium text-stone-500">— {{ tab.testimonial.who }}</figcaption>
      </figure>
    </div>
  </article>
</template>
