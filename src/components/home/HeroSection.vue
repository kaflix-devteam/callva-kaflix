<script setup lang="ts">
import { PhoneCall, Sparkles, Wrench } from 'lucide-vue-next'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import DemoLabGrid from './DemoLabGrid.vue'
import { site } from '@/data/site'
import { homeUi } from './homeUi'

const stats = [
  { icon: PhoneCall, text: `실제 누적통화 ${site.stats.totalCalls}` },
  { icon: Wrench, text: '세팅·튜닝까지 콜바팀 대행' },
]
</script>

<template>
  <section
    id="demo-section"
    class="scroll-mt-24 bg-stone-50 px-4 pb-28 pt-32 sm:px-6 sm:pb-32 sm:pt-36 lg:px-8 lg:pb-40 lg:pt-40"
  >
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-14 sm:gap-16 lg:grid-cols-[0.74fr_1.26fr] lg:items-end lg:gap-24">
      <div class="max-w-2xl animate-fade-up">
        <SectionLabel variant="badge" class="mb-6">
          <template #icon><Sparkles class="h-4 w-4" aria-hidden="true" /></template>
          기업 전화 업무 자동화 · 세팅 대행 포함
        </SectionLabel>

        <h1 :class="homeUi.displayH1">전화로 시작된 일,<br />AI가 끝냅니다</h1>

        <p class="mt-7 hidden max-w-xl text-lg leading-8 text-stone-600 sm:block sm:text-xl">
          받기만 하는 AI가 아닙니다. 문의에 답하고, 예약을 확정하고, 연락이 끊긴 고객에게는 먼저 걸어 다시 약속을 잡습니다. 세팅은 콜바팀이 대행합니다.
        </p>

        <div class="mt-9 hidden flex-wrap gap-3 text-sm font-medium text-stone-700 sm:flex">
          <span
            v-for="stat in stats"
            :key="stat.text"
            class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-stone-200"
          >
            <component :is="stat.icon" class="h-4 w-4 text-emerald-700" aria-hidden="true" />
            {{ stat.text }}
          </span>
        </div>
      </div>

      <DemoLabGrid class="min-w-0 animate-fade-up" />
    </div>
  </section>
</template>
