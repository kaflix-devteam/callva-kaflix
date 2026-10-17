import type { Component } from 'vue'
import {
  PhoneOutgoing, Layers, HardDrive, CalendarCheck, Building2, PenLine, Webhook, ShieldCheck,
} from 'lucide-vue-next'

export interface Expansion {
  title: string
  desc: string
  icon: Component
}

export const expansionsIntro = {
  eyebrow: '문의로 확장',
  title: '더 필요한 운영은 상담에서 맞춥니다.',
  desc: '기본 패키지에 억지로 끼워 넣지 않고, 회사 상황에 맞춰 필요한 범위만 견적화합니다.',
  pricingEyebrow: '문의 항목',
  pricingTitle: '기본에 넣지 않는 것들. 필요할 때만 맞춥니다.',
  pricingDesc: '아래 항목은 업장마다 필요한 범위가 크게 달라 상담 후 구성합니다. 예시를 보고 필요한 항목만 문의해 주세요.',
}

export const expansions: Expansion[] = [
  { icon: PhoneOutgoing, title: '아웃바운드 전화', desc: '재방문 안내, 예약 확인, 캠페인성 발신.\n대상 명단은 엑셀·CSV로 올리고 통화 결과는 리포트로 내려받습니다.' },
  { icon: Layers, title: '추가 동시 AI 처리', desc: '문의 폭주, 캠페인 기간, 다지점 운영처럼\nScale의 동시 AI 처리 5건을 넘는 처리량이 필요한 경우' },
  { icon: HardDrive, title: '녹음본 추가 저장', desc: '상담 품질 확인이나 분쟁 대비를 위해\n6개월 이상 녹음본 보관이 필요한 경우' },
  { icon: CalendarCheck, title: '고급 예약 연동', desc: '담당자별 스케줄, 룸 또는 장비 배정,\n노쇼 및 예약금과 같은 특수 규칙 적용이 필요한 경우' },
  { icon: Building2, title: '다지점 운영', desc: '지점별 안내 내용, 담당자, 예약 가능 시간,\n주제별 담당자를 나눠야 하는 경우' },
  { icon: PenLine, title: '맞춤 프롬프트 제작', desc: '조직별 말투, 고도화된 세일즈 응대, 1차 상담 등\n프롬프트 품질을 더 촘촘하게 잡는 작업' },
  { icon: Webhook, title: '외부 시스템 연동', desc: '통화 결과를 사내 시스템으로 넘기는 연동을\n사업장별로 구성합니다 (웹훅·API 연동 문의).' },
  { icon: ShieldCheck, title: '엔터프라이즈 보안', desc: '전용 접근 권한, 감사 로그, 데이터 보관 정책,\n민감정보 처리 기준이 필요한 경우' },
]
