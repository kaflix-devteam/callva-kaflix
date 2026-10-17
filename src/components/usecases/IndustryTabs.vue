<script setup lang="ts">
import { Briefcase, Building2, Laptop, Scissors, Stethoscope, Utensils } from 'lucide-vue-next'
import type { UseCaseIcon, UseCaseTab } from '@/data/useCases'

defineProps<{ tabs: UseCaseTab[] }>()
const model = defineModel<string>({ required: true })

const icons: Record<UseCaseIcon, typeof Briefcase> = {
  briefcase: Briefcase,
  laptop: Laptop,
  building: Building2,
  scissors: Scissors,
  stethoscope: Stethoscope,
  utensils: Utensils,
}
</script>

<template>
  <div class="flex flex-wrap justify-center gap-3" role="tablist" aria-label="업종 선택">
    <button
      v-for="tab in tabs"
      :id="`usecase-tab-${tab.id}`"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="model === tab.id"
      :aria-controls="`usecase-panel-${tab.id}`"
      class="inline-flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-medium transition-all duration-300"
      :class="model === tab.id ? 'border-stone-950 bg-stone-950 text-white shadow-md' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900'"
      @click="model = tab.id"
    >
      <component :is="icons[tab.icon]" class="h-4.5 w-4.5" aria-hidden="true" />
      {{ tab.label }}
    </button>
  </div>
</template>
