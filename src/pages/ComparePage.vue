<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import CompareOptionCards from '@/components/compare/CompareOptionCards.vue'
import CompareTable from '@/components/compare/CompareTable.vue'
import ProsConsCards from '@/components/compare/ProsConsCards.vue'
import CostCards from '@/components/compare/CostCards.vue'
import { compareCta, compareIntro, compareTable, costIntro, prosConsIntro } from '@/data/compare'
import { ui } from '@/lib/ui'
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="container-narrow animate-fade-up pb-24 pt-32 text-center lg:pb-32" aria-labelledby="compare-title">
      <p class="eyebrow">{{ compareIntro.eyebrow }}</p>
      <h1 id="compare-title" :class="[ui.h1Light, 'mx-auto mt-4 max-w-4xl']">{{ compareIntro.title }}</h1>
      <p :class="[ui.lead, 'mx-auto mt-6 max-w-3xl']">{{ compareIntro.desc }}</p>
    </section>

    <!-- Quick options -->
    <section class="bg-white py-24 lg:py-32" aria-label="선택지 요약">
      <div class="container-narrow">
        <CompareOptionCards />
      </div>
    </section>

    <!-- Detail table -->
    <section class="py-24 lg:py-32" aria-labelledby="compare-table-title">
      <div class="container-narrow">
        <div class="text-center">
          <p class="eyebrow">{{ compareTable.eyebrow }}</p>
          <h2 id="compare-table-title" :class="[ui.h2, 'mt-3']">{{ compareTable.title }}</h2>
        </div>
        <div class="mt-12">
          <CompareTable />
        </div>
      </div>
    </section>

    <!-- Pros / cons -->
    <section class="bg-white py-24 lg:py-32" aria-labelledby="compare-pros-title">
      <div class="container-narrow">
        <div class="text-center">
          <p class="eyebrow">{{ prosConsIntro.eyebrow }}</p>
          <h2 id="compare-pros-title" :class="[ui.h2, 'mt-3']">{{ prosConsIntro.title }}</h2>
        </div>
        <div class="mt-12">
          <ProsConsCards />
        </div>
      </div>
    </section>

    <!-- Cost analysis -->
    <section class="py-24 lg:py-32" aria-labelledby="compare-cost-title">
      <div class="container-narrow">
        <div class="text-center">
          <p class="eyebrow">{{ costIntro.eyebrow }}</p>
          <h2 id="compare-cost-title" :class="[ui.h2, 'mt-3']">{{ costIntro.title }}</h2>
          <p :class="[ui.lead, 'mx-auto mt-4 max-w-3xl']">{{ costIntro.desc }}</p>
        </div>
        <div class="mt-12">
          <CostCards />
        </div>
        <p class="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-stone-500">{{ compareCta.scopeNote }}</p>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-stone-950 py-20 text-white lg:py-28" aria-labelledby="compare-cta-title">
      <div class="container-narrow text-center">
        <h2 id="compare-cta-title" class="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{{ compareCta.title }}</h2>
        <p class="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-stone-300">{{ compareCta.desc }}</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <BaseButton :to="compareCta.primary.to" variant="onDark">{{ compareCta.primary.label }}</BaseButton>
          <BaseButton :to="compareCta.secondary.to" variant="outlineOnDark">{{ compareCta.secondary.label }}</BaseButton>
        </div>
        <p class="mt-5 text-sm text-stone-400">{{ compareCta.note }}</p>
      </div>
    </section>
  </div>
</template>
