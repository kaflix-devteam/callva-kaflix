/**
 * /about page copy. Marketing copy is transcribed from the original; the team
 * block is deliberately a placeholder (no real person is reproduced).
 */
import { site } from './site'

export const aboutHero = {
  eyebrow: 'ABOUT CALLVA',
  title: 'AI 기술로 비즈니스의\n전화 응대 문제를\n해결합니다',
  desc: 'Callva는 6만콜 이상의 실제 통화와 여러 업종의 운영 경험을 바탕으로, 전화 응대·연결·기록·개선을 하나의 Closed Loop로 운영합니다. 외부 시스템 연동과 99.995% 무중단 기준까지 고려해 사업장 전화 운영을 제품으로 만듭니다.',
}

export interface AboutStat {
  index: string
  value: string
  label: string
  sub: string
  icon: 'phone' | 'briefcase' | 'network' | 'activity'
}

export const aboutStats: AboutStat[] = [
  { index: '01', value: site.stats.totalCallsShort, label: '실제 누적 통화', sub: '테스트 대본이 아니라 실제 고객 응대에서 쌓은 운영 데이터', icon: 'phone' },
  { index: '02', value: '다업종', label: '업종별 플레이북', sub: '병원, 뷰티, 식당, 전문직까지 다른 말투와 규칙을 경험', icon: 'briefcase' },
  { index: '03', value: '다수 연동', label: '외부 시스템 경험', sub: '예약, 고객관리, 알림, 운영 도구를 전화 응대 흐름에 연결', icon: 'network' },
  { index: '04', value: site.stats.continuity, label: '무중단 기준', sub: '연결, 전환, 기록, 권한 관리까지 끊기지 않는 운영을 목표로 설계', icon: 'activity' },
]

export const aboutConsole = {
  eyebrow: 'LIVE OPERATIONS',
  title: '통화 운영 콘솔',
  status: '운영 정상',
  value: site.stats.continuity,
  valueLabel: 'CONTINUITY TARGET',
  steps: ['3초 안에 수신', '고객 의도와 감정 파악', '응대, 예약, 담당자 연결', '통화 평가와 매뉴얼 개선'],
}

export const aboutTech = {
  eyebrow: '기술',
  title: '실전 운영으로 검증한 통화 AI',
  desc: '6만콜+ 실제 통화, 다업종 플레이북, 외부 시스템 연동, 99.995% 무중단 기준을 하나의 운영 체계로 묶었습니다.',
  proofs: [
    { index: '01', title: '6만콜+ 실전 데이터', desc: '병원, 뷰티, 식당, 전문직 등 여러 업종의 실제 통화 패턴을 응대 기준에 반영' },
    { index: '02', title: 'Closed Loop 운영', desc: '통화 기록을 평가하고 매뉴얼과 프롬프트를 개선해 다음 응대에 다시 반영' },
    { index: '03', title: '99.995% 무중단 기준', desc: '전화 연결, 담당자 전환, 기록 보관, 권한 관리를 끊김 없이 운영하도록 설계' },
  ],
}

export const aboutLoop = {
  eyebrow: 'Closed Loop',
  title: '통화할수록 운영 기준이 더 단단해집니다',
  desc: '콜바는 전화를 받고 끝내는 자동응답기가 아닙니다. 이전 통화를 평가하고, 매뉴얼과 프롬프트를 개선하고, 다음 응대에 다시 반영하는 운영 루프로 품질을 쌓습니다.',
  cardTitle: '운영 안정성 기준',
  bullets: [
    '시간당 500콜 이상 병렬 처리를 고려한 운영 구조',
    '담당자 전환 중에도 통화를 끊지 않는 연결 흐름',
    '녹음, 권한, VIP 규칙을 분리해 관리하는 운영 기준',
    '업종별 예외 상황을 매뉴얼과 프롬프트에 계속 반영',
  ],
}

/** Placeholder team member — the original shows a real founder; we don't reproduce that. */
export const aboutTeam = {
  eyebrow: 'Team',
  title: '팀 소개',
  member: {
    initials: 'CA',
    name: '대표 (이름 비공개)',
    role: 'Founder & CEO',
    company: site.company.legalName,
    summary: 'Callva - 실제 통화로 검증한 AI 전화 운영 제품',
    bio: [
      '전화는 고객이 가장 익숙하게 쓰는 소통 도구이지만, 사업장에서는 가장 놓치기 쉬운 채널이기도 합니다. 바쁜 현장에서 울리는 전화를 AI가 끝까지 받아내면 사람은 사람이 해야 할 일에 집중할 수 있다고 믿습니다.',
      '음성 AI, 보안, 에이전트 제품을 다뤄온 경험을 바탕으로, 사업장 전화 운영을 매일 평가하고 개선되는 시스템으로 만들고 있습니다.',
    ],
    tags: ['Voice AI', '보안 연구', 'AI Agent 제품'],
  },
}

export const aboutCta = {
  title: '직접 체험해보세요',
  desc: 'Callva가 어떻게 작동하는지 직접 테스트해보실 수 있습니다.',
  demo: { label: '데모 체험하기', to: '/#demo-section' },
  dashboard: { label: '대시보드 보기', to: site.dashboardUrl },
}
