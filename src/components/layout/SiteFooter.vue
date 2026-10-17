<script setup lang="ts">
import BrandLogo from './BrandLogo.vue'
import { footerGroups } from '@/data/navigation'
import { site } from '@/data/site'
</script>

<template>
  <footer class="border-t border-stone-200 bg-stone-100 pb-10 pt-20">
    <div class="container-x">
      <div class="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <RouterLink to="/" aria-label="홈으로">
            <BrandLogo />
          </RouterLink>
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-stone-600">{{ site.tagline }}</p>
        </div>
        <div v-for="group in footerGroups" :key="group.title">
          <h3 class="text-sm font-semibold text-stone-950">{{ group.title }}</h3>
          <ul class="mt-4 space-y-2.5">
            <li v-for="link in group.links" :key="link.label">
              <RouterLink :to="link.to" class="text-sm text-stone-600 transition-colors hover:text-stone-950">
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-16 border-t border-stone-200 pt-8 text-xs leading-relaxed text-stone-500">
        <p>{{ site.company.legalName }} | 대표: {{ site.company.ceo }}</p>
        <p>사업자등록번호: {{ site.company.bizNo }} | 통신판매업신고번호: {{ site.company.mailOrderNo }}</p>
        <p>주소: {{ site.company.address }}</p>
        <p>
          연락처: {{ site.company.phone }} | 고객센터:
          <a :href="`mailto:${site.company.email}`" class="hover:text-stone-900">{{ site.company.email }}</a>
          | 개인정보 관련:
          <a :href="`mailto:${site.company.privacyEmail}`" class="hover:text-stone-900">{{ site.company.privacyEmail }}</a>
        </p>
        <p class="mt-4">{{ site.company.copyright }}</p>
      </div>
    </div>
  </footer>
</template>
