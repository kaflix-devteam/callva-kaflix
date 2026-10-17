<script setup lang="ts">
import { Brain, Clock, Rocket, ShieldCheck } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import FeatureSection from '@/components/features/FeatureSection.vue'
import CallLogWidget from '@/components/features/CallLogWidget.vue'
import VipWidget from '@/components/features/VipWidget.vue'
import SpamWidget from '@/components/features/SpamWidget.vue'
import AnswerModeWidget from '@/components/features/AnswerModeWidget.vue'
import LearningWidget from '@/components/features/LearningWidget.vue'
import AnalyticsWidget from '@/components/features/AnalyticsWidget.vue'
import { featureCards } from '@/data/features'
import { site } from '@/data/site'
import { ui } from '@/lib/ui'

const cardIcons = { clock: Clock, shield: ShieldCheck, brain: Brain } as const
</script>

<template>
  <!-- hero -->
  <section class="pb-16 pt-32 lg:pb-20 lg:pt-40">
    <div class="container-narrow text-center">
      <SectionLabel center>Features</SectionLabel>
      <h1 :class="[ui.h1Light, 'mt-6 animate-fade-up']">전화 받는 일,<br />이제 AI에게 맡기세요</h1>
      <p :class="[ui.lead, 'mx-auto mt-6 max-w-2xl']">
        받지 못한 전화 때문에 놓친 기회가 얼마나 되는지 아십니까? Callva는 24시간 응대로 모든 기회를 잡아드립니다.
      </p>
    </div>
  </section>

  <!-- three feature cards -->
  <section class="pb-24 lg:pb-32">
    <div class="container-x">
      <div class="grid gap-6 md:grid-cols-3">
        <article v-for="card in featureCards" :key="card.title" :class="[ui.card, 'p-8']">
          <span :class="ui.iconBox" aria-hidden="true">
            <component :is="cardIcons[card.icon]" class="h-5 w-5" />
          </span>
          <h3 :class="[ui.h3, 'mt-6']">{{ card.title }}</h3>
          <p :class="[ui.body, 'mt-3']">{{ card.desc }}</p>
        </article>
      </div>
    </div>
  </section>

  <FeatureSection
    eyebrow="통화 기록"
    title="모든 통화를 한눈에 분류해서 확인"
    desc="예약, 가격, 위치 문의 등 카테고리별로 자동 분류됩니다. 스팸은 따로 걸러지고, 중요한 건 먼저 보입니다."
    tone="white"
  >
    <CallLogWidget />
  </FeatureSection>

  <FeatureSection
    eyebrow="VIP 관리"
    title="중요한 전화는 바로 연결"
    desc="VIP 고객, 거래처, 가족 등 중요한 전화는 AI를 거치지 않고 바로 대표님께 연결합니다."
    tone="stone"
  >
    <VipWidget />
  </FeatureSection>

  <FeatureSection
    eyebrow="스팸 차단"
    title="스팸 전화를 자동으로 차단"
    desc="귀찮은 영업전화와 광고 전화는 AI가 자동으로 감지하고 차단합니다."
    tone="white"
  >
    <SpamWidget />
  </FeatureSection>

  <FeatureSection
    eyebrow="응대 설정"
    title="상황에 맞게 응대 방식을 선택"
    desc="AI 직접 응대부터 메시지 수집까지. 비즈니스에 맞는 방식을 고르세요."
    tone="stone"
  >
    <AnswerModeWidget />
  </FeatureSection>

  <FeatureSection
    eyebrow="체계적 학습"
    title="이 정도로 꼼꼼하게 학습합니다"
    desc="메뉴, 가격, 정책, 예약 규칙. 카테고리별로 체계적으로 학습하고, 진행 상황을 투명하게 보여드립니다."
    tone="white"
  >
    <LearningWidget />
  </FeatureSection>

  <FeatureSection
    eyebrow="분석 & 인사이트"
    title="풍부한 데이터로 비즈니스를 파악"
    desc="통화량 추이, 고객 유형, 피크 시간대. 데이터 기반으로 더 나은 의사결정을 내리세요."
    tone="stone"
  >
    <AnalyticsWidget />
  </FeatureSection>

  <!-- final CTA -->
  <section class="py-24 lg:py-32">
    <div class="container-narrow">
      <div class="mx-auto max-w-4xl rounded-3xl border border-stone-200 bg-stone-100 px-6 py-14 text-center sm:px-16 sm:py-16">
        <span class="mx-auto mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-200 text-stone-800" aria-hidden="true">
          <Rocket class="h-7 w-7" />
        </span>
        <h2 :class="ui.h2">지금 바로 시작하세요</h2>
        <p :class="[ui.body, 'mx-auto mt-5 max-w-xl']">설정은 5분이면 끝납니다. 복잡한 건 없습니다.<br />기존 자료만 올리면 AI가 알아서 학습합니다.</p>
        <div class="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <BaseButton :to="site.dashboardUrl" variant="primary">무료로 시작하기</BaseButton>
          <BaseButton to="/#demo-section" variant="secondary">데모 체험하기</BaseButton>
        </div>
        <p class="mt-6 text-xs text-stone-500">약정 없음 · 언제든 해지 가능 · 미사용 기간 일할 환불</p>
      </div>
    </div>
  </section>
</template>
