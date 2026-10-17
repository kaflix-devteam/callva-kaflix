/**
 * Home-page-only class recipes. The original home page uses font-light display
 * headings and plain emerald eyebrows that the shared `ui` recipes don't cover.
 */
export const homeUi = {
  eyebrow: 'mb-4 text-sm font-semibold text-emerald-800',
  eyebrowOnDark: 'mb-4 text-sm font-semibold text-emerald-300',
  displayH1: 'break-keep text-[2.35rem] font-light leading-[1.05] text-stone-950 sm:text-6xl sm:leading-[1.04] lg:text-7xl',
  displayH2: 'break-keep text-3xl font-light leading-tight text-stone-950 sm:text-5xl',
  displayH2Lg: 'break-keep text-4xl font-light leading-[1.08] text-stone-950 sm:text-6xl lg:text-7xl',
  proofChip: 'rounded-full bg-stone-100 px-3.5 py-1.5 text-sm font-medium text-stone-700',
} as const
