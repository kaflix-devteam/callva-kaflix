<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import FloatingDemoButton from '@/components/layout/FloatingDemoButton.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-stone-50 text-stone-900">
    <SiteHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <SiteFooter />
    <FloatingDemoButton />
  </div>
</template>
