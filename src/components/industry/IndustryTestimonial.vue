<script setup lang="ts">
import { ArrowRight, Star } from 'lucide-vue-next'
import type { IndustryTestimonial } from '@/data/industries'

defineProps<{ testimonial: IndustryTestimonial }>()
</script>

<template>
  <figure class="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm lg:p-12">
    <div class="mb-6 flex justify-center gap-1" aria-label="별점 5점 만점에 5점">
      <Star v-for="i in 5" :key="i" class="h-5 w-5 fill-stone-600 text-stone-600" aria-hidden="true" />
    </div>
    <blockquote class="text-center text-xl font-light leading-relaxed text-stone-950 lg:text-2xl">“ {{ testimonial.quote }} ”</blockquote>
    <figcaption class="mt-6 text-center">
      <p class="font-medium text-stone-900">{{ testimonial.who }}</p>
      <p class="text-sm text-stone-500">{{ testimonial.sub }}</p>
    </figcaption>

    <dl class="mt-8 grid gap-4 border-t border-stone-200 pt-8 sm:grid-cols-3">
      <div v-for="m in testimonial.metrics" :key="m.label" class="text-center">
        <dt class="mb-1 text-xs text-stone-400">{{ m.label }}</dt>
        <dd class="flex items-center justify-center gap-2 text-sm">
          <span class="text-stone-400 line-through">{{ m.before }}</span>
          <ArrowRight class="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
          <span class="font-semibold text-stone-950">{{ m.after }}</span>
        </dd>
      </div>
    </dl>

    <div class="mt-8 text-center">
      <span class="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">{{ testimonial.tag }}</span>
    </div>
  </figure>
</template>
