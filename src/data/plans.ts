export type PlanId = 'pro' | 'business' | 'scale'

export interface PlanSpec {
  label: string
  value: string
}

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  /** monthly price in KRW, VAT excluded */
  price: number
  vatNote: string
  discountNote?: string
  includedMinutes: number
  maxMinutesPerCall: number
  concurrent: number
  recordingRetention: string
  recommended?: boolean
  specs: PlanSpec[]
}

export const plans: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    tagline: '반복 문의가 많은 매장',
    price: 59000,
    vatNote: '부가세 별도',
    discountNote: '3개월 결제 5% 할인 · 12개월 결제 2개월 무료',
    includedMinutes: 300,
    maxMinutesPerCall: 5,
    concurrent: 1,
    recordingRetention: '1개월',
    specs: [
      { label: '월 AI 음성처리', value: '300분' },
      { label: 'AI 응대 1건당', value: '최대 5분' },
      { label: '동시 AI 처리', value: '1건' },
      { label: '녹음 보관', value: '1개월' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: '통화량과 동시 문의가 많은 매장',
    price: 159000,
    vatNote: '부가세 별도',
    discountNote: '3개월 결제 5% 할인 · 12개월 결제 2개월 무료',
    includedMinutes: 1000,
    maxMinutesPerCall: 15,
    concurrent: 3,
    recordingRetention: '6개월',
    recommended: true,
    specs: [
      { label: '월 AI 음성처리', value: '1,000분' },
      { label: 'AI 응대 1건당', value: '최대 15분' },
      { label: '동시 AI 처리', value: '3건' },
      { label: '녹음 보관', value: '6개월' },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: '여러 지점, 콜이 몰리는 사업장',
    price: 649000,
    vatNote: '부가세 별도',
    includedMinutes: 5000,
    maxMinutesPerCall: 15,
    concurrent: 5,
    recordingRetention: '1년',
    specs: [
      { label: '월 AI 음성처리', value: '5,000분' },
      { label: 'AI 응대 1건당', value: '최대 15분' },
      { label: '동시 AI 처리', value: '5건' },
      { label: '녹음 보관', value: '1년' },
    ],
  },
]

export const planCta = {
  label: '세팅 문의하기 · 2시간 내 회신',
}

/** The three note tiles under the plan cards. */
export const planNotes = [
  { label: '세팅', value: '셀프 세팅 0원 · 콜바팀 빠른 세팅 300,000원', sub: '휴일 포함 최대 3일 안에 실운영' },
  { label: '포함 분량을 넘기면', value: 'AI 처리시간 추가 상품', sub: '결제 관리에서 필요한 만큼만 선택' },
  { label: '약정', value: '없음 · 1/3/12개월 결제', sub: '언제든 해지 · 3/12개월은 쓴 개월 정가와 잔액 10% 공제 후 환불' },
]

export const pricingIntro = {
  eyebrow: '요금 안내',
  title: '요금부담 없이, 필요한 기능만 담았습니다.',
  homeDesc:
    '세 플랜 모두 AI 응대 연결번호 1개, VIP 개별 관리, 녹음·전사를 포함합니다.\n셀프 세팅은 0원, 콜바팀 빠른 세팅은 300,000원입니다.',
  pageDesc:
    '세 플랜 모두 AI 응대 연결번호 1개, VIP 개별 관리, 녹음·전사를 포함합니다.\n셀프 세팅은 0원이고 콜바팀 빠른 세팅은 300,000원입니다(부가세 별도). 플랜 요금은 부가세 별도 금액입니다.\n쓰던 번호 그대로, 착신전환으로 연결합니다.',
  setupFee: 300000,
}

/** Outbound usage pricing block on /pricing */
export const outboundPricing = {
  eyebrow: '직접 아웃바운드',
  title: 'AI가 처리한 시간을 10초 단위로',
  desc: '정보 제공 및 견적 상담용 요금입니다. 이 페이지에서는 구매하거나 사용량을 결제하지 않습니다.',
  items: [
    {
      name: 'AI 음성처리 사용료',
      price: 'AI 음성처리 10초당 35원',
      desc: 'AI 음성처리·캠페인 운영·상담사 연결 지원을 포함하며, 처리 완료 건에는 별도 실행료가 없습니다.',
    },
    {
      name: 'AI 캠페인 실행',
      price: '실행 1건당 총 10원',
      desc: '무응답·실패·취소 건에 대한 AI 캠페인 실행·결과 분류 비용입니다.',
    },
  ],
  scenariosTitle: '응답된 휴대전화 통화 시나리오',
  scenarios: [
    { label: 'AI 3분, 전환 없음', price: '630원', sub: '통화 1건 예상 금액' },
    { label: 'AI 3분 + 담당자 전환 1분', price: '840원', sub: '통화 1건 예상 금액' },
    { label: 'AI 3분 + 담당자 전환 2분', price: '1,050원', sub: '통화 1건 예상 금액' },
  ],
  footnote: '예시 금액은 부가세 별도이며, 응답된 아웃바운드 휴대전화 통화를 10초 단위로 계산한 결과입니다.',
  perTenSecondsKrw: 35,
  perCampaignRunKrw: 10,
}

export function formatKrw(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

/**
 * Pricing calculator rule: needed = calls × avgMinutes.
 * Pick the smallest plan whose included minutes cover it; otherwise Scale + 추가 상품.
 */
export function recommendPlan(monthlyCalls: number, avgMinutes: number) {
  const needed = Math.round(monthlyCalls * avgMinutes)
  const fit = plans.find((p) => p.includedMinutes >= needed)
  const plan = fit ?? plans[plans.length - 1]!
  const overage = Math.max(0, needed - plan.includedMinutes)
  return { needed, plan, overage, withinPlan: overage === 0 }
}
