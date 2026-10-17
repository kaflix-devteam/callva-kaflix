/**
 * /compare page copy. Transcribed from the original "솔루션 비교" page.
 * Column order everywhere: Callva AI · 알바 채용 · 콜센터 외주.
 */

export const compareIntro = {
  eyebrow: '솔루션 비교',
  title: 'AI 전화응대, 직원 채용, 콜센터 중 무엇이 맞을까요?',
  desc: '반복 문의를 맡길지, 현장 업무까지 맡길지부터 나눠보세요. 운영시간·통화량·사람의 확인이 필요한 용건에 따라 선택이 달라집니다.',
}

export interface CompareOption {
  title: string
  price: string
  bullets: string[]
  dark?: boolean
}

export const compareOptions: CompareOption[] = [
  {
    title: '콜바 AI 전화응대',
    price: '월 59,000원부터',
    bullets: ['등록한 정보로 반복 문의 안내', '예약 문의·연락처 접수', '예약 확정·예외 처리는 담당자 확인'],
    dark: true,
  },
  {
    title: '직원 채용',
    price: '근무조건별 산정',
    bullets: ['전화와 현장 업무를 함께 배정', '근무시간·휴게시간 설계 필요', '채용·교육·인수인계 필요'],
  },
  {
    title: '콜센터 위탁',
    price: '업체별 견적',
    bullets: ['위탁할 업무 범위 협의', '운영시간·처리량 계약 확인', '전문 상담·기록 전달 방식 확인'],
  },
]

/** A cell is either text, or a boolean (rendered as check / x). */
export type CompareCell = string | boolean

export interface CompareRow {
  feature: string
  callva: CompareCell
  alba: CompareCell
  callcenter: CompareCell
}

export const compareTable = {
  eyebrow: '상세 비교',
  title: '어떤 범위까지 맡길 수 있나요?',
  columns: ['비교 항목', 'Callva AI', '알바 채용', '콜센터 외주'],
  note: '표의 체크는 콜바 앱 기능 여부이며, 다른 전화 시스템의 기능 유무를 뜻하지 않습니다.',
}

export const compareRows: CompareRow[] = [
  { feature: '월 비용', callva: '59,000원부터', alba: '근무조건별 산정', callcenter: '업무 범위별 견적' },
  { feature: '운영시간', callva: '설정한 응대 정책에 따름', alba: '근무표에 따름', callcenter: '계약에 따름' },
  { feature: '시작 전 준비', callva: '정보·응대 규칙·전화 연결 확인', alba: '채용·교육 일정 확인', callcenter: '계약·상담 매뉴얼 준비' },
  { feature: '콜바 앱에서 AI 안내 내용 설정', callva: true, alba: false, callcenter: false },
  { feature: '콜바 앱에서 AI 응대 내역 확인', callva: true, alba: false, callcenter: false },
  { feature: '기본 안내 변경', callva: '매장 정보·응대 규칙 설정', alba: '직원 교육·인수인계', callcenter: '위탁업체에 변경 전달' },
  { feature: '여러 전화가 겹칠 때', callva: '플랜별 동시 AI 처리 한도 확인', alba: '배치 인원·전화 시스템 확인', callcenter: '계약·시스템 한도 확인' },
  { feature: '계약·운영 조건', callva: '월 구독 조건 확인', alba: '근로조건 확인', callcenter: '위탁 계약 확인' },
  { feature: '추가 비용', callva: 'AI 처리시간 추가 상품 선택', alba: '법정 비용·추가 인력 확인', callcenter: '초과 처리량·변경 비용 확인' },
  { feature: '예약·문의 처리 범위', callva: '접수 후 확인이 필요한 건 전달', alba: '권한·교육 범위에 따름', callcenter: '위탁 계약 범위에 따름' },
]

export interface ProsCons {
  title: string
  pros: string[]
  cons: string[]
  fit: string
}

export const prosConsIntro = {
  eyebrow: '장단점',
  title: '솔직하게 비교합니다',
}

