import { site } from './site'

export interface NavLink {
  label: string
  to: string
  external?: boolean
}

export const mainNav: NavLink[] = [
  { label: '기능 소개', to: '/features' },
  { label: '활용 사례', to: '/use-cases' },
  { label: '요금 안내', to: '/pricing' },
  { label: '회사 소개', to: '/about' },
]

export const headerCta = {
  consult: { label: '얼마나 아낄 수 있을까?', to: '/consultation' },
  dashboard: { label: '대시보드 로그인', to: site.dashboardUrl },
}

export interface FooterGroup {
  title: string
  links: NavLink[]
}

export const footerGroups: FooterGroup[] = [
  {
    title: '제품',
    links: [
      { label: '기능 소개', to: '/features' },
      { label: '도입 비용', to: '/pricing' },
      { label: '솔루션 비교', to: '/compare' },
      { label: '활용 사례', to: '/use-cases' },
      { label: '대시보드 바로가기 ↗', to: site.dashboardUrl },
    ],
  },
  {
    title: '업종별 안내',
    links: [
      { label: '카페/베이커리', to: '/for/cafe' },
      { label: '음식점/식당', to: '/for/restaurant' },
      { label: '미용실/네일샵', to: '/for/beauty' },
      { label: '병원/의원', to: '/for/clinic' },
      { label: '헬스/피트니스', to: '/for/fitness' },
      { label: '전체 업종 보기 →', to: '/use-cases' },
    ],
  },
  {
    title: '지원',
    links: [
      { label: '무료 진단', to: '/consultation' },
      { label: '자주 묻는 질문', to: '/faq' },
      { label: '도입 문의', to: '/contact' },
      { label: '회사 소개', to: '/about' },
      { label: '서비스 상태', to: site.statusUrl },
    ],
  },
  {
    title: '법적 고지',
    links: [
      { label: '이용약관', to: '/terms' },
      { label: '개인정보처리방침', to: '/privacy' },
    ],
  },
]
