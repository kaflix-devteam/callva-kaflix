<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

defineProps<{ question: string; answer: string; open: boolean; id: string }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <div
    class="rounded-2xl border bg-white px-6 py-5 transition-all"
    :class="open ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-stone-200 hover:border-stone-300'"
  >
    <h3>
      <button
        type="button"
        class="flex w-full items-center justify-between gap-4 text-left"
        :aria-expanded="open"
        :aria-controls="`${id}-panel`"
        @click="emit('toggle')"
      >
        <span class="text-base font-semibold text-stone-950 sm:text-lg">{{ question }}</span>
        <span
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
          :class="open ? 'bg-stone-950 text-white' : 'bg-stone-100 text-stone-600'"
        >
          <ChevronUp v-if="open" class="h-4 w-4" />
          <ChevronDown v-else class="h-4 w-4" />
        </span>
      </button>
    </h3>
    <div v-show="open" :id="`${id}-panel`" class="mt-4 text-base leading-relaxed text-stone-600">
      {{ answer }}
    </div>
  </div>
</template>
