<script setup lang="ts">
import { ArrowRight, Check } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import type { IndustryPageData } from '@/data/industries'
import { ui } from '@/lib/ui'

defineProps<{ page: IndustryPageData; emoji?: string }>()
</script>

<template>
  <section class="relative overflow-hidden bg-white pb-24 pt-32 lg:pb-32 lg:pt-40">
    <div class="container-narrow text-center">
      <SectionLabel variant="badge" center>
        <template v-if="emoji" #icon><span aria-hidden="true">{{ emoji }}</span></template>
        {{ page.badge }}
      </SectionLabel>
      <h1 :class="[ui.h1Light, 'mt-6 animate-fade-up']">{{ page.heroTitle[0] }}<br />{{ page.heroTitle[1] }}</h1>
      <p :class="[ui.lead, 'mx-auto mt-6 max-w-2xl']">{{ page.heroDesc }}</p>

      <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <BaseButton to="/#demo-section" variant="primary">{{ page.primaryCta }}</BaseButton>
        <RouterLink to="/features" class="inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
          기능 둘러보기<ArrowRight class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
      </div>

      <ul class="mt-8 flex flex-wrap justify-center gap-3">
        <li
          v-for="stat in page.heroStats"
          :key="stat"
          class="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700"
        >
          <Check class="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />{{ stat }}
        </li>
      </ul>
    </div>
  </section>
</template>
