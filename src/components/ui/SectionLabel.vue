<script setup lang="ts">
/**
 * Eyebrow label above section headings.
 * - text:  small tracked uppercase text (FEATURES / 솔루션 비교 …)
 * - badge: emerald pill (hero "기업 전화 업무 자동화 · 세팅 대행 포함", "요금 안내")
 * - dot:   white box with emerald dot (ABOUT CALLVA)
 */
withDefaults(defineProps<{ variant?: 'text' | 'badge' | 'dot'; dark?: boolean; center?: boolean }>(), {
  variant: 'text',
  dark: false,
  center: false,
})
</script>

<template>
  <div :class="center ? 'flex justify-center' : 'flex'">
    <span
      v-if="variant === 'badge'"
      class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium"
      :class="dark ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800'"
    >
      <slot name="icon" />
      <slot />
    </span>
    <span
      v-else-if="variant === 'dot'"
      class="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em]"
      :class="dark ? 'border-white/15 bg-white/5 text-stone-300' : 'border-stone-200 bg-white text-stone-700'"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      <slot />
    </span>
    <span
      v-else
      class="text-xs font-medium uppercase tracking-[0.2em]"
      :class="dark ? 'text-emerald-400' : 'text-stone-500'"
    >
      <slot />
    </span>
  </div>
</template>
