<script setup lang="ts">
import { aboutConsole } from '@/data/about'

/** Decorative progress widths for the 4 steps (visual only). */
const widths = ['w-12', 'w-11', 'w-10', 'w-9']
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 p-6 text-white shadow-2xl shadow-stone-900/30 sm:p-8">
    <div
      class="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]"
      aria-hidden="true"
    />

    <div class="relative flex flex-col items-start gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.22em] text-stone-400">{{ aboutConsole.eyebrow }}</p>
        <p class="mt-1 text-sm font-medium text-white">{{ aboutConsole.title }}</p>
      </div>
      <span class="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" aria-hidden="true" />
        {{ aboutConsole.status }}
      </span>
    </div>

    <div class="relative mx-auto my-10 flex h-56 w-56 items-center justify-center">
      <svg class="absolute inset-0 h-full w-full text-emerald-400/70" viewBox="0 0 224 224" aria-hidden="true">
        <rect x="32" y="32" width="160" height="160" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4 5" transform="rotate(28 112 112)" />
      </svg>
      <div class="relative z-10 flex h-40 w-40 flex-col items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-center">
        <p class="font-mono text-3xl font-medium tracking-tight text-white sm:text-4xl">{{ aboutConsole.value }}</p>
        <p class="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400">{{ aboutConsole.valueLabel }}</p>
      </div>
    </div>

    <ol class="relative space-y-3">
      <li
        v-for="(step, i) in aboutConsole.steps"
        :key="step"
        class="grid grid-cols-[24px_1fr_52px] items-center gap-3 border-t border-white/10 pt-3"
      >
        <span class="flex h-6 w-6 items-center justify-center rounded border border-white/15 bg-white/5 font-mono text-[10px] text-stone-300">{{ i + 1 }}</span>
        <span class="text-sm text-stone-100">{{ step }}</span>
        <span class="flex justify-end">
          <span class="h-1 rounded-full bg-emerald-400" :class="widths[i] ?? 'w-8'" aria-hidden="true" />
        </span>
      </li>
    </ol>
  </div>
</template>
