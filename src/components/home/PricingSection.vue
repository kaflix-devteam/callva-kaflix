<script setup lang="ts">
import PlanCards from '@/components/ui/PlanCards.vue'
import { pricingIntro } from '@/data/plans'
import { homeUi } from './homeUi'
</script>

<template>
  <section class="px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:gap-14">
      <div class="max-w-2xl">
        <p :class="homeUi.eyebrow">{{ pricingIntro.eyebrow }}</p>
        <h2 :class="homeUi.displayH2">{{ pricingIntro.title }}</h2>
        <p class="mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-stone-600">{{ pricingIntro.homeDesc }}</p>
      </div>
      <PlanCards cta-to="/contact" />
    </div>
  </section>
</template>
