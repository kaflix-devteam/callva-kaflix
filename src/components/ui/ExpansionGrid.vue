<script setup lang="ts">
import { expansions } from '@/data/expansions'
</script>

<template>
  <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    <article v-for="item in expansions" :key="item.title" class="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
      <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-800 ring-1 ring-stone-200">
        <component :is="item.icon" class="h-5 w-5" />
      </span>
      <h3 class="mt-4 text-base font-semibold text-stone-950">{{ item.title }}</h3>
      <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">{{ item.desc }}</p>
    </article>
  </div>
</template>
