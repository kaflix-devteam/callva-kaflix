/**
 * 무료 진단 (/consultation) — questions, weights and the estimate formula.
 *
 * Everything here is a pure function of the answers so it can be unit-tested
 * without Vue. Q1 copy is transcribed from callva.ai; Q2–Q6, the weights and
 * the result copy are our own.
 *
 * Formula (per month, 26 working days):
 *   monthlyCalls      = dailyCalls × 26
 *   missedCalls       = round(monthlyCalls × missedRatio × afterHoursMultiplier)
 *   estimatedLossKrw  = missedCalls × avgCallValueKrw
 *   plan              = recommendForQuiz(monthlyCalls, avgMinutes)
 *                       (recommendPlan + "near the limit" correction, see below)
 *   netKrw            = estimatedLossKrw − plan.price
 */
import type { ConsultationPayload } from '../lib/api'
import { formatKrw, plans, recommendPlan, type Plan } from './plans'

export type QuestionId =
  | 'daily-calls'
  | 'industry'
  | 'missed-ratio'
  | 'avg-minutes'
  | 'who-answers'
  | 'after-hours'

export interface QuizOption {
  id: string
  label: string
  sub: string
  /** numeric weight consumed by the formula; its meaning depends on the question */
  value: number
}

export interface QuizQuestion {
  id: QuestionId
  title: string
  hint: string
  options: QuizOption[]
}

export type Answers = Partial<Record<QuestionId, string>>

export const WORKING_DAYS_PER_MONTH = 26

export const questions: QuizQuestion[] = [
  {
    id: 'daily-calls',
    title: '하루에 전화가 몇 통 정도 오나요?',
    hint: '업무 중 받는 전화 + 놓치는 전화 모두 포함',
    options: [
      { id: 'under-10', label: '10통 미만', sub: '한 시간에 1통 이하', value: 7 },
      { id: '10-30', label: '10~30통', sub: '고객 응대 중에도 전화가 옴', value: 20 },
      { id: '30-50', label: '30~50통', sub: '전화 때문에 업무가 자주 끊김', value: 40 },
      { id: 'over-50', label: '50통 이상', sub: '전화 받는 게 하나의 업무', value: 60 },
    ],
  },
  {
    id: 'industry',
    title: '어떤 업종을 운영하시나요?',
    hint: '놓친 전화 1건당 평균 기대 손실을 계산하는 데 사용해요',
    options: [
      { id: 'food', label: '음식점·카페', sub: '예약, 주문, 영업시간 문의', value: 12000 },
      { id: 'beauty', label: '뷰티·헬스', sub: '시술·수업 예약, 가격 안내', value: 35000 },
      { id: 'clinic', label: '병원·전문직', sub: '진료·상담 예약, 긴급 건 분류', value: 70000 },
      { id: 'other', label: '기타', sub: '공간대여, 교육, 무인매장, 정비 등', value: 25000 },
    ],
  },
  {
    id: 'missed-ratio',
    title: '전화를 얼마나 놓치고 있나요?',
    hint: '바빠서 못 받거나, 부재중으로 남는 전화의 비율',
    options: [
      { id: 'under-10', label: '10% 미만', sub: '거의 다 받는 편', value: 0.05 },
      { id: '10-30', label: '10~30%', sub: '바쁜 시간대에는 종종 놓침', value: 0.2 },
      { id: '30-50', label: '30~50%', sub: '절반 가까이 못 받음', value: 0.4 },
      { id: 'over-50', label: '50% 이상', sub: '받는 전화보다 놓치는 전화가 많음', value: 0.6 },
    ],
  },
  {
    id: 'avg-minutes',
    title: '통화 한 번에 보통 얼마나 걸리나요?',
    hint: '문의 확인부터 안내가 끝날 때까지 평균 시간',
    options: [
      { id: 'under-1', label: '1분 이내', sub: '영업시간·위치 같은 짧은 질문', value: 1 },
      { id: '1-3', label: '1~3분', sub: '예약 접수, 메뉴·가격 안내', value: 2 },
      { id: '3-5', label: '3~5분', sub: '상세 상담, 변경·취소 처리', value: 4 },
      { id: 'over-5', label: '5분 이상', sub: '복잡한 견적·상담 통화', value: 6 },
    ],
  },
  {
    id: 'who-answers',
    title: '지금 전화는 누가 받나요?',
    hint: '전화 응대에 들어가는 월 인건비를 추정해요',
    options: [
      { id: 'owner', label: '대표가 직접', sub: '일하다 말고 받는 중', value: 600000 },
      { id: 'staff-shared', label: '직원이 겸업', sub: '홀·카운터 직원이 틈틈이 받음', value: 450000 },
      { id: 'dedicated', label: '전담 직원', sub: '전화 응대만 하는 직원이 있음', value: 2200000 },
      { id: 'outsourced', label: '콜센터 외주', sub: '외부 업체에 맡기는 중', value: 1200000 },
    ],
  },
  {
    id: 'after-hours',
    title: '영업시간 외에도 전화가 오나요?',
    hint: '마감 후, 휴무일, 새벽에 오는 전화',
    options: [
      { id: 'rare', label: '거의 없음', sub: '영업시간 안에 대부분 옴', value: 1 },
      { id: 'sometimes', label: '가끔', sub: '마감 직후 몇 통 정도', value: 1.15 },
      { id: 'often', label: '자주', sub: '휴무일에도 부재중이 쌓임', value: 1.3 },
      { id: 'always', label: '24시간 문의가 옴', sub: '새벽·주말 가리지 않음', value: 1.5 },
    ],
  },
]

