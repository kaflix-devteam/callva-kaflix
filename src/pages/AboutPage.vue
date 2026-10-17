<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AboutStats from '@/components/about/AboutStats.vue'
import OpsConsole from '@/components/about/OpsConsole.vue'
import ProofCards from '@/components/about/ProofCards.vue'
import TeamCard from '@/components/about/TeamCard.vue'
import { aboutCta, aboutHero, aboutLoop, aboutTeam, aboutTech } from '@/data/about'
import { ui } from '@/lib/ui'
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="container-x animate-fade-up pb-20 pt-28 lg:pb-28" aria-labelledby="about-title">
      <div class="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <SectionLabel variant="dot">{{ aboutHero.eyebrow }}</SectionLabel>
          <h1 id="about-title" :class="[ui.h1Light, 'mt-6 whitespace-pre-line']">{{ aboutHero.title }}</h1>
          <p :class="[ui.lead, 'mt-6 max-w-2xl']">{{ aboutHero.desc }}</p>
          <div class="mt-10">
            <AboutStats />
          </div>
        </div>
        <div class="lg:pt-10">
          <OpsConsole />
        </div>
      </div>
    </section>

    <!-- Tech / proof -->
    <section class="border-y border-stone-200 bg-white py-20 lg:py-28" aria-labelledby="about-tech-title">
      <div class="container-x">
        <p class="eyebrow">{{ aboutTech.eyebrow }}</p>
        <h2 id="about-tech-title" :class="[ui.h2, 'mt-3']">{{ aboutTech.title }}</h2>
        <p :class="[ui.lead, 'mt-4 max-w-3xl']">{{ aboutTech.desc }}</p>
        <div class="mt-12">
          <ProofCards />
        </div>
      </div>
    </section>

    <!-- Closed loop (dark) -->
    <section class="bg-stone-950 py-20 text-white lg:py-28" aria-labelledby="about-loop-title">
      <div class="container-x grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionLabel dark>{{ aboutLoop.eyebrow }}</SectionLabel>
          <h2 id="about-loop-title" class="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{{ aboutLoop.title }}</h2>
          <p class="mt-6 text-lg leading-relaxed text-stone-300">{{ aboutLoop.desc }}</p>
        </div>
        <div :class="ui.cardDark">
          <p class="text-sm font-semibold text-white">{{ aboutLoop.cardTitle }}</p>
          <ul class="mt-4 divide-y divide-white/10">
            <li v-for="b in aboutLoop.bullets" :key="b" class="flex items-start gap-3 py-4 first:pt-2 last:pb-0">
              <Check class="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <span class="text-sm leading-6 text-stone-200">{{ b }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section class="py-20 lg:py-28" aria-labelledby="about-team-title">
      <div class="container-x">
        <p class="eyebrow">{{ aboutTeam.eyebrow }}</p>
        <h2 id="about-team-title" :class="[ui.h2, 'mt-3']">{{ aboutTeam.title }}</h2>
        <div class="mt-10">
          <TeamCard />
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t border-stone-200 bg-white px-6 py-20" aria-labelledby="about-cta-title">
      <div class="container-narrow text-center">
        <h2 id="about-cta-title" :class="ui.h2">{{ aboutCta.title }}</h2>
        <p :class="[ui.lead, 'mx-auto mt-4 max-w-2xl']">{{ aboutCta.desc }}</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <BaseButton :to="aboutCta.demo.to">{{ aboutCta.demo.label }}</BaseButton>
          <BaseButton :to="aboutCta.dashboard.to" variant="secondary">{{ aboutCta.dashboard.label }}</BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>
