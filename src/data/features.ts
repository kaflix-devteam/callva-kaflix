/**
 * Static mock data for the /features page dashboard widgets.
 * Every row/number here is transcribed from the original callva.ai features page
 * unless noted (the weekly trend bars were not in the text extraction and are invented).
 */

/* ---------- top feature cards ---------- */
export interface FeatureCard {
  icon: 'clock' | 'shield' | 'brain'
  title: string
  desc: string
}

export const featureCards: FeatureCard[] = [
  { icon: 'clock', title: '24시간 응대', desc: '새벽이든 주말이든, AI가 모든 전화를 받습니다. 놓치는 기회가 없습니다.' },
  { icon: 'shield', title: '스팸 자동 차단', desc: '영업 전화와 광고는 AI가 판단해서 알아서 거절합니다.' },
  { icon: 'brain', title: '학습하는 AI', desc: '사용할수록 똑똑해집니다. 매뉴얼 업로드만으로 자동 학습됩니다.' },
]

/* ---------- 통화 기록 ---------- */
export type CallCategory = '예약/주문' | '일반 문의' | '콜백 필요'

export interface CallLog {
  id: number
  time: string
  duration: string
  phone: string
  category: CallCategory
  summary: string
}

export const callLogs: CallLog[] = [
  { id: 1, time: '14:32', duration: '2분 15초', phone: '010-4532-1234', category: '예약/주문', summary: '주말 4인 예약 문의 - 토요일 저녁 6시 테이블 가능 여부 확인' },
  { id: 2, time: '14:18', duration: '1분 32초', phone: '010-3214-5678', category: '일반 문의', summary: '런치 세트 가격 문의 - 8,900원 런치 메뉴 안내 완료' },
  { id: 3, time: '13:45', duration: '3분 22초', phone: '010-8765-9012', category: '콜백 필요', summary: '대규모 단체 예약 문의 (50명) - 담당자 콜백 예약' },
  { id: 4, time: '12:58', duration: '1분 48초', phone: '010-2341-3456', category: '일반 문의', summary: '주차 가능 여부 및 위치 안내 - 건물 지하 1층 주차장 이용 가능' },
  { id: 5, time: '12:30', duration: '54초', phone: '02-532-7890', category: '일반 문의', summary: '영업시간 확인 - 평일 11시~22시, 주말 10시~23시 안내' },
  { id: 6, time: '11:52', duration: '2분 10초', phone: '010-9876-2468', category: '일반 문의', summary: '특별 메뉴 문의 - 계절 한정 메뉴 안내 및 가격 설명' },
  { id: 7, time: '11:20', duration: '1분 45초', phone: '010-6543-1357', category: '예약/주문', summary: '내일 저녁 8시 2인 예약 - 창가 자리 요청, 예약 확정' },
  { id: 8, time: '10:45', duration: '1분 25초', phone: '010-1122-8642', category: '일반 문의', summary: '네이버 예약 취소 방법 문의 - 마이페이지 예약 내역에서 취소 안내' },
  { id: 9, time: '10:15', duration: '2분 55초', phone: '010-7788-9753', category: '콜백 필요', summary: '단체 예약 세부 조정 필요 - 메뉴 구성 및 가격 협의 필요' },
  { id: 10, time: '09:48', duration: '3분 15초', phone: '010-3399-1593', category: '예약/주문', summary: '생일 파티 예약 문의 - 케이크 준비 가능, 예약 확정' },
]

export const callLogFilters: { id: 'all' | CallCategory; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: '콜백 필요', label: '콜백 필요' },
  { id: '예약/주문', label: '예약/주문' },
  { id: '일반 문의', label: '일반 문의' },
]

export const callLogStats = [
  { label: 'AI 처리율', value: '80%' },
  { label: '평균 통화 시간', value: '2분 10초' },
  { label: '콜백 대기', value: '2건' },
]

/* ---------- VIP 번호 관리 ---------- */
export interface VipRow {
  phone: string
  label: string
  mode: string
  registeredAt: string
  expiresAt: string
}

export const vipRows: VipRow[] = [
  { phone: '010-1234-5678', label: 'VIP', mode: '무조건 대표', registeredAt: '1월 20일 오후 02:30', expiresAt: '영구' },
  { phone: '010-9876-5432', label: '단골', mode: '무조건 대표', registeredAt: '1월 18일 오전 09:15', expiresAt: '영구' },
  { phone: '010-5555-1234', label: '거래처', mode: '영업시간 대표', registeredAt: '1월 15일 오후 04:45', expiresAt: '영구' },
  { phone: '010-7777-8888', label: '가족', mode: '무조건 대표', registeredAt: '1월 12일 오전 11:20', expiresAt: '영구' },
  { phone: '010-3333-4444', label: '협력사', mode: '영업시간 대표', registeredAt: '1월 10일 오후 01:50', expiresAt: '영구' },
]

/* ---------- 차단번호 관리 ---------- */
export interface SpamRow {
  phone: string
  reason: string
  blockedAt: string
  expiresAt: string
  /** "3회" or "-" */
  retries: string
}

