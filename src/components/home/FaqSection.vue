<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import FaqAccordion from '@/components/ui/FaqAccordion.vue'
import { homeFaqs } from '@/data/faqs'
import { ui } from '@/lib/ui'
import { homeUi } from './homeUi'
</script>

<template>
  <section class="px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <div class="lg:sticky lg:top-28 lg:self-start">
        <p :class="homeUi.eyebrow">FAQ</p>
        <h2 :class="homeUi.displayH2">구매 전 많이 묻는 질문.</h2>
        <RouterLink to="/faq" :class="[ui.linkEmerald, 'mt-6']">
          전체 FAQ 보기
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
      </div>
      <FaqAccordion :items="homeFaqs" id-prefix="home-faq" class="min-w-0" />
    </div>
  </section>
</template>
