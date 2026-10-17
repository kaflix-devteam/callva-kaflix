<script setup lang="ts">
import { computed, watch } from 'vue'
import FaqAccordion from '@/components/ui/FaqAccordion.vue'
import IndustryHero from '@/components/industry/IndustryHero.vue'
import IndustrySection from '@/components/industry/IndustrySection.vue'
import IndustryProblems from '@/components/industry/IndustryProblems.vue'
import IndustryEffects from '@/components/industry/IndustryEffects.vue'
import IndustryFeatures from '@/components/industry/IndustryFeatures.vue'
import IndustryTestimonial from '@/components/industry/IndustryTestimonial.vue'
import IndustryCost from '@/components/industry/IndustryCost.vue'
import IndustryOthers from '@/components/industry/IndustryOthers.vue'
import IndustryClosing from '@/components/industry/IndustryClosing.vue'
import IndustryMissing from '@/components/industry/IndustryMissing.vue'
import { industryLinks, industryPages } from '@/data/industries'
import { site } from '@/data/site'

const props = defineProps<{ slug: string }>()

// Derived from the prop every time so /for/cafe → /for/restaurant re-renders in place.
const page = computed(() => industryPages[props.slug])
const emoji = computed(() => industryLinks.find((l) => l.slug === props.slug)?.emoji)

// The router sets a generic title; refine it with the industry name after render.
watch(
  page,
  (p) => {
    if (p) document.title = `${p.name} 전화 응대 | ${site.name}`
  },
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <template v-if="page">
    <IndustryHero :page="page" :emoji="emoji" />

    <IndustrySection eyebrow="문제" :title="page.problemsTitle" tone="stone">
      <IndustryProblems :problems="page.problems" />
    </IndustrySection>

    <IndustrySection eyebrow="효과" title="AI 도입하면 이렇게 바뀝니다" tone="white">
      <IndustryEffects :effects="page.effects" />
    </IndustrySection>

    <IndustrySection eyebrow="기능" :title="page.featuresTitle" tone="stone">
      <IndustryFeatures :features="page.features" />
    </IndustrySection>

    <IndustrySection tone="white">
      <IndustryTestimonial :testimonial="page.testimonial" />
    </IndustrySection>

    <IndustrySection eyebrow="FAQ" :title="page.faqTitle" tone="stone">
      <div class="mx-auto max-w-3xl">
        <FaqAccordion :items="page.faqs" :id-prefix="`faq-${page.slug}`" />
      </div>
    </IndustrySection>

    <IndustrySection eyebrow="가격" title="비용 비교" tone="white" wide>
      <IndustryCost :options="page.costOptions" />
    </IndustrySection>

    <IndustrySection title="다른 업종도 확인해보세요" tone="stone">
      <IndustryOthers :exclude="page.slug" />
    </IndustrySection>

    <IndustrySection tone="white">
      <IndustryClosing :page="page" />
    </IndustrySection>
  </template>

  <IndustryMissing v-else :slug="slug" />
</template>
