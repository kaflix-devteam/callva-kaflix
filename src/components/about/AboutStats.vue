<script setup lang="ts">
import type { Component } from 'vue'
import { Activity, Briefcase, Network, Phone } from 'lucide-vue-next'
import { aboutStats, type AboutStat } from '@/data/about'

const icons: Record<AboutStat['icon'], Component> = {
  phone: Phone,
  briefcase: Briefcase,
  network: Network,
  activity: Activity,
}
</script>

<template>
  <dl class="grid gap-4 sm:grid-cols-2">
    <div v-for="stat in aboutStats" :key="stat.index" class="relative rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <span class="absolute right-4 top-4 font-mono text-[10px] text-stone-400">{{ stat.index }}</span>
      <component :is="icons[stat.icon]" class="h-4 w-4 text-stone-500" aria-hidden="true" />
      <dd class="mt-4 font-mono text-2xl font-medium tracking-tight text-stone-950 md:text-[28px]">{{ stat.value }}</dd>
      <dt class="mt-1 text-sm font-semibold text-stone-800">{{ stat.label }}</dt>
      <p class="mt-2 text-xs leading-relaxed text-stone-500">{{ stat.sub }}</p>
    </div>
  </dl>
</template>
