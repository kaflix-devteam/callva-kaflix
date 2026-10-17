<script setup lang="ts">
/** Quiet disabled state for the "실제 AI 통화" tab when the GPU API is not reachable / not enabled. */
import { PhoneOff, RefreshCw } from 'lucide-vue-next'
import { ui } from '@/lib/ui'

defineProps<{ reason: string; checking?: boolean }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center" data-testid="live-unavailable">
    <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-stone-500">
      <PhoneOff class="h-5 w-5" aria-hidden="true" />
    </span>
    <p class="mt-5 text-base font-semibold text-stone-900">실제 AI 통화는 지금 연결되지 않았습니다</p>
    <p class="mt-2 max-w-sm text-sm leading-6 text-stone-600">{{ reason }}</p>
    <button type="button" :class="[ui.btnPillLight, 'mt-6']" :disabled="checking" @click="emit('retry')">
      <RefreshCw class="h-4 w-4" :class="checking ? 'animate-spin' : ''" aria-hidden="true" />
      {{ checking ? '확인 중…' : '다시 확인' }}
    </button>
    <p class="mt-6 text-xs leading-5 text-stone-400">연결되면 자동으로 전환됩니다 · 시뮬레이션 탭은 계속 이용할 수 있습니다</p>
  </div>
</template>
