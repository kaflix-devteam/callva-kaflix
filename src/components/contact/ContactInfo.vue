<script setup lang="ts">
import { Clock, Mail, MapPin, Phone } from 'lucide-vue-next'
import { site } from '@/data/site'

const telHref = `tel:${site.company.phone.replace(/[^\d+]/g, '')}`
</script>

<template>
  <div>
    <h2 class="flex items-center gap-3 text-2xl font-semibold tracking-tight text-stone-950">
      <span class="h-7 w-1 shrink-0 rounded-full bg-stone-950" aria-hidden="true" />
      연락처 및 위치
    </h2>

    <ul class="mt-8 space-y-8">
      <li class="flex items-start gap-5">
        <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 shadow-sm">
          <Mail class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <h3 class="text-sm text-stone-500">이메일</h3>
          <a :href="`mailto:${site.company.email}`" class="mt-1 block break-all text-lg font-medium text-stone-950 transition-colors hover:text-emerald-700">
            {{ site.company.email }}
          </a>
          <p class="mt-1 text-sm text-stone-500">24시간 이내 답변 드립니다.</p>
        </div>
      </li>

      <li class="flex items-start gap-5">
        <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 shadow-sm">
          <Phone class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <h3 class="text-sm text-stone-500">전화</h3>
          <a :href="telHref" class="mt-1 block text-lg font-medium text-stone-950 transition-colors hover:text-emerald-700">
            {{ site.company.phone }}
          </a>
          <p class="mt-1 inline-flex items-center gap-1.5 text-sm text-stone-500">
            <Clock class="h-3.5 w-3.5" aria-hidden="true" />
            {{ site.company.hours }}
          </p>
        </div>
      </li>

      <li class="flex items-start gap-5">
        <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 shadow-sm">
          <MapPin class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <h3 class="text-sm text-stone-500">주소</h3>
          <p class="mt-1 text-base font-medium text-stone-950">{{ site.company.address }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
