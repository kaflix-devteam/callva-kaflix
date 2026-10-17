/**
 * Sample legal documents for /terms and /privacy.
 *
 * These are GENERIC PLACEHOLDER texts written for this clone. They reference the
 * placeholder identity in `site.company` and must be reviewed by a lawyer and
 * rewritten before any real deployment.
 */
import { site } from './site'

export interface LegalSection {
  heading: string
  body: string[]
}

export interface LegalDoc {
  slug: 'terms' | 'privacy'
  eyebrow: string
  title: string
  /** ISO date (YYYY-MM-DD) */
  updatedAt: string
  intro: string
  sections: LegalSection[]
  contactEmail: string
}

export const legalNotice = '이 문서는 샘플 약관입니다. 실제 서비스 적용 전 법률 검토가 필요합니다.'

export function formatLegalDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

const company = site.company.legalName
const service = site.name

export const termsDoc: LegalDoc = {
  slug: 'terms',
  eyebrow: '법적 고지',
  title: '이용약관',
  updatedAt: '2026-10-01',
  intro: `본 약관은 ${company}(이하 "회사")가 제공하는 ${service} 전화 응대 서비스(이하 "서비스")의 이용 조건과 절차, 회사와 이용자의 권리·의무 및 책임 사항을 규정합니다.`,
  contactEmail: site.company.email,
  sections: [
    {
      heading: '제1조 (목적)',
      body: [
        '이 약관은 회사가 운영하는 서비스를 이용함에 있어 회사와 이용자 간의 권리, 의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.',
      ],
    },
    {
      heading: '제2조 (용어의 정의)',
      body: [
        '"이용자"란 이 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 사업자 또는 개인을 말합니다.',
        '"플랜"이란 월 AI 음성처리 분량, 동시 처리 건수, 녹음 보관 기간 등 서비스 제공 범위를 정한 요금 상품을 말합니다.',
      ],
    },
    {
      heading: '제3조 (약관의 효력 및 변경)',
      body: [
        '이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.',
        '회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경 사유를 명시하여 적용일 7일 전부터 공지합니다.',
      ],
    },
    {
      heading: '제4조 (서비스의 제공 및 변경)',
      body: [
        '회사는 AI 전화 응대, 통화 녹음·전사, 예약 접수, 대시보드 등 서비스를 제공하며, 운영상·기술상 필요에 따라 서비스 내용을 변경할 수 있습니다.',
        '서비스는 연중무휴 24시간 제공을 원칙으로 하되, 시스템 점검 등 불가피한 경우 사전 공지 후 일시 중단될 수 있습니다.',
      ],
    },
    {
      heading: '제5조 (이용요금 및 결제)',
      body: [
        '이용요금은 이용자가 선택한 플랜의 월 요금(부가세 별도)으로 하며, 1개월·3개월·12개월 단위로 결제할 수 있습니다.',
        '플랜에 포함된 월 AI 음성처리 분량을 초과한 경우 이용자는 AI 처리시간 추가 상품을 구매하여 사용할 수 있습니다.',
      ],
    },
    {
      heading: '제6조 (계약 해지 및 환불)',
      body: [
        '서비스에는 별도의 약정 기간이 없으며 이용자는 언제든지 해지를 요청할 수 있습니다.',
        '3개월·12개월 결제 상품의 중도 해지 시 이미 사용한 개월 수를 정가 기준으로 공제하고, 잔액의 10%를 위약금으로 공제한 후 환불합니다.',
      ],
    },
    {
      heading: '제7조 (이용자의 의무)',
      body: [
        '이용자는 서비스에 연결하는 전화번호와 응대 시나리오에 대한 정당한 권한을 보유해야 하며, 통화 녹음 사실을 고객에게 안내할 책임이 있습니다.',
        '이용자는 서비스를 이용하여 타인의 권리를 침해하거나 관련 법령에 위반되는 행위를 해서는 안 됩니다.',
      ],
    },
    {
      heading: '제8조 (책임의 제한)',
      body: [
        'AI 응대 결과는 통화 내용과 설정에 따라 달라질 수 있으며, 회사는 AI가 안내한 정보의 완전성이나 예약 성사 여부를 보증하지 않습니다.',
        '회사는 천재지변, 통신사 장애 등 회사의 합리적인 통제 범위를 벗어난 사유로 발생한 손해에 대하여 책임을 지지 않습니다.',
      ],
    },
  ],
}

export const privacyDoc: LegalDoc = {
  slug: 'privacy',
  eyebrow: '법적 고지',
  title: '개인정보처리방침',
  updatedAt: '2026-10-01',
  intro: `${company}(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며, 정보주체의 개인정보를 보호하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.`,
  contactEmail: site.company.privacyEmail,
  sections: [
    {
      heading: '1. 수집하는 개인정보 항목',
      body: [
        '도입 문의 및 상담 신청 시 성함, 연락처(필수)와 매장명, 업종, 문의 내용, 유입 경로(선택)를 수집합니다.',
        '서비스 이용 과정에서 접속 IP, 브라우저 정보, 접수 시각이 자동으로 생성되어 저장될 수 있습니다. 무료 진단 페이지에서는 개인정보를 수집하지 않습니다.',
      ],
    },
    {
      heading: '2. 개인정보의 수집 및 이용 목적',
      body: [
        '수집한 개인정보는 상담 신청에 대한 회신, 서비스 도입 안내, 계약 체결 및 이행, 고객 문의 대응 목적으로만 이용합니다.',
      ],
    },
    {
      heading: '3. 개인정보의 보유 및 이용 기간',
      body: [
        '상담 신청 정보는 목적 달성 후 1년간 보관한 뒤 지체 없이 파기합니다. 다만 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.',
      ],
    },
    {
      heading: '4. 개인정보의 제3자 제공',
      body: [
        '회사는 정보주체의 동의가 있거나 법령에 특별한 규정이 있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.',
      ],
    },
    {
      heading: '5. 개인정보 처리의 위탁',
      body: [
        '회사는 서비스 운영을 위해 클라우드 호스팅, 통신 중계 등 업무를 외부 업체에 위탁할 수 있으며, 위탁 시 수탁자와 처리 목적·기간을 공개합니다.',
      ],
    },
    {
      heading: '6. 통화 녹음 및 전사 데이터의 처리',
      body: [
        'AI 응대 통화는 품질 관리와 이용자 확인을 위해 녹음·전사되며, 이용자가 선택한 플랜의 보관 기간(1개월·6개월·1년) 경과 후 자동 삭제됩니다.',
        '이용자는 대시보드에서 개별 녹음을 즉시 삭제할 수 있습니다.',
      ],
    },
    {
      heading: '7. 정보주체의 권리와 행사 방법',
      body: [
        '정보주체는 언제든지 개인정보 열람, 정정·삭제, 처리정지를 요구할 수 있으며, 회사는 지체 없이 조치합니다.',
      ],
    },
    {
      heading: '8. 개인정보 보호책임자',
      body: [
        `개인정보 보호책임자: ${site.company.ceo} (${company}) · 문의: ${site.company.privacyEmail}`,
        '정보주체는 서비스 이용 중 발생한 모든 개인정보 보호 관련 문의, 불만, 피해 구제를 위 연락처로 요청할 수 있습니다.',
      ],
    },
  ],
}
