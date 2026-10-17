<script setup lang="ts">
/** Section shell for /for/:slug — optional centered eyebrow + H2, then a max-w-4xl body. */
import SectionLabel from '@/components/ui/SectionLabel.vue'
import { ui } from '@/lib/ui'

withDefaults(defineProps<{ eyebrow?: string; title?: string; tone?: 'white' | 'stone'; wide?: boolean }>(), {
  tone: 'white',
  wide: false,
})
</script>

<template>
  <section class="py-24 lg:py-32" :class="tone === 'white' ? 'bg-white' : 'bg-stone-50'">
    <div class="container-x">
      <div v-if="eyebrow || title" class="mx-auto mb-12 max-w-2xl text-center">
        <SectionLabel v-if="eyebrow" center>{{ eyebrow }}</SectionLabel>
        <h2 v-if="title" :class="[ui.h2, eyebrow && 'mt-4']">{{ title }}</h2>
      </div>
      <div class="mx-auto" :class="wide ? 'max-w-5xl' : 'max-w-4xl'">
        <slot />
      </div>
    </div>
  </section>
</template>