export const spamRows: SpamRow[] = [
  { phone: '010-1234-5678', reason: '광고전화 - 부동산 투자 권유', blockedAt: '1월 20일 오후 02:30', expiresAt: '영구', retries: '3회' },
  { phone: '010-9876-5432', reason: '반복악성문의 - 욕설 및 협박', blockedAt: '1월 18일 오전 09:15', expiresAt: '2월 18일 오전 09:15', retries: '7회' },
  { phone: '010-5555-1234', reason: '스팸 - 대출 안내 반복', blockedAt: '1월 15일 오후 04:45', expiresAt: '영구', retries: '-' },
  { phone: '010-7777-8888', reason: '광고전화 - 보험 판매', blockedAt: '1월 12일 오전 11:20', expiresAt: '2월 12일 오전 11:20', retries: '2회' },
  { phone: '010-3333-4444', reason: '스팸 - 미확인 번호 반복 전화', blockedAt: '1월 10일 오후 01:50', expiresAt: '영구', retries: '5회' },
]

/* ---------- 전화 응대 모드 ---------- */
export interface RadioOption {
  id: string
  title: string
  desc: string
}

export const answerModeOptions: RadioOption[] = [
  { id: 'ai-first', title: 'AI 먼저 응대 (권장)', desc: 'AI가 전화를 받고 응대해요. 필요시 대표님께 연결해요.' },
  { id: 'owner-first', title: '대표님 먼저 연결', desc: '대표님께 먼저 연결을 시도해요. 연결 안 되면 AI가 용건을 받아요.' },
]

export const availabilityOptions: RadioOption[] = [
  { id: 'always', title: '항상 연결 가능', desc: '언제든 대표님께 연결할 수 있어요' },
  { id: 'business-hours', title: '영업시간만 연결', desc: '영업시간에만 대표님께 연결해요' },
  { id: 'ai-only', title: 'AI만 응대', desc: 'AI가 응대하고 대표님께 연결하지 않아요' },
]

/* ---------- 체계적 학습 ---------- */
export const learningProgress = 87

export interface KnowledgeCategory {
  name: string
  done: number
  total: number
}

export const knowledgeCategories: KnowledgeCategory[] = [
  { name: '메뉴/제품 정보', done: 128, total: 150 },
  { name: '가격 정보', done: 45, total: 45 },
  { name: '영업 정책', done: 23, total: 30 },
  { name: '예약 규칙', done: 18, total: 25 },
  { name: '자주 묻는 질문', done: 42, total: 50 },
]

export interface LearningActivity {
  text: string
  when: string
  status: 'done' | 'updated' | 'processing'
}

export const learningActivities: LearningActivity[] = [
  { text: '주말 브런치 메뉴 가격표 학습 완료', when: '3분 전', status: 'done' },
  { text: '단체 예약 정책 업데이트', when: '15분 전', status: 'updated' },
  { text: '시즌 메뉴 사진 분석 중', when: '1시간 전', status: 'processing' },
]

/* ---------- 분석 & 인사이트 ---------- */
export interface Kpi {
  label: string
  value: number
  decimals: number
  unit: string
  delta: string
  /** true when the delta is an improvement (drives the chip colour) */
  positive: boolean
}

export const kpis: Kpi[] = [
  { label: '총 통화', value: 1284, decimals: 0, unit: '건', delta: '+12.3%', positive: true },
  { label: 'AI 처리율', value: 80, decimals: 0, unit: '%', delta: '+2.1%', positive: true },
  { label: '평균 통화 시간', value: 2.1, decimals: 1, unit: '분', delta: '-15%', positive: true },
  { label: '고객 만족도', value: 4.8, decimals: 1, unit: '/5.0', delta: '', positive: true },
]

/** Weekly trend (invented — the original only exposed day labels). Values are call counts. */
export interface TrendDay {
  day: string
  ai: number
  manual: number
}

export const weeklyTrend: TrendDay[] = [
  { day: '월', ai: 142, manual: 38 },
  { day: '화', ai: 158, manual: 41 },
  { day: '수', ai: 171, manual: 36 },
  { day: '목', ai: 165, manual: 44 },
  { day: '금', ai: 198, manual: 52 },
  { day: '토', ai: 236, manual: 47 },
  { day: '일', ai: 204, manual: 35 },
]

export interface CallTypeShare {
  label: string
  percent: number
  color: string
}

export const callTypeShares: CallTypeShare[] = [
  { label: '예약 문의', percent: 45, color: '#44403c' },
  { label: '가격 문의', percent: 25, color: '#57534e' },
  { label: '위치/영업시간', percent: 15, color: '#78716c' },
  { label: '기타', percent: 15, color: '#a8a29e' },
]

/** Calls per hour, index 0 = 00시 … 23 = 23시 */
export const hourlyCalls: number[] = [5, 3, 2, 1, 1, 2, 8, 15, 22, 38, 45, 62, 78, 55, 42, 35, 48, 65, 88, 95, 72, 45, 28, 12]

export interface PerfMetric {
  label: string
  value: number
  decimals: number
  unit: string
  icon: 'target' | 'zap' | 'trending-down'
}

export const perfMetrics: PerfMetric[] = [
  { label: '정확도', value: 97, decimals: 0, unit: '%', icon: 'target' },
  { label: '응답 시간', value: 2.8, decimals: 1, unit: '초', icon: 'zap' },
  { label: '이탈률 감소', value: 35, decimals: 0, unit: '%', icon: 'trending-down' },
]
