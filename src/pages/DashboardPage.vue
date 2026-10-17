<script setup lang="ts">
import { LayoutDashboard } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import { site } from '@/data/site'
</script>

<template>
  <section class="container-narrow flex min-h-[70vh] flex-col items-center justify-center pb-24 pt-32 text-center">
    <span class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-950 text-white">
      <LayoutDashboard class="h-7 w-7" />
    </span>
    <h1 class="mt-6 text-3xl font-semibold tracking-tight text-stone-950">{{ site.name }} 대시보드</h1>
    <p class="mt-3 max-w-md text-stone-600">
      원본 서비스는 별도 앱(대시보드)으로 로그인합니다. 이 클론에는 로그인·대시보드가 포함되어 있지 않아 안내 페이지로 대체했습니다.
    </p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <BaseButton to="/features">기능 소개 보기</BaseButton>
      <BaseButton to="/contact" variant="secondary">도입 문의</BaseButton>
    </div>
  </section>
</template>
