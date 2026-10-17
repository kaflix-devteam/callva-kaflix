<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, ExternalLink, Menu, X } from 'lucide-vue-next'
import BrandLogo from './BrandLogo.vue'
import { headerCta, mainNav } from '@/data/navigation'
import { site } from '@/data/site'

const route = useRoute()
const scrolled = ref(false)
const menuOpen = ref(false)
const langOpen = ref(false)
type Language = (typeof site.languages)[number]
const lang = ref<Language>(site.languages[0]!)

function onScroll() {
  scrolled.value = window.scrollY > 16
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
watch(() => route.fullPath, () => {
  menuOpen.value = false
  langOpen.value = false
})

function isActive(to: string) {
  return route.path === to || (to !== '/' && route.path.startsWith(to + '/'))
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="scrolled || menuOpen ? 'bg-stone-50/90 py-3 shadow-sm backdrop-blur-md' : 'bg-stone-50/0 py-6'"
  >
    <div class="container-x flex items-center justify-between gap-4">
      <RouterLink to="/" class="shrink-0" aria-label="홈으로">
        <BrandLogo />
      </RouterLink>

      <nav class="hidden items-center gap-8 md:flex" aria-label="주요 메뉴">
        <RouterLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          class="text-sm transition-colors hover:text-stone-950"
          :class="isActive(item.to) ? 'font-semibold text-stone-950' : 'text-stone-600'"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            aria-haspopup="listbox"
            :aria-expanded="langOpen"
            @click="langOpen = !langOpen"
          >
            <span aria-hidden="true">{{ lang.flag }}</span>
            <span>{{ lang.label }}</span>
            <ChevronDown class="h-3.5 w-3.5" />
          </button>
          <ul
            v-if="langOpen"
            class="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
            role="listbox"
          >
            <li v-for="l in site.languages" :key="l.code">
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
                :class="{ 'font-semibold text-stone-950': l.code === lang.code }"
                role="option"
                :aria-selected="l.code === lang.code"
                @click="lang = l; langOpen = false"
              >
                <span aria-hidden="true">{{ l.flag }}</span>{{ l.label }}
              </button>
            </li>
          </ul>
        </div>
        <RouterLink :to="headerCta.consult.to" class="px-2 text-sm text-stone-700 transition-colors hover:text-stone-950">
          {{ headerCta.consult.label }}
        </RouterLink>
        <RouterLink
          :to="headerCta.dashboard.to"
          class="inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
        >
          {{ headerCta.dashboard.label }}
          <ExternalLink class="h-3.5 w-3.5" />
        </RouterLink>
      </div>

      <button
        type="button"
        class="rounded-lg p-3 text-stone-900 transition-colors hover:bg-stone-100 md:hidden"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        aria-label="메뉴 열기"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" class="h-5 w-5" />
        <Menu v-else class="h-5 w-5" />
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div v-if="menuOpen" id="mobile-menu" class="border-t border-stone-200 bg-stone-50 md:hidden">
        <nav class="container-x flex flex-col gap-1 py-4" aria-label="모바일 메뉴">
          <RouterLink
            v-for="item in mainNav"
            :key="item.to"
            :to="item.to"
            class="rounded-lg px-3 py-3 text-base"
            :class="isActive(item.to) ? 'bg-stone-100 font-semibold text-stone-950' : 'text-stone-700 hover:bg-stone-100'"
          >
            {{ item.label }}
          </RouterLink>
          <RouterLink :to="headerCta.consult.to" class="rounded-lg px-3 py-3 text-base text-stone-700 hover:bg-stone-100">
            {{ headerCta.consult.label }}
          </RouterLink>
          <RouterLink
            :to="headerCta.dashboard.to"
            class="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
          >
            {{ headerCta.dashboard.label }}
            <ExternalLink class="h-3.5 w-3.5" />
          </RouterLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>
