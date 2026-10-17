<script setup lang="ts">
/**
 * Animates a number from 0 to `value` on mount (ease-out, ~1.2s).
 * Honors prefers-reduced-motion by jumping straight to the final value.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ value: number; decimals?: number; duration?: number }>(), {
  decimals: 0,
  duration: 1200,
})

const current = ref(0)
let raf = 0

function format(n: number) {
  return n.toLocaleString('ko-KR', { minimumFractionDigits: props.decimals, maximumFractionDigits: props.decimals })
}

onMounted(() => {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    current.value = props.value
    return
  }
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3)
    current.value = props.value * eased
    if (t < 1) raf = requestAnimationFrame(tick)
    else current.value = props.value
  }
  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <span class="tabular-nums">{{ format(current) }}</span>
</template>
