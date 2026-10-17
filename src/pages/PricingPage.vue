<script setup lang="ts">
import { ArrowRight, ShieldCheck } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import PlanCards from '@/components/ui/PlanCards.vue'
import ExpansionGrid from '@/components/ui/ExpansionGrid.vue'
import FaqAccordion from '@/components/ui/FaqAccordion.vue'
import PricingCalculator from '@/components/pricing/PricingCalculator.vue'
import OutboundPricingCard from '@/components/pricing/OutboundPricingCard.vue'
import { pricingIntro } from '@/data/plans'
import { expansionsIntro } from '@/data/expansions'
import { pricingFaqs } from '@/data/faqs'
import { ui } from '@/lib/ui'
</script>

<template>
  <div class="pb-24 pt-32">
    <!-- Hero + plans -->
    <section class="container-x animate-fade-up" aria-labelledby="pricing-title">
      <SectionLabel variant="badge">
        <template #icon><ShieldCheck class="h-4 w-4" aria-hidden="true" /></template>
        {{ pricingIntro.eyebrow }}
      </SectionLabel>
      <h1 id="pricing-title" :class="[ui.h1, 'mt-6']">요금부담 없이,<br />필요한 기능만 담았습니다.</h1>
      <p :class="[ui.lead, 'mt-6 max-w-3xl whitespace-pre-line']">{{ pricingIntro.pageDesc }}</p>

      <div class="mt-12">
        <PlanCards cta-to="/consultation" />
      </div>
    </section>

    <PricingCalculator />

    <!-- 문의 항목 -->
    <section class="container-x mt-16 sm:mt-20" aria-labelledby="pricing-expansions-title">
      <p class="eyebrow">{{ expansionsIntro.pricingEyebrow }}</p>
      <h2 id="pricing-expansions-title" :class="[ui.h2, 'mt-3']">{{ expansionsIntro.pricingTitle }}</h2>
      <p :class="[ui.lead, 'mt-4 max-w-3xl']">{{ expansionsIntro.pricingDesc }}</p>
      <div class="mt-10">
        <ExpansionGrid />
      </div>
    </section>

    <OutboundPricingCard />

    <!-- FAQ -->
    <section class="container-x mt-16 grid gap-8 sm:mt-20 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="pricing-faq-title">
      <div>
        <p class="eyebrow">FAQ</p>
        <h2 id="pricing-faq-title" :class="[ui.h2, 'mt-3']">가격 전에 확인할 것.</h2>
        <p :class="[ui.body, 'mt-4']">요금·세팅·초과 사용에 대해 가장 많이 묻는 질문을 모았습니다.</p>
        <RouterLink to="/faq" :class="[ui.linkEmerald, 'mt-6']">
          전체 FAQ 보기
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
      </div>
      <FaqAccordion :items="pricingFaqs" id-prefix="pricing-faq" :default-open="null" />
    </section>
  </div>
</template>
