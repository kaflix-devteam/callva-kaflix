<script setup lang="ts">
import { Headset } from 'lucide-vue-next'
</script>

<template>
  <RouterLink
    to="/#demo-section"
    class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
    aria-label="데모 체험하기"
    title="데모 체험하기"
  >
    <Headset class="h-6 w-6" />
  </RouterLink>
</template>
