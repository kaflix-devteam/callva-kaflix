/**
 * /use-cases tab content.
 * `professional` is transcribed verbatim from the original page; the other five
 * tabs are authored in the same structure and tone (no real business names).
 */
export type UseCaseIcon = 'briefcase' | 'laptop' | 'building' | 'scissors' | 'stethoscope' | 'utensils'

export interface UseCaseStat {
  value: string
  label: string
  sub: string
}

export interface UseCaseTab {
  id: string
  label: string
  icon: UseCaseIcon
  title: [string, string]
  sub: string
  paragraph: string
  stats: UseCaseStat[]
  pains: string[]
  solution: string
  testimonial: { quote: string; who: string }
}

export const useCaseTabs: UseCaseTab[] = [
  {
    id: 'professional',
    label: '전문서비스',
    icon: 'briefcase',
    title: ['상담 중에 전화 오면', '어떻게 하세요?'],
    sub: '콜바가 대신 받고, 정리해서 알려드립니다',
    paragraph:
      '고객과 상담하는데 다른 전화가 울립니다. 받자니 지금 상담이 끊기고, 안 받자니 중요한 건일 수도 있고. 변리사, 세무사, 컨설턴트... 전문직일수록 상담에 집중해야 하는데, 전화 때문에 흐름이 끊기죠.',
    stats: [
      { value: '1:1', label: '상담 방식', sub: '전화 받기 어려운 구조' },
      { value: '평균 15분', label: '상담 시간', sub: '그 사이 놓치는 전화' },
      { value: '즉시', label: '긴급 건 필요', sub: '분쟁/기한 임박 등' },
    ],
    pains: [
      '상담 중 다른 전화 오면 받을 수가 없음',
      '긴급 건인지 영업전화인지 구분 안 됨',
      '콜백하려고 메모했는데 까먹음',
      '초기 상담 문의만 해도 시간 많이 뺏김',
    ],
    solution:
      '콜바가 상담 유형과 긴급도를 파악해서 알려드립니다. 서비스 안내문이나 상담 FAQ를 업로드하면 기본 문의는 AI가 직접 응대합니다.',
    testimonial: {
      quote:
        '의뢰인 상담 중에 다른 전화 오고, 콜백하면 이미 다른 변리사 사무실에 맡겼대요. 종소세 시즌엔 하루에 전화만 50통이에요. 일을 못 해요. 이젠 중요한 것만 알림 오니까 집중할 수 있어요.',
      who: '강남 특허사무소',
    },
  },
  {
    id: 'freelancer',
    label: '프리랜서',
    icon: 'laptop',
    title: ['작업하다 전화 받으면', '흐름이 끊기죠?'],
    sub: '의뢰 문의는 콜바가 받고, 조건까지 정리해드립니다',
    paragraph:
      '디자인, 개발, 영상, 번역... 혼자 일하는 프리랜서에게 전화는 곧 작업 중단입니다. 모르는 번호는 영업전화일 수도, 새 프로젝트 의뢰일 수도 있죠. 받자니 집중이 깨지고, 안 받자니 일감을 놓칠까 불안합니다.',
    stats: [
      { value: '1인', label: '운영 인원', sub: '대신 받아줄 사람이 없음' },
      { value: '30분', label: '집중 복구 시간', sub: '한 번 끊기면 다시 몰입까지' },
      { value: '60%', label: '모르는 번호', sub: '영업전화와 의뢰가 섞임' },
    ],
    pains: [
      '작업 중 전화 오면 집중이 완전히 깨짐',
      '모르는 번호가 의뢰인지 영업인지 알 수 없음',
      '미팅 중 놓친 전화는 콜백 타이밍을 놓침',
      '견적 문의마다 같은 설명을 반복함',
    ],
    solution:
      '콜바가 의뢰 내용, 예산 범위, 희망 일정을 먼저 정리해서 알려드립니다. 작업 범위 안내문이나 포트폴리오 소개를 올려두면 기본 문의는 AI가 응대하고, 영업전화는 걸러드립니다.',
    testimonial: {
      quote:
        '작업 중에 전화 받으면 다시 집중하는 데 30분은 걸렸어요. 이제 의뢰 요약만 보고 제가 편한 시간에 회신하니까 하루가 온전히 제 거예요.',
      who: '합정동 영상 프리랜서',
    },
  },
  {
    id: 'space',
    label: '공간대여',
    icon: 'building',
    title: ['대관 문의 전화,', '하루 종일 같은 질문이죠?'],
    sub: '날짜, 인원, 시간, 가격 안내는 콜바가 처리합니다',
    paragraph:
      '스터디룸, 파티룸, 촬영 스튜디오, 연습실... 문의 내용은 거의 비슷합니다. "그날 비어 있나요?", "몇 명까지 되나요?", "시간당 얼마예요?". 현장 정리하느라 바쁜데 같은 설명을 하루 수십 번 반복하게 되죠.',
    stats: [
      { value: '80%', label: '반복 문의', sub: '예약 가능 여부·가격·인원' },
      { value: '야간·주말', label: '문의 집중 시간', sub: '퇴근 후에도 전화가 옴' },
      { value: '즉시', label: '답변 기대', sub: '늦으면 다른 공간으로' },
    ],
    pains: [
      '예약 가능 여부 문의가 하루 종일 반복됨',
      '청소·세팅 중에 전화를 받기 어려움',
      '밤늦게 오는 문의를 놓치면 예약도 놓침',
      '요금·환불 규정 설명이 매번 길어짐',
    ],
    solution:
      '콜바가 희망 날짜·인원·이용 목적을 접수하고 요금과 이용 규정을 안내합니다. 공간 소개와 요금표를 올려두면 24시간 같은 품질로 응대하고, 예약 요청은 정리해서 알려드립니다.',
    testimonial: {
      quote:
        '저녁 10시에도 대관 문의가 와요. 예전엔 다음 날 연락하면 이미 다른 데 잡았다고 하더라고요. 지금은 콜바가 밤에 받아둔 문의를 아침에 확인만 하면 됩니다.',
      who: '연남동 파티룸',
    },
  },
  {
    id: 'beauty',
    label: '미용실',
    icon: 'scissors',
    title: ['시술 중에 울리는 전화,', '손 놓고 받으셨죠?'],
    sub: '예약 접수와 가격 안내는 콜바가 대신합니다',
    paragraph:
      '염색약 바르는 중, 커트하는 중에 전화가 울립니다. 손님 앞에서 전화를 받자니 미안하고, 안 받자니 예약 손님을 놓치죠. 시술 시간, 가격, 디자이너 지명 문의는 매번 비슷한데 설명은 늘 길어집니다.',
    stats: [
      { value: '90분', label: '평균 시술 시간', sub: '그 사이 전화는 계속' },
      { value: '70%', label: '예약 문의 비중', sub: '대부분 접수 가능한 전화' },
      { value: '주말', label: '통화 집중', sub: '가장 바쁠 때 가장 많이' },
    ],
    pains: [
      '시술 중이라 전화를 받을 수 없음',
      '손님 앞에서 통화하면 서비스 흐름이 끊김',
      '가격·시술 시간 설명을 매번 반복함',
      '퇴근 후 온 예약 문의를 다음 날 놓침',
    ],
    solution:
      '콜바가 희망 날짜·시술 종류·디자이너 지명을 접수하고, 시술 가격과 소요 시간을 안내합니다. 가격표와 예약 규칙을 올려두면 바로 적용되고, 확정이 필요한 예약만 정리해서 알려드립니다.',
    testimonial: {
      quote:
        '염색 중에 전화 오면 정말 난감했어요. 이제 콜바가 예약 받아두면 시술 끝나고 확정만 해요. 손님한테 집중할 수 있어서 좋아요.',
      who: '서초동 헤어살롱',
    },
  },
  {
    id: 'clinic',
    label: '병원/약국',
    icon: 'stethoscope',
    title: ['진료 중 접수 전화,', '한 명이 다 받고 계세요?'],
    sub: '예약·접수·진료시간 안내는 콜바가 맡습니다',
    paragraph:
      '접수 데스크에 환자가 줄 서 있는데 전화는 계속 울립니다. 진료 예약, 진료 시간, 주차, 휴진 안내처럼 반복되는 문의 때문에 눈앞의 환자 응대가 늦어지죠. 약국도 마찬가지입니다. 조제 중에 "약 있어요?" 전화가 끊이지 않습니다.',
    stats: [
      { value: '60%', label: '반복 문의', sub: '진료시간·예약·위치' },
      { value: '점심·퇴근', label: '통화 폭주 시간', sub: '직원이 가장 바쁜 때' },
      { value: '1명', label: '접수 담당', sub: '전화와 창구를 동시에' },
    ],
    pains: [
      '창구 응대 중 전화를 동시에 받기 어려움',
      '진료시간·휴진 문의가 하루 수십 통',
      '예약 변경·취소 전화를 놓치면 노쇼로 이어짐',
      '점심시간과 퇴근 직전에 전화가 몰림',
    ],
    solution:
      '콜바가 진료 예약 희망 일시와 연락처를 접수하고, 진료시간·위치·주차 같은 안내를 대신합니다. 진단이나 처방 같은 의료적 판단은 하지 않고, 확인이 필요한 건은 의료진에게 연결하거나 콜백으로 정리합니다.',
    testimonial: {
      quote:
        '접수 직원이 전화 받느라 창구가 밀리는 게 늘 고민이었어요. 콜바가 예약 전화를 받아주니까 데스크가 훨씬 차분해졌어요. 예약 변경도 빠짐없이 기록돼요.',
      who: '마포구 내과의원',
    },
  },
  {
    id: 'restaurant',
    label: '음식점',
    icon: 'utensils',
    title: ['피크타임 예약 전화,', '주방에서 받으셨죠?'],
    sub: '예약·단체석·메뉴 문의는 콜바가 받습니다',
    paragraph:
      '점심 피크에 주문이 밀리는데 전화가 울립니다. "오늘 저녁 4명 되나요?", "단체석 있어요?", "주차 되나요?". 홀도 주방도 손이 모자란데 전화까지 받다 보면 음식도 서비스도 늦어집니다. 영업시간 외에 오는 예약 전화는 그냥 놓치고요.',
    stats: [
      { value: '12~13시', label: '통화 집중 시간', sub: '주문이 가장 밀리는 때' },
      { value: '주 5건', label: '놓친 예약', sub: '영업시간 외·피크타임' },
      { value: '하루 10통', label: '영업전화', sub: '식자재·포스기·광고' },
    ],
    pains: [
      '피크타임에 전화를 받을 손이 없음',
      '브레이크타임·마감 후 예약 전화를 놓침',
      '단체 예약은 인원·메뉴 조율이 길어짐',
      '식자재·포스기 영업전화가 하루 10통',
    ],
    solution:
      '콜바가 날짜·인원·시간을 접수하고 메뉴, 주차, 영업시간을 안내합니다. 메뉴판과 예약 규칙을 올려두면 바로 적용되고, 단체 예약처럼 조율이 필요한 건만 콜백으로 정리해드립니다. 영업전화는 자동으로 걸러드립니다.',
    testimonial: {
      quote:
        '점심 장사 중에 전화 받으면 주문이 꼬였어요. 지금은 콜바가 예약 받아두고 저는 마감 후에 확인만 해요. 영업전화가 사라진 것만으로도 살 것 같아요.',
      who: '망원동 파스타집',
    },
  },
]

/** The original "다른 업종도 가능합니다" grid shows these 7 slugs (+ a "모든 사례 보기" tile). */
export const useCaseOtherSlugs = ['cafe', 'fitness', 'pet', 'academy', 'auto', 'professional', 'freelancer'] as const

export const useCaseCta = {
  demo: { label: '내 비즈니스용 AI 전화 들어보기', to: '/#demo-section' },
  consult: { label: '하루에 전화 몇 통 오세요? → 무료 진단', to: '/consultation' },
}
