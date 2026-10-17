<script setup lang="ts">
/**
 * Section shell for /features: centered eyebrow + H2 + lead, then a max-w-5xl body slot.
 * Backgrounds alternate white / stone-50 via `tone`.
 */
import SectionLabel from '@/components/ui/SectionLabel.vue'
import { ui } from '@/lib/ui'

withDefaults(defineProps<{ eyebrow: string; title: string; desc?: string; tone?: 'white' | 'stone' }>(), {
  tone: 'white',
})
</script>

<template>
  <section class="py-24 lg:py-32" :class="tone === 'white' ? 'bg-white' : 'bg-stone-50'">
    <div class="container-x">
      <div class="mx-auto max-w-2xl text-center">
        <SectionLabel center>{{ eyebrow }}</SectionLabel>
        <h2 :class="[ui.h2, 'mt-4']">{{ title }}</h2>
        <p v-if="desc" :class="[ui.lead, 'mt-4']">{{ desc }}</p>
      </div>
      <div class="mx-auto mt-14 max-w-5xl">
        <slot />
      </div>
    </div>
  </section>
</template>
