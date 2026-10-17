<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Activity, ArrowUpRight, Gauge, RefreshCw, Server, Timer } from 'lucide-vue-next'
import { fetchStatusPage, statusLabel, type ServiceStatus, type StatusPage } from '@/lib/api'
import { site } from '@/data/site'

const REFRESH_MS = 30_000
/* Kept in script: Vue condenses template whitespace, which would drop the line break. */
const heading = '전화 운영 인프라를\n실시간으로 공개합니다.'

const data = ref<StatusPage | null>(null)
const loading = ref(true)
const error = ref('')
let timer: ReturnType<typeof setInterval> | null = null

async function load() {
  try {
    data.value = await fetchStatusPage()
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error && e.message ? e.message : '상태를 불러오지 못했습니다'
  } finally {
    loading.value = false
  }
}

function retry() {
  loading.value = true
  void load()
}

onMounted(() => {
  void load()
  timer = setInterval(() => void load(), REFRESH_MS)
})

onBeforeUnmount(() => {
  if (timer !== null) clearInterval(timer)
})

interface Tone {
  chip: string
  dot: string
}

const toneByStatus: Record<ServiceStatus, Tone> = {
  operational: { chip: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30', dot: 'bg-emerald-300' },
  degraded: { chip: 'bg-amber-400/15 text-amber-200 ring-amber-300/30', dot: 'bg-amber-300' },
  maintenance: { chip: 'bg-amber-400/15 text-amber-200 ring-amber-300/30', dot: 'bg-amber-300' },
  outage: { chip: 'bg-red-400/15 text-red-200 ring-red-300/30', dot: 'bg-red-400' },
}
const pendingTone: Tone = { chip: 'bg-white/10 text-stone-300 ring-white/10', dot: 'bg-stone-400' }

const overallTone = computed(() => (data.value ? toneByStatus[data.value.overall] : pendingTone))
const overallLabel = computed(() => {
  if (data.value) return statusLabel[data.value.overall]
  if (loading.value) return '상태 확인 중'
  return '상태를 불러오지 못했습니다'
})

const tiles = computed(() => [
  { icon: Gauge, label: '24시간 가동률', value: data.value ? `${data.value.uptime24h}%` : '...' },
  { icon: Server, label: '운영 서비스', value: data.value ? data.value.operationalServices : '...' },
  { icon: Timer, label: '평균 응답', value: data.value ? `${data.value.avgResponseMs}ms` : '...' },
])

/** Placeholder rows while the first fetch is in flight (mirrors the API's two services). */
const placeholderServices = [
  { id: 'api', name: 'API 서버' },
  { id: 'call-infra', name: 'Call Infra' },
]

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <section id="status-section" class="scroll-mt-24 border-t border-stone-200 bg-stone-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
      <div>
        <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
          <span class="relative flex h-2 w-2" aria-hidden="true">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75 motion-reduce:hidden" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
          </span>
          실시간 갱신 중
        </div>
        <p class="mb-4 text-sm font-semibold text-emerald-300">실시간 서비스 상태</p>
        <h2 class="whitespace-pre-line text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">{{ heading }}</h2>
        <p class="mt-6 max-w-xl text-base leading-8 text-stone-300">
          API 서버와 Call Infra 상태를 실시간 status page에서 직접 가져와 보여드립니다. 장애나 점검이 있으면 이 영역에 바로 반영됩니다.
        </p>
      </div>

      <div class="relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 sm:p-6 lg:p-8">
        <div
          class="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.09)_1px,transparent_1px)] [background-size:28px_28px]"
          aria-hidden="true"
        />

        <!-- Header -->
        <div class="relative flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-stone-950" aria-hidden="true">
              <Activity class="h-5 w-5" />
            </span>
            <div>
              <p class="text-sm text-stone-400">Callva Status</p>
              <div class="mt-0.5 flex flex-wrap items-center gap-2">
                <p class="text-xl font-semibold text-white">{{ overallLabel }}</p>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1"
                  :class="overallTone.chip"
                  aria-live="polite"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="overallTone.dot" aria-hidden="true" />
                  {{ data ? statusLabel[data.overall] : loading ? '확인 중' : '연결 실패' }}
                </span>
              </div>
            </div>
          </div>
          <RouterLink
            :to="site.statusUrl"
            class="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-stone-200 transition-colors hover:border-emerald-300/50 hover:text-white"
          >
            전체 상태 보기
            <ArrowUpRight class="h-4 w-4" aria-hidden="true" />
          </RouterLink>
        </div>

        <!-- Error -->
        <div
          v-if="error"
          class="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          <span>상태를 불러오지 못했습니다. <span class="text-red-200/80">{{ error }}</span></span>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            @click="retry"
          >
            <RefreshCw class="h-3.5 w-3.5" aria-hidden="true" />
            다시 시도
          </button>
        </div>

        <!-- Tiles -->
        <div class="relative grid gap-3 py-6 sm:grid-cols-3">
          <div v-for="tile in tiles" :key="tile.label" class="rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/10">
            <component :is="tile.icon" class="h-4 w-4 text-emerald-300" aria-hidden="true" />
            <p class="mt-3 text-xs text-stone-400">{{ tile.label }}</p>
            <p class="mt-1 font-mono text-2xl text-white">{{ tile.value }}</p>
          </div>
        </div>

        <!-- Services -->
        <div class="relative space-y-3">
          <template v-if="data">
            <div
              v-for="service in data.services"
              :key="service.id"
              class="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-stone-950/40 px-4 py-3"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 shrink-0 rounded-full" :class="toneByStatus[service.status].dot" aria-hidden="true" />
                  <p class="truncate text-sm font-medium text-white">{{ service.name }}</p>
                </div>
                <p class="mt-1 text-xs text-stone-500">최근 확인 {{ formatTime(service.lastCheckedAt) }}</p>
              </div>
              <div class="text-right">
                <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1" :class="toneByStatus[service.status].chip">
                  {{ statusLabel[service.status] }}
                </span>
                <p class="mt-1 font-mono text-xs text-stone-500">{{ service.responseMs === null ? '-' : `${service.responseMs}ms` }}</p>
              </div>
            </div>
          </template>
          <template v-else>
            <div
              v-for="service in placeholderServices"
              :key="service.id"
              class="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-stone-950/40 px-4 py-3"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 shrink-0 rounded-full bg-stone-400" aria-hidden="true" />
                  <p class="truncate text-sm font-medium text-white">{{ service.name }}</p>
                </div>
                <p class="mt-1 text-xs text-stone-500">최근 확인 -</p>
              </div>
              <div class="text-right">
                <p class="text-xs font-semibold text-emerald-200">{{ loading ? '확인 중' : '-' }}</p>
                <p class="mt-1 font-mono text-xs text-stone-500">-</p>
              </div>
            </div>
          </template>
        </div>

        <p v-if="data" class="relative mt-4 text-right text-[11px] text-stone-500">
          마지막 갱신 {{ formatTime(data.updatedAt) }} · 30초마다 자동 갱신
        </p>
      </div>
    </div>
  </section>
</template>
