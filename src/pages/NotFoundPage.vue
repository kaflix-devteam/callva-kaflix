<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <section class="container-narrow flex min-h-[70vh] flex-col items-center justify-center pb-24 pt-32 text-center">
    <p class="eyebrow">404</p>
    <h1 class="mt-4 text-4xl font-semibold tracking-tight text-stone-950">페이지를 찾을 수 없습니다</h1>
    <p class="mt-3 text-stone-600">주소가 바뀌었거나 삭제된 페이지입니다.</p>
    <BaseButton to="/" class="mt-8">홈으로 돌아가기</BaseButton>
  </section>
</template>
