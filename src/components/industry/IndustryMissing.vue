<script setup lang="ts">
import { Construction } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import IndustryOthers from './IndustryOthers.vue'
import { ui } from '@/lib/ui'

defineProps<{ slug: string }>()
</script>

<template>
  <section class="bg-white pb-24 pt-32 lg:pb-32 lg:pt-40">
    <div class="container-narrow text-center">
      <SectionLabel center>업종별 안내</SectionLabel>
      <span class="mx-auto mt-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-700" aria-hidden="true">
        <Construction class="h-7 w-7" />
      </span>
      <h1 :class="[ui.h1Light, 'mt-6']">준비 중인 업종입니다</h1>
      <p :class="[ui.lead, 'mx-auto mt-6 max-w-2xl']">
        <code class="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-base text-stone-700">{{ slug }}</code> 업종 전용 페이지는 아직 준비 중입니다.
        전화 문의가 많은 곳이라면 어디든 콜바가 도움이 되니, 아래에서 비슷한 업종을 살펴보거나 바로 문의해 주세요.
      </p>
      <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <BaseButton to="/contact" variant="primary">도입 문의하기</BaseButton>
        <BaseButton to="/use-cases" variant="secondary">활용 사례 보기</BaseButton>
      </div>
    </div>
  </section>

  <section class="bg-stone-50 py-24 lg:py-32">
    <div class="container-x">
      <div class="mx-auto mb-12 max-w-2xl text-center">
        <h2 :class="ui.h2">다른 업종을 확인해보세요</h2>
      </div>
      <div class="mx-auto max-w-4xl">
        <IndustryOthers />
      </div>
    </div>
  </section>
</template>
