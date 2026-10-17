<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import IndustryTabs from '@/components/usecases/IndustryTabs.vue'
import UseCaseCard from '@/components/usecases/UseCaseCard.vue'
import OtherIndustriesGrid from '@/components/usecases/OtherIndustriesGrid.vue'
import { useCaseCta, useCaseTabs } from '@/data/useCases'
import { ui } from '@/lib/ui'

const activeId = ref(useCaseTabs[0]?.id ?? 'professional')
const activeTab = computed(() => useCaseTabs.find((t) => t.id === activeId.value) ?? useCaseTabs[0])
</script>

<template>
  <!-- hero -->
  <section class="pb-16 pt-32 lg:pt-40">
    <div class="container-narrow text-center">
      <SectionLabel center>업종별 솔루션</SectionLabel>
      <h1 :class="[ui.h1Light, 'mt-6 animate-fade-up']">어떤 업종이든,<br />전화 업무가 많다면</h1>
      <p :class="[ui.lead, 'mx-auto mt-6 max-w-2xl']">
        업종별로 다른 고민, 하지만 해결책은 같습니다. 콜바가 전화를 받으면, 담당자님은 본업에 집중할 수 있습니다.
      </p>
    </div>
  </section>

  <!-- industry tabs + card -->
  <section class="pb-24 lg:pb-32">
    <div class="container-x">
      <IndustryTabs v-model="activeId" :tabs="useCaseTabs" />
      <div class="mx-auto mt-10 max-w-6xl">
        <Transition name="usecase-fade" mode="out-in">
          <UseCaseCard v-if="activeTab" :key="activeTab.id" :tab="activeTab" />
        </Transition>
      </div>
    </div>
  </section>

  <!-- other industries -->
  <section class="bg-white py-24 lg:py-32">
    <div class="container-x">
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <SectionLabel center>다른 업종</SectionLabel>
        <h2 :class="[ui.h2, 'mt-4']">다른 업종도 가능합니다</h2>
        <p :class="[ui.lead, 'mt-4']">전화 문의가 많은 곳이라면 어디든 콜바가 도움이 됩니다.</p>
      </div>
      <div class="mx-auto max-w-5xl">
        <OtherIndustriesGrid />
      </div>
    </div>
  </section>

  <!-- bottom CTA -->
  <section class="py-24 lg:py-32">
    <div class="container-narrow">
      <div class="mx-auto max-w-3xl text-center">
        <h2 :class="ui.h2">다음 영업전화부터 AI가 받습니다</h2>
        <p :class="[ui.lead, 'mt-5']">기존 메뉴판이나 가격표 올리면 됩니다. 따로 설정할 거 없어요.</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <BaseButton :to="useCaseCta.demo.to" variant="primary">{{ useCaseCta.demo.label }}</BaseButton>
          <RouterLink :to="useCaseCta.consult.to" class="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
            {{ useCaseCta.consult.label }}
          </RouterLink>
        </div>
        <p class="mt-6 text-xs text-stone-400">약정 없음 · 언제든 해지 가능</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.usecase-fade-enter-active,
.usecase-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.usecase-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.usecase-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .usecase-fade-enter-active,
  .usecase-fade-leave-active {
    transition: none;
  }
}
</style>
