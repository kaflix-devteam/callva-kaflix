<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { industryLinks } from '@/data/industries'

const props = defineProps<{ exclude?: string }>()
const links = computed(() => industryLinks.filter((l) => l.slug !== props.exclude))
</script>

<template>
  <div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <RouterLink
        v-for="l in links"
        :key="l.slug"
        :to="`/for/${l.slug}`"
        class="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:border-stone-300 hover:shadow-md"
      >
        <span class="text-xl" aria-hidden="true">{{ l.emoji }}</span>
        <span class="text-sm text-stone-600 transition-colors group-hover:text-stone-900">{{ l.name }}</span>
      </RouterLink>
    </div>
    <div class="mt-8 text-center">
      <RouterLink to="/use-cases" class="inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
        전체 도입 사례 보기<ArrowRight class="h-4 w-4" aria-hidden="true" />
      </RouterLink>
    </div>
  </div>
</template>
