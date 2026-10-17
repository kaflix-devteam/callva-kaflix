<script setup lang="ts">
import ExpansionGrid from '@/components/ui/ExpansionGrid.vue'
import { expansionsIntro } from '@/data/expansions'
import { homeUi } from './homeUi'
</script>

<template>
  <section class="bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
    <div class="mx-auto max-w-7xl">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-16">
        <div>
          <p :class="homeUi.eyebrow">{{ expansionsIntro.eyebrow }}</p>
          <h2 :class="homeUi.displayH2">{{ expansionsIntro.title }}</h2>
        </div>
        <p class="max-w-xl text-base leading-7 text-stone-600 lg:justify-self-end">{{ expansionsIntro.desc }}</p>
      </div>
      <div class="mt-12 lg:mt-16">
        <ExpansionGrid />
      </div>
    </div>
  </section>
</template>
