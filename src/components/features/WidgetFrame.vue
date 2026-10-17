<script setup lang="ts">
/** Dashboard-card shell shared by the mock widgets: icon + title/sub header, optional right-side slot, body. */
defineProps<{ title: string; sub?: string }>()
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div class="flex flex-col gap-4 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div class="flex items-center gap-3">
        <span
          v-if="$slots.icon"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700"
          aria-hidden="true"
        >
          <slot name="icon" />
        </span>
        <div>
          <h3 class="text-base font-semibold text-stone-950">{{ title }}</h3>
          <p v-if="sub" class="text-sm text-stone-500">{{ sub }}</p>
        </div>
      </div>
      <div v-if="$slots.aside" class="flex items-center gap-5">
        <slot name="aside" />
      </div>
    </div>
    <slot />
  </div>
</template>
