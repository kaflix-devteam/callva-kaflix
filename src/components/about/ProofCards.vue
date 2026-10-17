<script setup lang="ts">
import { aboutTech } from '@/data/about'
import { ui } from '@/lib/ui'
</script>

<template>
  <div class="grid gap-5 md:grid-cols-3">
    <article v-for="proof in aboutTech.proofs" :key="proof.index" :class="[ui.card, 'relative overflow-hidden sm:p-8']">
      <span class="absolute inset-x-0 top-0 h-1 bg-stone-950" aria-hidden="true" />
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-stone-400">PROOF / {{ proof.index }}</p>
      <h3 :class="[ui.h3, 'mt-5']">{{ proof.title }}</h3>
      <p class="mt-3 text-sm leading-7 text-stone-600">{{ proof.desc }}</p>
    </article>
  </div>
</template>
