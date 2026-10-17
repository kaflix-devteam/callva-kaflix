<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import type { IndustryPageData } from '@/data/industries'
import { ui } from '@/lib/ui'

defineProps<{ page: IndustryPageData }>()
</script>

<template>
  <div class="mx-auto max-w-3xl text-center">
    <h2 :class="ui.h2">{{ page.closing?.title ?? '바쁠 때도 전화는 놓치지 마세요' }}</h2>
    <p class="mt-4 text-xl font-light text-stone-500">{{ page.closing?.sub ?? `${page.name} 사장님들이 선택한 이유` }}</p>
    <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
      <BaseButton to="/#demo-section" variant="primary">{{ page.primaryCta }}</BaseButton>
      <RouterLink to="/consultation" class="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
        {{ page.closing?.secondaryCta ?? '얼마나 아낄 수 있을까? → 무료 진단' }}
      </RouterLink>
    </div>
    <p class="mt-6 text-xs text-stone-400">약정 없음 · 언제든 해지 가능</p>
  </div>
</template>
