/**
 * Request-body validation for the Callva clone API.
 *
 * Every validator returns `{ ok: true, value }` with a whitelisted, normalised
 * value, or `{ ok: false, error, fields }` where `error` is a Korean message
 * suitable for showing to a human and `fields` maps field name -> message.
 *
 * The shapes here must match `src/lib/api.ts` (the contract):
 *   ContactPayload      → validateContact
 *   ConsultationPayload → validateConsultation
 */

export const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/
const MAX_TEXT = 2000
const MAX_NAME = 50
const MAX_ANSWERS = 12
const PLAN_IDS = new Set(['pro', 'business', 'scale'])

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Optional free-text string: undefined/null/'' → undefined; otherwise trimmed, ≤ max chars. */
function optionalText(value, label, max, fields, key) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') {
    fields[key] = `${label}은(는) 문자열이어야 합니다.`
    return undefined
  }
  const trimmed = value.trim()
  if (trimmed.length > max) {
    fields[key] = `${label}은(는) ${max.toLocaleString('ko-KR')}자 이내로 입력해주세요.`
    return undefined
  }
  return trimmed || undefined
}

function fail(error, fields) {
  return { ok: false, error, fields }
}

function summarize(fields, fallback) {
  const first = Object.values(fields)[0]
  return first ?? fallback
}

/**
 * ContactPayload:
 *   name (1–50, required), phone (KR format, required), privacyAgreed === true,
 *   wantsAiCall boolean (default false), optional strings ≤ 2000 chars.
 */
export function validateContact(body) {
  if (!isPlainObject(body)) return fail('요청 본문이 올바르지 않습니다.', { body: 'JSON 객체가 필요합니다.' })

  const fields = {}

  // name
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (typeof body.name !== 'string' || !name) fields.name = '성함을 입력해주세요.'
  else if (name.length > MAX_NAME) fields.name = `성함은 ${MAX_NAME}자 이내로 입력해주세요.`

  // phone
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  if (!phone) fields.phone = '연락처를 입력해주세요.'
  else if (!PHONE_RE.test(phone)) fields.phone = '연락처 형식을 확인해주세요. 예) 010-1234-5678'

  // privacyAgreed
  if (body.privacyAgreed !== true) fields.privacyAgreed = '개인정보 수집 및 이용에 동의해주세요.'

  // wantsAiCall
  let wantsAiCall = false
  if (body.wantsAiCall !== undefined && body.wantsAiCall !== null) {
    if (typeof body.wantsAiCall !== 'boolean') fields.wantsAiCall = 'AI 상담 전화 여부는 true/false 값이어야 합니다.'
    else wantsAiCall = body.wantsAiCall
  }

  // optional text fields
  const storeName = optionalText(body.storeName, '매장명', MAX_TEXT, fields, 'storeName')
  const storeType = optionalText(body.storeType, '업종', MAX_TEXT, fields, 'storeType')
  const message = optionalText(body.message, '문의 내용', MAX_TEXT, fields, 'message')
  const referral = optionalText(body.referral, '유입 경로', MAX_TEXT, fields, 'referral')
  const source = optionalText(body.source, '제출 위치', 100, fields, 'source')

  if (Object.keys(fields).length > 0) {
    return fail(summarize(fields, '입력 내용을 확인해주세요.'), fields)
  }

  // Only whitelisted keys reach storage.
  const value = { name, phone, wantsAiCall, privacyAgreed: true }
  if (storeName) value.storeName = storeName
  if (storeType) value.storeType = storeType
  if (message) value.message = message
  if (referral) value.referral = referral
  if (source) value.source = source
  return { ok: true, value }
}

/**
 * ConsultationPayload:
 *   answers: Record<string, string> with 1–12 keys (short ids),
 *   estimate?: { monthlyCalls, missedCalls, estimatedLossKrw, monthlyFeeKrw: number;
 *                recommendedPlan: 'pro' | 'business' | 'scale' }
 */
export function validateConsultation(body) {
  if (!isPlainObject(body)) return fail('요청 본문이 올바르지 않습니다.', { body: 'JSON 객체가 필요합니다.' })

  const fields = {}

  // answers
  const answers = {}
  if (!isPlainObject(body.answers)) {
    fields.answers = '답변(answers)은 객체여야 합니다.'
  } else {
    const entries = Object.entries(body.answers)
    if (entries.length < 1) fields.answers = '답변이 최소 1개 필요합니다.'
    else if (entries.length > MAX_ANSWERS) fields.answers = `답변은 최대 ${MAX_ANSWERS}개까지 보낼 수 있습니다.`
    else {
      for (const [k, v] of entries) {
        if (!/^[\w-]{1,40}$/.test(k) || typeof v !== 'string' || !v || v.length > 80) {
          fields.answers = '답변 형식이 올바르지 않습니다. (questionId → optionId 문자열)'
          break
        }
        answers[k] = v
      }
    }
  }

  // estimate (optional)
  let estimate
  if (body.estimate !== undefined && body.estimate !== null) {
    if (!isPlainObject(body.estimate)) {
      fields.estimate = '예상치(estimate)는 객체여야 합니다.'
    } else {
      const e = body.estimate
      const numKeys = ['monthlyCalls', 'missedCalls', 'estimatedLossKrw', 'monthlyFeeKrw']
      const out = {}
      for (const key of numKeys) {
        const n = e[key]
        if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1e12) {
          fields[`estimate.${key}`] = `${key}은(는) 0 이상의 숫자여야 합니다.`
        } else {
          out[key] = Math.round(n)
        }
      }
      if (!PLAN_IDS.has(e.recommendedPlan)) {
        fields['estimate.recommendedPlan'] = 'recommendedPlan은 pro, business, scale 중 하나여야 합니다.'
      } else {
        out.recommendedPlan = e.recommendedPlan
      }
      estimate = out
    }
  }

  if (Object.keys(fields).length > 0) {
    return fail(summarize(fields, '진단 데이터를 확인해주세요.'), fields)
  }

  const value = { answers }
  if (estimate) value.estimate = estimate
  return { ok: true, value }
}

/** `?type=` query for /api/submissions */
export function validateSubmissionType(type) {
  return type === 'contact' || type === 'consultation'
}
