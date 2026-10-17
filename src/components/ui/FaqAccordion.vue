<script setup lang="ts">
import { ref, watch } from 'vue'
import AccordionItem from './AccordionItem.vue'
import type { FaqItem } from '@/data/faqs'

const props = withDefaults(defineProps<{ items: FaqItem[]; defaultOpen?: number | null; idPrefix?: string }>(), {
  defaultOpen: 0,
  idPrefix: 'faq',
})

const openIndex = ref<number | null>(props.defaultOpen)
watch(() => props.items, () => { openIndex.value = props.defaultOpen })

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}
</script>

<template>
  <div class="space-y-3">
    <AccordionItem
      v-for="(item, i) in items"
      :id="`${idPrefix}-${i}`"
      :key="item.q"
      :question="item.q"
      :answer="item.a"
      :open="openIndex === i"
      @toggle="toggle(i)"
    />
  </div>
</template>
