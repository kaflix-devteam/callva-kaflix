/**
 * Shared Tailwind class recipes. Lifted from the original markup so every page
 * renders the same buttons / cards / inputs. Prefer these over ad-hoc strings.
 */
export const ui = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 break-keep rounded-lg bg-stone-950 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 break-keep rounded-lg border border-stone-900 px-5 py-3.5 text-base font-semibold text-stone-950 transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2',
  btnOnDark:
    'inline-flex items-center justify-center gap-2 break-keep rounded-lg bg-white px-5 py-3.5 text-base font-semibold text-stone-950 transition-colors hover:bg-stone-200',
  btnOutlineOnDark:
    'inline-flex items-center justify-center gap-2 break-keep rounded-lg border border-white/30 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10',
  btnPill:
    'inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800',
  btnPillLight:
    'inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100',
  linkEmerald:
    'inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800',

  card: 'rounded-2xl border border-stone-200 bg-white p-6 shadow-sm',
  cardMuted: 'rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm',
  cardDark: 'rounded-2xl border border-white/10 bg-white/[0.06] p-6 ring-1 ring-white/10',

  input:
    'w-full rounded-xl border border-stone-200 bg-white px-5 py-4 text-stone-900 transition-all placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400',
  select:
    'w-full appearance-none rounded-xl border border-stone-200 bg-white px-5 py-4 text-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-stone-400',
  textarea:
    'h-44 w-full resize-none rounded-xl border border-stone-200 bg-white px-5 py-4 leading-relaxed text-stone-900 transition-all placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400',
  label: 'mb-2 block text-sm font-semibold text-stone-800',

  chip: 'rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700 sm:text-xs',
  chipAmber: 'rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 sm:text-xs',
  chipEmerald: 'rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 sm:text-xs',
  chipOnDark: 'rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-stone-200 ring-1 ring-white/10',

  iconCircleEmerald:
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  iconBox: 'inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-800',

  h1: 'text-4xl font-semibold leading-[1.15] tracking-tight text-stone-950 sm:text-5xl lg:text-6xl',
  h1Light: 'text-4xl font-light leading-[1.15] tracking-tight text-stone-950 sm:text-5xl lg:text-6xl',
  h2: 'text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-4xl',
  h3: 'text-xl font-semibold tracking-tight text-stone-950',
  lead: 'text-lg leading-relaxed text-stone-600',
  body: 'text-base leading-relaxed text-stone-600',
} as const
