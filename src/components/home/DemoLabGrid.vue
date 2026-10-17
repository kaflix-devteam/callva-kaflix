<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { PhoneCall } from 'lucide-vue-next'
import { demoLabIntro, demoScenarios, type DemoScenario } from '@/data/demoScenarios'
import { ui } from '@/lib/ui'
import DemoLabModal from './DemoLabModal.vue'

const active = ref<DemoScenario | null>(null)
let lastTrigger: HTMLElement | null = null

function open(scenario: DemoScenario, event: MouseEvent) {
  lastTrigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  active.value = scenario
}

async function close() {
  active.value = null
  await nextTick()
  lastTrigger?.focus()
  lastTrigger = null
}
</script>

<template>
  <div class="space-y-5">
    <div class="max-w-xl">
      <p class="text-xl font-semibold leading-tight text-stone-950 sm:text-2xl">{{ demoLabIntro.title }}</p>
      <p class="mt-2 text-sm leading-6 text-stone-600 sm:text-base">{{ demoLabIntro.desc }}</p>
    </div>

    <div class="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-3">
      <button
        v-for="scenario in demoScenarios"
        :key="scenario.id"
        type="button"
        aria-haspopup="dialog"
        :aria-label="`${scenario.title} 데모 열기`"
        class="group flex min-h-[172px] min-w-0 flex-col rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 focus:ring-offset-stone-50 sm:min-h-[220px] sm:p-6"
        @click="open(scenario, $event)"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="flex flex-wrap items-center gap-1.5">
            <span :class="ui.chip">{{ scenario.industry }}</span>
            <span v-if="scenario.outbound" :class="ui.chipAmber">아웃바운드</span>
          </div>
          <span :class="[ui.iconCircleEmerald, 'transition-colors group-hover:bg-emerald-600 group-hover:text-white']">
            <PhoneCall class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <h2 class="text-sm font-semibold leading-snug text-stone-950 sm:text-lg">{{ scenario.title }}</h2>
        <p class="mt-2 line-clamp-2 text-xs leading-5 text-stone-600 sm:text-sm sm:leading-6">{{ scenario.desc }}</p>
        <span class="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-semibold text-emerald-700 transition-colors group-hover:text-emerald-800 sm:text-sm">
          <PhoneCall class="h-3.5 w-3.5" aria-hidden="true" />
          {{ demoLabIntro.openLabel }}
        </span>
      </button>
    </div>

    <DemoLabModal :scenario="active" @close="close" />
  </div>
</template>