export const prosCons: ProsCons[] = [
  {
    title: 'Callva AI',
    pros: [
      '영업시간 밖 문의도 응대 정책에 맞춰 접수',
      '공개 요금 월 59,000원부터',
      '등록한 정보로 반복 문의 안내',
      '접수 내용과 통화 내역 확인',
      '직원 응대와 역할을 나눠 운영 가능',
    ],
    cons: [
      '현장 서비스·의료적 판단을 대신하지 않으며 예약 확정·예외 처리는 담당자 확인 필요',
      '플랜 한도·추가 상품 조건 확인 필요',
    ],
    fit: '반복 안내와 부재중 예약 문의 접수를 보완하려는 매장',
  },
  {
    title: '알바 채용',
    pros: ['전화와 현장 업무를 함께 배정 가능', '상황을 보고 담당자와 직접 협의', '교육·권한 범위 안에서 예외 처리'],
    cons: [
      '채용·교육·인수인계 필요',
      '근무시간 밖 응대는 별도 설계',
      '급여 외 법정 비용·운영 비용 확인',
      '동시 전화와 현장 업무의 우선순위 설계',
    ],
    fit: '전화 외 서빙·접수 등 현장 업무가 함께 필요한 매장',
  },
  {
    title: '콜센터 외주',
    pros: ['계약 범위에 맞춘 상담 조직 운영', '전문 상담 업무 위탁 검토 가능', '운영시간·인력을 계약으로 협의'],
    cons: [
      '처리량·운영시간별 견적 확인',
      '매장 정보 변경 시 전달 절차 필요',
      '예약 권한·기록 전달·연결 조건 합의',
      '매장 현장 업무는 별도 운영',
    ],
    fit: '상담 범위와 처리량을 정해 전담 응대를 위탁하려는 사업장',
  },
]

export interface CostLine {
  label: string
  value: string
}

export interface CostCard {
  title: string
  headline: string
  lines: CostLine[]
  annualLabel: string
  annual: string
  /** true → highlight the annual total (public price); false → "조건별" */
  fixed: boolean
  checks?: string[]
}

export const costIntro = {
  eyebrow: '비용 분석',
  title: '비용은 같은 업무 범위로 비교하세요',
  desc: '직원·콜센터 비용은 근무조건과 계약에 따라 달라집니다. 콜바 요금은 공개 요금표를 기준으로, 다른 선택지는 실제 견적으로 비교하세요.',
  checksTitle: '추가 확인 항목',
}

export const costCards: CostCard[] = [
  {
    title: 'Callva AI',
    headline: '59,000원',
    lines: [
      { label: '기본 요금', value: '59,000원/월' },
      { label: '추가 AI 처리시간', value: 'AI 처리시간 추가 상품 선택' },
      { label: '셀프 세팅', value: '0원' },
      { label: '콜바팀 빠른 세팅', value: '300,000원 (기본 합계에서 제외)' },
      { label: '교육 비용', value: '없음' },
      { label: '야간/주말 추가', value: '없음' },
    ],
    annualLabel: '연간 총비용',
    annual: '708,000원',
    fixed: true,
  },
  {
    title: '알바 채용',
    headline: '조건별 견적 확인',
    lines: [
      { label: '급여', value: '조건 확인' },
      { label: '법정 수당', value: '조건 확인' },
      { label: '보험·부담금', value: '조건 확인' },
      { label: '채용·교육', value: '조건 확인' },
      { label: '대체 인력', value: '조건 확인' },
    ],
    annualLabel: '연간 총비용',
    annual: '운영조건에 따라 산정',
    fixed: false,
    checks: ['근무시간·업무 범위 확정', '법정 비용 적용 여부 확인', '채용·인수인계 비용 반영', '실제 운영 전 견적·계약 검토'],
  },
  {
    title: '콜센터 외주',
    headline: '조건별 견적 확인',
    lines: [
      { label: '기본 위탁료', value: '조건 확인' },
      { label: '초과 처리량', value: '조건 확인' },
      { label: '스크립트 변경', value: '조건 확인' },
      { label: '상담원 교육', value: '조건 확인' },
      { label: '야간·주말 운영', value: '조건 확인' },
    ],
    annualLabel: '연간 총비용',
    annual: '운영조건에 따라 산정',
    fixed: false,
    checks: ['포함 처리량·초과 비용 확인', '계약 기간·해지 조건 확인', '운영시간·변경 비용 확인', '실제 운영 전 견적·계약 검토'],
  },
]

export const compareCta = {
  title: '우리 매장 문의로 응대 범위를 확인해보세요',
  desc: '데모에서 반복 안내와 문의 접수 방식을 살펴보고, 담당자 확인이 필요한 용건을 정리해보세요.',
  primary: { label: '얼마나 아낄 수 있을까? → 무료 진단', to: '/consultation' },
  secondary: { label: '도입 문의하기', to: '/contact' },
  note: '약정 없음 · 언제든 해지 가능',
  scopeNote:
    '이 페이지는 선택 기준을 설명합니다. 업체별 성능·절감 효과를 검증한 실험이 아닙니다. 표의 체크는 콜바 앱 기능 여부이며, 다른 전화 시스템의 기능 유무를 뜻하지 않습니다. 예약 확정과 예외 처리는 담당자의 권한·확인 절차를 먼저 정하세요.',
}
