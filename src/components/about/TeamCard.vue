<script setup lang="ts">
import { aboutTeam } from '@/data/about'
import { ui } from '@/lib/ui'

const member = aboutTeam.member
</script>

<template>
  <article class="grid gap-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-[0.35fr_0.65fr]">
    <div class="flex flex-col items-start gap-5">
      <span
        class="flex h-28 w-28 items-center justify-center rounded-full bg-stone-950 font-mono text-3xl font-medium tracking-widest text-white ring-4 ring-stone-100"
        aria-hidden="true"
      >{{ member.initials }}</span>
      <div>
        <h3 :class="ui.h3">{{ member.name }}</h3>
        <p class="mt-1 text-sm font-medium text-stone-800">{{ member.role }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ member.company }}</p>
      </div>
      <ul class="flex flex-wrap gap-2" aria-label="전문 분야">
        <li v-for="tag in member.tags" :key="tag" :class="ui.chipEmerald">{{ tag }}</li>
      </ul>
    </div>

    <div>
      <p class="text-sm font-medium text-stone-950">{{ member.summary }}</p>
      <div class="mt-5 space-y-4">
        <p v-for="(para, i) in member.bio" :key="i" class="text-base leading-relaxed text-stone-600">{{ para }}</p>
      </div>
    </div>
  </article>
</template>
