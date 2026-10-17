<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { AlertCircle, CreditCard, SearchX, Sparkles, Zap } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import FaqSearch from '@/components/faq/FaqSearch.vue'
import FaqCategorySection from '@/components/faq/FaqCategorySection.vue'
import { faqCategories, faqPageIntro } from '@/data/faqs'
import { ui } from '@/lib/ui'

const icons: Record<string, Component> = {
  service: Zap,
  quality: Sparkles,
  pricing: CreditCard,
  notice: AlertCircle,
}

const query = ref('')
const normalized = computed(() => query.value.trim().toLowerCase())

const filtered = computed(() => {
  const q = normalized.value
  return faqCategories
    .map((cat) => ({
      ...cat,
      items: q ? cat.items.filter((it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)) : cat.items,
    }))
    .filter((cat) => cat.items.length > 0)
})

const total = computed(() => filtered.value.reduce((n, cat) => n + cat.items.length, 0))

function reset() {
  query.value = ''
}
</script>

<template>
  <div class="pb-24 pt-32">
    <section class="container-narrow animate-fade-up text-center" aria-labelledby="faq-title">
      <p class="eyebrow">{{ faqPageIntro.eyebrow }}</p>
      <h1 id="faq-title" :class="[ui.h1Light, 'mx-auto mt-4 max-w-4xl']">{{ faqPageIntro.title }}</h1>
      <p :class="[ui.lead, 'mx-auto mt-6 max-w-2xl']">{{ faqPageIntro.desc }}</p>

      <div class="mx-auto mt-12 max-w-2xl text-left">
        <FaqSearch v-model="query" :placeholder="faqPageIntro.searchPlaceholder" :count="total" />
      </div>
    </section>

    <div class="container-narrow mt-16 space-y-16">
      <FaqCategorySection
        v-for="(cat, i) in filtered"
        :id="cat.id"
        :key="cat.id"
        :title="cat.title"
        :icon="icons[cat.id] ?? Zap"
        :items="cat.items"
        :default-open="i === 0 ? 0 : null"
      />

      <div v-if="total === 0" class="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <SearchX class="h-6 w-6" aria-hidden="true" />
        </span>
        <p class="mt-4 text-lg font-semibold text-stone-950">검색 결과가 없습니다</p>
        <p class="mt-2 text-sm text-stone-600">다른 검색어로 다시 시도하거나 전체 질문을 확인해 보세요.</p>
        <BaseButton variant="secondary" class="mt-6" @click="reset">검색 초기화</BaseButton>
      </div>
    </div>

    <section class="container-narrow mt-20" aria-labelledby="faq-cta-title">
      <div class="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <h3 id="faq-cta-title" :class="[ui.h2, 'mx-auto max-w-3xl']">{{ faqPageIntro.ctaTitle }}</h3>
        <p :class="[ui.body, 'mx-auto mt-4 max-w-2xl']">{{ faqPageIntro.ctaDesc }}</p>
        <div class="mt-8 flex justify-center">
          <BaseButton to="/#demo-section">{{ faqPageIntro.ctaLabel }}</BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>
