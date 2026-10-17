<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

defineProps<{ placeholder: string; count: number }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div>
    <label for="faq-search" class="sr-only">FAQ 검색</label>
    <div class="relative">
      <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden="true" />
      <input
        id="faq-search"
        v-model="model"
        type="search"
        :placeholder="placeholder"
        autocomplete="off"
        class="w-full rounded-2xl border border-stone-200 bg-white px-12 py-4 text-stone-900 shadow-sm transition-all placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 [&::-webkit-search-cancel-button]:appearance-none"
      />
      <button
        v-if="model"
        type="button"
        class="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
        aria-label="검색어 지우기"
        @click="model = ''"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
    <p class="mt-3 text-sm text-stone-500" aria-live="polite">
      <template v-if="model">"{{ model }}" 검색 결과 </template>{{ count }}개 질문
    </p>
  </div>
</template>
