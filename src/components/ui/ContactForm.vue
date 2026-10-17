<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CheckCircle2, ChevronDown, Loader2 } from 'lucide-vue-next'
import { ApiError, submitContact, type ContactPayload } from '@/lib/api'
import { referralOptions, storeTypeOptions } from '@/data/industries'
import { ui } from '@/lib/ui'

const props = withDefaults(defineProps<{ source?: string; submitLabel?: string }>(), {
  source: 'contact',
  submitLabel: '상담 신청하기',
})

const form = reactive({
  name: '',
  phone: '',
  storeName: '',
  storeType: '',
  message: '',
  referral: '',
  wantsAiCall: false,
  privacyAgreed: false,
})

const status = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const errorMessage = ref('')
const fieldErrors = reactive<{ name?: string; phone?: string; privacyAgreed?: string }>({})
const receivedAt = ref('')

const phoneOk = computed(() => /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(form.phone.trim()))

function validate() {
  fieldErrors.name = form.name.trim() ? undefined : '성함을 입력해주세요.'
  fieldErrors.phone = phoneOk.value ? undefined : '연락처 형식을 확인해주세요. 예) 010-1234-5678'
  fieldErrors.privacyAgreed = form.privacyAgreed ? undefined : '개인정보 수집 및 이용에 동의해주세요.'
  return !fieldErrors.name && !fieldErrors.phone && !fieldErrors.privacyAgreed
}

async function onSubmit() {
  if (!validate()) return
  status.value = 'submitting'
  errorMessage.value = ''
  const payload: ContactPayload = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    storeName: form.storeName.trim() || undefined,
    storeType: form.storeType || undefined,
    message: form.message.trim() || undefined,
    referral: form.referral || undefined,
    wantsAiCall: form.wantsAiCall,
    privacyAgreed: form.privacyAgreed,
    source: props.source,
  }
  try {
    const res = await submitContact(payload)
    receivedAt.value = res.receivedAt
    status.value = 'success'
  } catch (e) {
    status.value = 'error'
    errorMessage.value = e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.'
  }
}

function reset() {
  Object.assign(form, { name: '', phone: '', storeName: '', storeType: '', message: '', referral: '', wantsAiCall: false, privacyAgreed: false })
  status.value = 'idle'
}
</script>

<template>
  <div v-if="status === 'success'" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
    <CheckCircle2 class="mx-auto h-12 w-12 text-emerald-600" />
    <h3 class="mt-4 text-xl font-semibold text-stone-950">상담 신청이 접수되었습니다</h3>
    <p class="mt-2 text-stone-600">영업시간 기준 2시간 이내에 연락드립니다.</p>
    <p v-if="receivedAt" class="mt-1 text-xs text-stone-500">접수 시각 {{ new Date(receivedAt).toLocaleString('ko-KR') }}</p>
    <button type="button" class="mt-6 text-sm font-semibold text-emerald-700 hover:text-emerald-800" @click="reset">새 문의 작성하기</button>
  </div>

  <form v-else class="relative z-10 space-y-6" novalidate @submit.prevent="onSubmit">
    <div class="grid gap-6 sm:grid-cols-2">
      <div>
        <label :class="ui.label" for="cf-name">성함 <span class="text-red-500">*</span></label>
        <input id="cf-name" v-model="form.name" :class="ui.input" type="text" placeholder="홍길동" autocomplete="name" required />
        <p v-if="fieldErrors.name" class="mt-1.5 text-xs text-red-600">{{ fieldErrors.name }}</p>
      </div>
      <div>
        <label :class="ui.label" for="cf-phone">연락처 <span class="text-red-500">*</span></label>
        <input id="cf-phone" v-model="form.phone" :class="ui.input" type="tel" placeholder="010-1234-5678" autocomplete="tel" required />
        <p v-if="fieldErrors.phone" class="mt-1.5 text-xs text-red-600">{{ fieldErrors.phone }}</p>
      </div>
    </div>

    <div class="grid gap-6 sm:grid-cols-2">
      <div>
        <label :class="ui.label" for="cf-store">매장명 (또는 기업명)</label>
        <input id="cf-store" v-model="form.storeName" :class="ui.input" type="text" placeholder="Callva Cafe" autocomplete="organization" />
      </div>
      <div>
        <label :class="ui.label" for="cf-type">업종</label>
        <div class="relative">
          <select id="cf-type" v-model="form.storeType" :class="[ui.select, !form.storeType && 'text-stone-400']">
            <option value="">업종을 선택하세요</option>
            <option v-for="opt in storeTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>
      </div>
    </div>

    <div>
      <label :class="ui.label" for="cf-message">문의 내용</label>
      <textarea id="cf-message" v-model="form.message" :class="ui.textarea" placeholder="관심 있는 플랜이나 구체적인 상담 내용을 적어주세요." />
    </div>

    <div>
      <label :class="ui.label" for="cf-referral">Callva를 어떻게 알게 되셨나요? (선택 사항)</label>
      <div class="relative">
        <select id="cf-referral" v-model="form.referral" :class="[ui.select, !form.referral && 'text-stone-400']">
          <option value="">선택해주세요</option>
          <option v-for="opt in referralOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      </div>
    </div>

    <div class="space-y-3 rounded-xl border border-stone-200 bg-stone-50 px-5 py-4">
      <label class="flex cursor-pointer items-start gap-3 text-sm text-stone-700">
        <input v-model="form.wantsAiCall" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-stone-300 accent-stone-900" />
        <span>AI 상담 전화를 받고 싶어요</span>
      </label>
      <label class="flex cursor-pointer items-start gap-3 text-sm text-stone-700">
        <input v-model="form.privacyAgreed" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-stone-300 accent-stone-900" required />
        <span>개인정보 수집 및 이용에 동의합니다. <span class="font-semibold">(필수)</span></span>
      </label>
      <p v-if="fieldErrors.privacyAgreed" class="text-xs text-red-600">{{ fieldErrors.privacyAgreed }}</p>
    </div>

    <p v-if="status === 'error'" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      접수에 실패했습니다. {{ errorMessage }}
    </p>

    <button type="submit" :class="[ui.btnPrimary, 'w-full']" :disabled="status === 'submitting'">
      <Loader2 v-if="status === 'submitting'" class="h-4 w-4 animate-spin" />
      {{ status === 'submitting' ? '접수 중...' : submitLabel }}
    </button>
  </form>
</template>