export const TOTAL_QUESTIONS = questions.length

export interface Estimate {
  dailyCalls: number
  monthlyCalls: number
  missedRatio: number
  afterHoursMultiplier: number
  missedCalls: number
  avgCallValueKrw: number
  estimatedLossKrw: number
  avgMinutes: number
  /** rough monthly cost of whoever answers the phone today */
  laborCostKrw: number
  neededMinutes: number
  plan: Plan
  overageMinutes: number
  withinPlan: boolean
  /**
   * true when the strict rule would have jumped to the next plan for a small
   * overage (≤ 15 % of the lower plan) — we recommend the lower plan + 추가 상품 instead.
   */
  nearLimit: boolean
  /** the plan the strict rule would have picked when `nearLimit` is true */
  upperPlan?: Plan
  monthlyFeeKrw: number
  /** estimatedLossKrw − monthlyFeeKrw (may be negative) */
  netKrw: number
}

export function getQuestion(id: QuestionId) {
  return questions.find((q) => q.id === id)
}

export function getOption(questionId: QuestionId, optionId: string | undefined) {
  if (!optionId) return undefined
  return getQuestion(questionId)?.options.find((o) => o.id === optionId)
}

function weight(answers: Answers, id: QuestionId) {
  return getOption(id, answers[id])?.value
}

export function isComplete(answers: Answers) {
  return questions.every((q) => getOption(q.id, answers[q.id]) !== undefined)
}

/** Progress percentage for the header, e.g. 1/6 → 17 % (matches the original). */
export function progressPercent(stepIndex: number, total = TOTAL_QUESTIONS) {
  return Math.round(((stepIndex + 1) / total) * 100)
}

/** Overage tolerance before the quiz jumps to the next plan (15 % of the lower plan's minutes). */
export const NEAR_LIMIT_TOLERANCE = 0.15

export interface QuizRecommendation {
  needed: number
  plan: Plan
  overage: number
  withinPlan: boolean
  nearLimit: boolean
  upperPlan?: Plan
}

