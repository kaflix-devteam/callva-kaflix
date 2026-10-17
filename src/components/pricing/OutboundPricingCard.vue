<script setup lang="ts">
import { outboundPricing } from '@/data/plans'
import { ui } from '@/lib/ui'
</script>

<template>
  <section class="container-x mt-16 sm:mt-20" aria-labelledby="outbound-pricing-title">
    <div class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
      <p class="eyebrow">{{ outboundPricing.eyebrow }}</p>
      <h2 id="outbound-pricing-title" :class="[ui.h2, 'mt-3']">{{ outboundPricing.title }}</h2>
      <p :class="[ui.body, 'mt-3 max-w-3xl']">{{ outboundPricing.desc }}</p>

      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <article v-for="item in outboundPricing.items" :key="item.name" :class="ui.cardMuted">
          <p class="text-sm font-semibold text-stone-500">{{ item.name }}</p>
          <p class="mt-2 text-xl font-semibold tracking-tight text-stone-950">{{ item.price }}</p>
          <p class="mt-2 text-sm leading-relaxed text-stone-600">{{ item.desc }}</p>
        </article>
      </div>

      <h3 class="mt-10 text-sm font-semibold text-stone-800">{{ outboundPricing.scenariosTitle }}</h3>
      <div class="mt-4 grid gap-4 sm:grid-cols-3">
        <div v-for="s in outboundPricing.scenarios" :key="s.label" class="rounded-2xl border border-stone-200 bg-white p-5">
          <p class="text-sm text-stone-600">{{ s.label }}</p>
          <p class="mt-3 text-3xl font-bold tracking-tight text-stone-950">{{ s.price }}</p>
          <p class="mt-1 text-xs text-stone-500">{{ s.sub }}</p>
        </div>
      </div>

      <p class="mt-6 text-xs leading-relaxed text-stone-500">{{ outboundPricing.footnote }}</p>
    </div>
  </section>
</template>
