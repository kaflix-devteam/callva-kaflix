<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { industryLinks } from '@/data/industries'
import { useCaseOtherSlugs } from '@/data/useCases'

/** The 7 industries the original lists, in its order, plus the "모든 사례 보기" tile. */
const tiles = computed(() =>
  useCaseOtherSlugs
    .map((slug) => industryLinks.find((l) => l.slug === slug))
    .filter((l): l is NonNullable<typeof l> => !!l)
    .map((l) => ({ to: `/for/${l.slug}`, emoji: l.emoji, name: l.name, sub: l.sub }))
    .concat([{ to: '/use-cases', emoji: '📋', name: '모든 사례 보기', sub: '업종별 도입 사례' }]),
)
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <RouterLink
      v-for="t in tiles"
      :key="t.to"
      :to="t.to"
      class="group rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
    >
      <div class="mb-2 flex items-center gap-3">
        <span class="text-2xl" aria-hidden="true">{{ t.emoji }}</span>
        <span class="font-medium text-stone-900">{{ t.name }}</span>
      </div>
      <p class="text-sm text-stone-500">{{ t.sub }}</p>
      <ChevronRight class="mt-3 h-4 w-4 text-stone-400 transition-all group-hover:translate-x-1" aria-hidden="true" />
    </RouterLink>
  </div>
</template>