/**
 * Quiz-only plan recommendation.
 *
 * `recommendPlan()` (shared with the pricing calculator) picks the smallest plan
 * that fully covers the needed minutes, so 1,040 minutes jumps from Business
 * (1,000) straight to Scale. For the diagnosis we soften that cliff: if the
 * strict pick is not the first plan and the plan right below it is exceeded by
 * at most 15 % of its included minutes, recommend the lower plan + 추가 상품.
 */
export function recommendForQuiz(monthlyCalls: number, avgMinutes: number): QuizRecommendation {
  const base = recommendPlan(monthlyCalls, avgMinutes)
  const idx = plans.findIndex((p) => p.id === base.plan.id)
  const lower = idx > 0 ? plans[idx - 1] : undefined
  if (lower) {
    const overage = base.needed - lower.includedMinutes
    if (overage > 0 && overage <= NEAR_LIMIT_TOLERANCE * lower.includedMinutes) {
      return { needed: base.needed, plan: lower, overage, withinPlan: false, nearLimit: true, upperPlan: base.plan }
    }
  }
  return { needed: base.needed, plan: base.plan, overage: base.overage, withinPlan: base.withinPlan, nearLimit: false }
}

/** Returns null until every question has a valid answer. */
export function computeEstimate(answers: Answers): Estimate | null {
  const dailyCalls = weight(answers, 'daily-calls')
  const avgCallValueKrw = weight(answers, 'industry')
  const missedRatio = weight(answers, 'missed-ratio')
  const avgMinutes = weight(answers, 'avg-minutes')
  const laborCostKrw = weight(answers, 'who-answers')
  const afterHoursMultiplier = weight(answers, 'after-hours')
  if (
    dailyCalls === undefined || avgCallValueKrw === undefined || missedRatio === undefined ||
    avgMinutes === undefined || laborCostKrw === undefined || afterHoursMultiplier === undefined
  ) return null

  const monthlyCalls = dailyCalls * WORKING_DAYS_PER_MONTH
  const missedCalls = Math.round(monthlyCalls * missedRatio * afterHoursMultiplier)
  const estimatedLossKrw = missedCalls * avgCallValueKrw
  const rec = recommendForQuiz(monthlyCalls, avgMinutes)
  const monthlyFeeKrw = rec.plan.price

  return {
    dailyCalls,
    monthlyCalls,
    missedRatio,
    afterHoursMultiplier,
    missedCalls,
    avgCallValueKrw,
    estimatedLossKrw,
    avgMinutes,
    laborCostKrw,
    neededMinutes: rec.needed,
    plan: rec.plan,
    overageMinutes: rec.overage,
    withinPlan: rec.withinPlan,
    nearLimit: rec.nearLimit,
    upperPlan: rec.upperPlan,
    monthlyFeeKrw,
    netKrw: estimatedLossKrw - monthlyFeeKrw,
  }
}

/** "1시간 20분" / "40분" */
export function formatMinutes(totalMinutes: number) {
  const m = Math.round(totalMinutes)
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (h === 0) return `${rest}분`
  return rest === 0 ? `${h}시간` : `${h}시간 ${rest}분`
}

export function formatCount(n: number) {
  return n.toLocaleString('ko-KR')
}

