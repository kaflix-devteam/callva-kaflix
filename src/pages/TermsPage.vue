<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { formatLegalDate, legalNotice, termsDoc as doc } from '@/data/legal'
</script>

<template>
  <section class="container-narrow pb-24 pt-32">
    <article class="mx-auto max-w-3xl">
      <p class="eyebrow">{{ doc.eyebrow }}</p>
      <h1 class="mt-4 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">{{ doc.title }}</h1>
      <p class="mt-4 text-sm text-stone-500">최종 수정일 {{ formatLegalDate(doc.updatedAt) }}</p>

      <div class="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900" role="note">
        <Info class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p>{{ legalNotice }}</p>
      </div>

      <p class="mt-10 leading-relaxed text-stone-600">{{ doc.intro }}</p>

      <ol class="mt-12 space-y-10">
        <li v-for="section in doc.sections" :key="section.heading">
          <h2 class="text-xl font-semibold tracking-tight text-stone-950">{{ section.heading }}</h2>
          <p v-for="(para, i) in section.body" :key="i" class="mt-3 leading-relaxed text-stone-600">{{ para }}</p>
        </li>
      </ol>

      <footer class="mt-14 border-t border-stone-200 pt-6 text-sm text-stone-500">
        <p>본 문서에 대한 문의: <a :href="`mailto:${doc.contactEmail}`" class="font-medium text-stone-700 hover:text-emerald-700">{{ doc.contactEmail }}</a></p>
        <p class="mt-2">
          <RouterLink v-if="doc.slug === 'terms'" to="/privacy" class="hover:text-stone-900">개인정보처리방침 보기 →</RouterLink>
          <RouterLink v-else to="/terms" class="hover:text-stone-900">이용약관 보기 →</RouterLink>
        </p>
      </footer>
    </article>
  </section>
</template>
