/**
 * Site identity. Everything brand/legal lives here so it can be swapped in one place.
 *
 * NOTE: The layout and marketing copy mirror callva.ai, but the legal identity
 * (company name, registration numbers, address, phone, emails) is PLACEHOLDER
 * data — do not ship without replacing it with your own.
 */
export const site = {
  name: 'Callva AI',
  shortName: '콜바',
  logoText: 'Callva',
  logoSuffix: '.AI',
  title: 'Callva AI | 기업 전화 응대, AI가 끝까지 처리합니다',
  description:
    '자연스러운 AI 전화가 문의에 답하고, 복잡한 정보를 정리하고, 예약까지 확정합니다. 세팅과 튜닝은 콜바팀이 대행합니다.',
  tagline: '24시간 잠들지 않는 콜바가 대표님의 비즈니스를 지켜드립니다.',

  /** The original links to app.callva.ai; we point at a local stub page. */
  dashboardUrl: '/dashboard',
  /** The original links to status.callva.ai; we scroll to the home status section. */
  statusUrl: '/#status-section',

  company: {
    legalName: '(주)샘플컴퍼니',
    ceo: '홍길동',
    bizNo: '000-00-00000',
    mailOrderNo: '0000-서울강남-00000',
    address: '서울특별시 강남구 테헤란로 000, 0층',
    phone: '02-0000-0000',
    email: 'hello@example.com',
    privacyEmail: 'privacy@example.com',
    hours: '매일 09:00 - 24:00',
    copyright: '© 2026 Sample Company Co., Ltd. All rights reserved.',
  },

  languages: [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ],

  stats: {
    totalCalls: '60,000건+',
    totalCallsShort: '60,000+',
    aiDetectedRate: '3%',
    callsPerHour: '500콜+',
    answerSeconds: 3,
    continuity: '99.995%',
  },
} as const
