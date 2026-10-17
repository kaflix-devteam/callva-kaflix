<script setup lang="ts">
import type { Component } from 'vue'
import FaqAccordion from '@/components/ui/FaqAccordion.vue'
import type { FaqItem } from '@/data/faqs'

defineProps<{
  id: string
  title: string
  icon: Component
  items: FaqItem[]
  defaultOpen: number | null
}>()
</script>

<template>
  <section :aria-labelledby="`faq-cat-${id}`">
    <div class="flex items-center gap-4 border-b border-stone-200 pb-5">
      <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <component :is="icon" class="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 :id="`faq-cat-${id}`" class="text-2xl font-semibold tracking-tight text-stone-950">{{ title }}</h2>
      <span class="ml-auto text-sm text-stone-500">{{ items.length }}개</span>
    </div>
    <div class="mt-6">
      <FaqAccordion :items="items" :id-prefix="id" :default-open="defaultOpen" />
    </div>
  </section>
</template>