/** Three short takeaways derived from the answers. */
export function buildInsights(answers: Answers, e: Estimate): string[] {
  const out: string[] = []

  // 1) missed calls / after-hours
  if (e.afterHoursMultiplier >= 1.3) {
    out.push(
      `영업시간 외 문의가 많아 놓치는 전화가 월 ${formatCount(e.missedCalls)}건까지 늘어나요. AI는 마감 후·휴무일에도 똑같이 받습니다.`,
    )
  } else if (e.missedRatio >= 0.3) {
    out.push(
      `전화 10통 중 ${Math.round(e.missedRatio * 10)}통을 놓치고 있어요. 바쁜 시간대에 동시에 받아주는 것만으로 월 ${formatCount(e.missedCalls)}건을 되찾을 수 있습니다.`,
    )
  } else if (e.missedRatio >= 0.15) {
    out.push(
      `바쁜 시간대에 놓치는 전화가 월 ${formatCount(e.missedCalls)}건이에요. 1년이면 약 ${formatKrw(e.estimatedLossKrw * 12)}의 기회가 사라집니다.`,
    )
  } else {
    out.push(
      `놓치는 전화는 많지 않지만 월 ${formatCount(e.missedCalls)}건 × ${formatKrw(e.avgCallValueKrw)}이면 1년에 약 ${formatKrw(e.estimatedLossKrw * 12)}입니다.`,
    )
  }

  // 2) who answers today
  const dailyMinutes = e.dailyCalls * e.avgMinutes
  switch (answers['who-answers']) {
    case 'owner':
      out.push(`대표님이 직접 받는 전화를 AI에 넘기면 하루 약 ${formatMinutes(dailyMinutes)}이 본업으로 돌아옵니다.`)
      break
    case 'staff-shared':
      out.push(`직원이 응대 중 전화를 받느라 끊기는 시간이 하루 약 ${formatMinutes(dailyMinutes)}이에요. 현장 응대에만 집중할 수 있게 됩니다.`)
      break
    case 'dedicated':
      out.push(
        `전담 직원 인건비 약 ${formatKrw(e.laborCostKrw)}/월 대비 ${e.plan.name} 플랜은 ${formatKrw(e.monthlyFeeKrw)} — 약 ${Math.round((e.monthlyFeeKrw / e.laborCostKrw) * 100)}% 수준입니다.`,
      )
      break
    case 'outsourced':
      out.push(`콜센터 외주 비용 약 ${formatKrw(e.laborCostKrw)}/월과 비교해 보세요. 녹음·전사까지 포함된 요금입니다.`)
      break
    default:
      out.push(`전화 응대에 들어가는 시간은 하루 약 ${formatMinutes(dailyMinutes)}입니다.`)
  }

  // 3) plan fit
  if (e.nearLimit && e.upperPlan) {
    out.push(
      `월 ${formatCount(e.monthlyCalls)}건 × 평균 ${e.avgMinutes}분 = 약 ${formatCount(e.neededMinutes)}분. ${e.plan.name} 플랜 포함 분량(${formatCount(e.plan.includedMinutes)}분)을 약 ${formatCount(e.overageMinutes)}분만 넘어, 상위 플랜(${e.upperPlan.name} ${formatKrw(e.upperPlan.price)})보다 추가 상품으로 보충하는 편이 경제적이에요.`,
    )
  } else if (e.withinPlan) {
    out.push(
      `월 ${formatCount(e.monthlyCalls)}건 × 평균 ${e.avgMinutes}분 = 약 ${formatCount(e.neededMinutes)}분. ${e.plan.name} 플랜 포함 분량(${formatCount(e.plan.includedMinutes)}분) 안에 들어옵니다.`,
    )
  } else {
    out.push(
      `필요 분량 약 ${formatCount(e.neededMinutes)}분이 ${e.plan.name} 플랜 포함 분량(${formatCount(e.plan.includedMinutes)}분)을 넘어요. 초과 ${formatCount(e.overageMinutes)}분은 AI 처리시간 추가 상품으로 보충합니다.`,
    )
  }

  return out
}

/** Map the rich estimate onto the API contract (only the 5 agreed keys). */
export function toConsultationPayload(answers: Answers, e: Estimate): ConsultationPayload {
  const compact: Record<string, string> = {}
  for (const q of questions) {
    const a = answers[q.id]
    if (a) compact[q.id] = a
  }
  return {
    answers: compact,
    estimate: {
      monthlyCalls: e.monthlyCalls,
      missedCalls: e.missedCalls,
      estimatedLossKrw: e.estimatedLossKrw,
      recommendedPlan: e.plan.id,
      monthlyFeeKrw: e.monthlyFeeKrw,
    },
  }
}
