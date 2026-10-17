<script setup lang="ts">
import { Phone, ShieldBan, Sparkles, Tag } from 'lucide-vue-next'
import type { IndustryPageData } from '@/data/industries'

defineProps<{ features: IndustryPageData['features'] }>()
const icons = [Phone, Tag, ShieldBan, Sparkles]
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <article
      v-for="(f, i) in features"
      :key="f.title"
      class="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md lg:p-8"
    >
      <span class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700" aria-hidden="true">
        <component :is="icons[i % icons.length]" class="h-5 w-5" />
      </span>
      <h3 class="text-lg font-semibold text-stone-950">{{ f.title }}</h3>
      <p class="mt-2 text-sm leading-relaxed text-stone-600">{{ f.desc }}</p>
    </article>
  </div>
</template>
