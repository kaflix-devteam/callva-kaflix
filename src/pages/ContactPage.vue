<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
import ContactForm from '@/components/ui/ContactForm.vue'
import ContactInfo from '@/components/contact/ContactInfo.vue'
import { site } from '@/data/site'
import { ui } from '@/lib/ui'

const reassurances = [
  '영업시간 기준 2시간 이내 회신',
  '약정 없음 · 언제든 해지',
  '셀프 세팅 0원',
]
</script>

<template>
  <section class="container-x pt-32">
    <div class="animate-fade-up text-center">
      <h1 :class="ui.h1Light">도입 문의 및 상담</h1>
      <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
        {{ site.name }}와 함께 매장 운영의 디지털 전환을 시작하세요.<br class="hidden sm:inline" />
        전문 컨설턴트가 최적의 솔루션을 제안해 드립니다.
      </p>
    </div>
  </section>

  <section class="container-x pb-24 pt-16">
    <div class="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <ContactInfo />

      <div class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
        <h2 class="text-2xl font-semibold tracking-tight text-stone-950">상담 신청서</h2>
        <div class="mt-8">
          <ContactForm source="contact" />
        </div>
      </div>
    </div>

    <div class="mt-16 rounded-2xl border border-stone-200 bg-white px-6 py-6 shadow-sm">
      <ul class="grid gap-4 sm:grid-cols-3">
        <li v-for="item in reassurances" :key="item" class="flex items-center gap-3 text-sm font-medium text-stone-700">
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
          </span>
          {{ item }}
        </li>
      </ul>
    </div>

    <p class="mt-8 text-center">
      <RouterLink to="/consultation" :class="ui.linkEmerald">먼저 무료 진단으로 예상 절감액 확인하기 →</RouterLink>
    </p>
  </section>
</template>
