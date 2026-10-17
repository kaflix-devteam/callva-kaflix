<script setup lang="ts">
/**
 * Partner logo strip. The original shows real client logos; this clone uses
 * invented, neutral wordmarks rendered as text so no real brand is implied.
 */
const partners = [
  { name: 'NORTH CLINIC', style: 'font-black tracking-tight' },
  { name: 'Studio Nine', style: 'font-serif font-semibold italic' },
  { name: 'Blue Dental', style: 'font-bold tracking-tight' },
  { name: 'HANMARU LAW', style: 'font-semibold tracking-[0.25em] text-base' },
  { name: 'Atlas Networks', style: 'font-mono font-bold tracking-tight' },
  { name: 'oneday pilates', style: 'font-bold lowercase tracking-tight' },
  { name: 'Grace Clinic', style: 'font-serif font-bold' },
  { name: 'MINT CAFE', style: 'font-black tracking-[0.2em] text-base' },
  { name: 'Prime Rent', style: 'font-extrabold italic tracking-tight' },
  { name: 'SEOUL PATENT', style: 'font-semibold tracking-widest text-base' },
  { name: 'Vita Pharm', style: 'font-bold tracking-tight' },
  { name: 'KORA HOUSING', style: 'font-black tracking-tight' },
  { name: 'Daily Grill', style: 'font-serif font-semibold' },
  { name: 'ZENITH FIT', style: 'font-extrabold tracking-[0.15em] text-base' },
  { name: 'Lumen Tech', style: 'font-mono font-semibold tracking-tight' },
]

/* Rendered twice inside one track so the -50% keyframe loops seamlessly. */
const track = [...partners, ...partners]
</script>

<template>
  <section class="border-b border-stone-200 bg-stone-50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
    <div class="mx-auto max-w-7xl" aria-label="고객사 로고 (샘플)">
      <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-stone-50 to-transparent sm:w-28" aria-hidden="true" />
        <div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-stone-50 to-transparent sm:w-28" aria-hidden="true" />

        <div class="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
          <div
            v-for="(partner, i) in track"
            :key="`${partner.name}-${i}`"
            class="mx-6 flex h-16 min-w-[150px] items-center justify-center sm:mx-8 sm:h-20 sm:min-w-[190px]"
            :aria-hidden="i >= partners.length ? 'true' : undefined"
          >
            <span
              class="whitespace-nowrap text-lg text-stone-400 opacity-70 grayscale"
              :class="partner.style"
            >
              {{ partner.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
