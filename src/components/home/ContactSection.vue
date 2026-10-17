<script setup lang="ts">
import { Clock, Headset, ShieldCheck } from 'lucide-vue-next'
import ContactForm from '@/components/ui/ContactForm.vue'
import { homeUi } from './homeUi'

const assurances = [
  { icon: Clock, text: '2시간 내 회신' },
  { icon: ShieldCheck, text: '개인정보는 상담 목적으로만 사용' },
  { icon: Headset, text: 'AI 상담 전화 체험 가능' },
]
</script>

<template>
  <section class="border-t border-stone-200 bg-white px-4 py-28 sm:px-6 lg:px-8 lg:py-40">
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.74fr_1.26fr] lg:items-start lg:gap-20">
      <div class="lg:sticky lg:top-28">
        <p :class="homeUi.eyebrow">도입 문의</p>
        <h2 :class="homeUi.displayH2Lg">바로 상담을<br />시작하세요.</h2>
        <p class="mt-8 max-w-xl text-lg leading-8 text-stone-600">
          회사 상황을 남겨주시면 콜바 팀이 통화량, 예약 방식, 담당자 연결 기준까지 확인해 도입 범위를 정리해드립니다.
        </p>
        <p class="mt-8 max-w-md text-sm leading-6 text-stone-500">영업시간 기준 2시간 이내에 연락드립니다.</p>

        <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          <li v-for="item in assurances" :key="item.text" class="inline-flex items-center gap-2 text-sm text-stone-700">
            <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <component :is="item.icon" class="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {{ item.text }}
          </li>
        </ul>
      </div>

      <div class="relative min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-2xl shadow-stone-200/70 sm:p-8 lg:p-10">
        <div class="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-100 blur-3xl" aria-hidden="true" />
        <div class="relative">
          <h3 class="mb-8 text-2xl font-light text-stone-950 sm:text-3xl">문의 남기기</h3>
          <ContactForm source="home" />
        </div>
      </div>
    </div>
  </section>
</template>
