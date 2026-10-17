<script setup lang="ts">
import { site } from '@/data/site'
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
</script>

<template>
  <span
    class="inline-flex select-none items-baseline font-extrabold italic tracking-tight text-stone-950"
    :class="{ 'text-xl': size === 'sm', 'text-[26px]': size === 'md', 'text-4xl': size === 'lg' }"
    :aria-label="site.name"
  >
    {{ site.logoText }}<span class="ml-0.5 text-[0.55em] font-bold not-italic">{{ site.logoSuffix }}</span>
  </span>
</template>
