<script setup lang="ts">
import type { Component } from 'vue'
import { AudioLines, Headphones, MessageCircle, Sparkles } from 'lucide-vue-next'
import { ui } from '@/lib/ui'
import { homeUi } from './homeUi'

interface ProofCard {
  num: string
  tone: 'light' | 'dark'
  eyebrow: string
  headline: string
  chips: string[]
  title: string
  desc: string
  icon: Component
}

/* Kept in script: Vue condenses template whitespace, which would drop the line breaks. */
const intro =
  '콜바는 ARS가 아닙니다. CS팀을 대체하는 솔루션입니다.\n고객의 감정을 이해하고, 필요한 정보를 유연하고 일관성있게 답하며,\n담당자에게 넘기지 않고 통화 안에서 예약과 상담까지 끝냅니다.'

const cards: ProofCard[] = [
  {
    num: '01',
    tone: 'light',
    eyebrow: 'AI인걸 모를 정도입니다',
    headline: '3%',
    chips: ['실제 누적통화 60,000건+', '사람처럼 자연스러운', '외국어, 사투리 까지'],
    title: 'AI인 걸 알아차린 사람 3%',
    desc: '콜바가 걸었던 실제 누적통화 60,000건+의 통화 중\nAI임을 알아차린 사람은 3%에 불과했습니다.',
    icon: AudioLines,
  },
  {
    num: '02',
    tone: 'dark',
    eyebrow: '돈 벌어오는 AI',
    headline: '영업까지',
    chips: ['단순 정보성 응대', '지치지않는 일관성', '우리 회사 기준대로'],
    title: '복잡한 응대는 물론, 영업까지',
    desc: '가격, 일정, 조건 비교 같은 정보 제공은 물론\n상담 및 예약 전환까지 일관성 있고 목표지향적으로 응대합니다.',
    icon: MessageCircle,
  },
  {
    num: '03',
    tone: 'light',
    eyebrow: '압도적인 효율성',
    headline: '500콜+',
    chips: ['3초만에 수신', '매일 자동으로 성장', '압도적 병렬 통화'],
    title: '똑똑한데 빠릅니다',
    desc: '이전 통화를 매일 자동 평가해 매뉴얼을 개선하고,\n받는 전화는 3초 안에 응답하며 시간당 500콜 이상 병렬 처리합니다.',
    icon: Sparkles,
  },
  {
    num: '04',
    tone: 'dark',
    eyebrow: '넘기지 않는 응대',
    headline: '끝까지',
    chips: ['예약까지 확정', '끊김 없는 인계', '주제별 설정'],
    title: '사람에게 넘기지 않고 끝냅니다',
    desc: '문의 응대, 일정 확인, 예약 확정까지 통화 안에서 마칩니다.\n사람이 판단해야 할 주제만 정해두면, 전화를 끊지 않고 담당자에게 넘깁니다.',
    icon: Headphones,
  },
]
</script>

<template>
  <section class="relative overflow-hidden border-y border-stone-200 bg-stone-950 px-4 py-36 text-white sm:px-6 sm:py-40 lg:px-8 lg:py-52">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.20),transparent_32%),radial-gradient(circle_at_84%_26%,rgba(245,158,11,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_18%,transparent_82%,rgba(255,255,255,0.05))]"
      aria-hidden="true"
    />
    <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" aria-hidden="true" />

    <div class="relative mx-auto max-w-7xl">
      <div class="mb-28 grid grid-cols-1 gap-14 lg:mb-36 lg:grid-cols-[0.82fr_1.18fr] lg:items-end lg:gap-24">
        <div class="max-w-xl">
          <p class="mb-6 text-sm font-semibold text-emerald-300">실전 통화 증거</p>
          <h2 class="text-5xl font-light leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            전화가 매출로<br /><span class="text-stone-500">이어지는 순간들</span>
          </h2>
        </div>
        <div class="max-w-2xl lg:justify-self-end">
          <p class="whitespace-pre-line text-lg leading-9 text-stone-300 sm:text-xl">{{ intro }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        <article
          v-for="card in cards"
          :key="card.num"
          class="group relative min-h-[480px] overflow-hidden rounded-2xl border p-7 transition-colors duration-300 sm:min-h-[520px] sm:p-9 lg:min-h-[580px] lg:p-10"
          :class="card.tone === 'light'
            ? 'border-emerald-200/40 bg-white text-stone-950 shadow-2xl shadow-emerald-950/40'
            : 'border-white/10 bg-white/[0.075] text-white shadow-2xl shadow-black/30'"
        >
          <div
            class="absolute inset-x-8 top-8 h-px transition-opacity duration-500 group-hover:opacity-100"
            :class="card.tone === 'light' ? 'bg-emerald-300/60 opacity-70' : 'bg-white/20 opacity-50'"
            aria-hidden="true"
          />
          <div
            class="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-125"
            :class="card.tone === 'light' ? 'bg-emerald-100/80' : 'bg-amber-300/20'"
            aria-hidden="true"
          />
          <div
            class="absolute bottom-8 right-8 text-[9rem] font-light leading-none opacity-[0.06] sm:text-[12rem]"
            :class="card.tone === 'light' ? 'text-stone-950' : 'text-white'"
            aria-hidden="true"
          >
            {{ card.num }}
          </div>

          <div class="relative flex min-h-[420px] flex-col justify-between sm:min-h-[452px] lg:min-h-[500px]">
            <div class="flex items-start justify-between gap-4 sm:gap-6">
              <div>
                <p class="text-sm font-semibold" :class="card.tone === 'light' ? 'text-emerald-700' : 'text-emerald-300'">
                  {{ card.eyebrow }}
                </p>
                <div class="mt-8">
                  <span
                    class="whitespace-nowrap font-light leading-none"
                    :class="card.tone === 'light' ? 'text-6xl text-stone-950 sm:text-8xl' : 'text-5xl text-white sm:text-7xl'"
                  >
                    {{ card.headline }}
                  </span>
                </div>
              </div>
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14"
                :class="card.tone === 'light' ? 'bg-stone-950 text-white' : 'bg-white text-stone-950'"
                aria-hidden="true"
              >
                <component :is="card.icon" class="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
            </div>

            <div class="relative pt-20">
              <div class="mb-8 flex flex-wrap gap-2.5">
                <span
                  v-for="chip in card.chips"
                  :key="chip"
                  :class="card.tone === 'light' ? homeUi.proofChip : ui.chipOnDark"
                >
                  {{ chip }}
                </span>
              </div>
              <h3 class="text-3xl font-semibold leading-tight sm:text-4xl">{{ card.title }}</h3>
              <p
                class="mt-6 max-w-xl whitespace-pre-line text-base leading-8 sm:text-lg"
                :class="card.tone === 'light' ? 'text-stone-600' : 'text-stone-300'"
              >
                {{ card.desc }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
