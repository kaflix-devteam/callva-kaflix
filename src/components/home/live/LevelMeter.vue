<script setup lang="ts">
/** Mic level meter: `bars` segments lit from the left according to `level` (0..1). */
withDefaults(defineProps<{ level: number; active?: boolean; bars?: number }>(), { active: false, bars: 18 })
</script>

<template>
  <span class="inline-flex h-5 items-end gap-[3px]" role="img" :aria-label="`입력 레벨 ${Math.round(level * 100)}%`" data-testid="live-level">
    <span
      v-for="i in bars"
      :key="i"
      class="w-[3px] rounded-full transition-colors duration-75"
      :class="[
        level >= i / bars ? (active ? 'bg-emerald-500' : 'bg-stone-500') : 'bg-stone-200',
      ]"
      :style="{ height: `${Math.round(6 + 14 * Math.sin((i / (bars + 1)) * Math.PI))}px` }"
    />
  </span>
</template>
