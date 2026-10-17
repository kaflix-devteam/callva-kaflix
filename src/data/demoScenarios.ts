/** Home hero "미니 Demo Lab" cards. Transcripts for the modal live in demoTranscripts.ts (home team). */
export interface DemoScenario {
  id: string
  industry: string
  outbound?: boolean
  title: string
  desc: string
}

export const demoLabIntro = {
  title: '미니 Demo Lab을 체험해보세요',
  desc: '업종을 고르면 샘플 정보와 통화 방식을 먼저 확인할 수 있습니다.',
  openLabel: '데모 열기',
}

export const demoScenarios: DemoScenario[] = [
  { id: 'restaurant', industry: '음식점', title: '단체석 문의 조건 접수해보기', desc: '인원·룸·알레르기 조건을 받고 매장 확인으로 넘깁니다' },
  { id: 'car-rental', industry: '자동차 렌트·리스', title: '렌트·리스 견적 조건 접수해보기', desc: '차종·기간·주행거리·예산을 받고 담당자 견적으로 넘깁니다' },
  { id: 'clinic', industry: '병·의원', outbound: true, title: '이전 문의 후속 연락 받아보기', desc: '문의 출처와 관심 치료를 확인하고 희망 일정만 접수합니다' },
  { id: 'professional', industry: '기업·전문상담', title: '사건 유형·기한별 담당자 넘김 테스트', desc: '지정 담당자 또는 일반 상담으로 분류해 확인 요청을 남깁니다' },
  { id: 'beauty', industry: '뷰티샵', title: '속눈썹 시술 비교·예약 요청해보기', desc: '펌·연장과 리터치 조건을 비교하고 희망 일정만 접수합니다' },
  { id: 'real-estate', industry: '분양사무소', outbound: true, title: '분양 문의 후속 연락 받아보기', desc: '지역·예산·입주 조건을 받고 방문 희망을 담당자에게 넘깁니다' },
  { id: 'construction', industry: '설치·시공', title: '철거·시공 견적 요청해보기', desc: '작업 내용·현장 주소·희망일을 접수하고 담당자가 확인 후 연락합니다' },
  { id: 'repair', industry: '정비·A/S', title: '차량·가전 수리 요청해보기', desc: '차량·가전 증상과 희망일을 접수하고 담당자가 확인 후 연락합니다' },
  { id: 'moving', industry: '이사·청소', title: '이사·입주청소 견적 요청해보기', desc: '주소·평형·희망일을 접수하고 담당자가 확인 후 연락합니다' },
  { id: 'hotel', industry: '호텔·숙박', title: '객실 예약 문의해보기', desc: '예약 문의 접수·체크인 안내·지점 연결' },
]
