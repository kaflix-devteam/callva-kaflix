# Callva AI 클론 (Vue 3)

[callva.ai](https://callva.ai) — 한국어 AI 전화 응대 SaaS 랜딩 사이트 — 의 레이아웃과 카피를 참고해 만든 **Vue 3 클론**입니다.
학습·프로토타입 목적의 프로젝트이며, 실제 서비스나 상업적 용도로 배포하기 위한 것이 아닙니다.

> **플레이스홀더 안내**
> - 브랜드·법적 주체 정보(회사명, 사업자번호, 주소, 전화, 이메일 등)는 `src/data/site.ts`의 **샘플 값**입니다. 실제 사용 전 반드시 교체하세요.
> - 고객사 로고, 인물, 후기, 수치 등은 모두 **더미 데이터**입니다.
> - `/terms`, `/privacy`의 약관 문구(`src/data/legal.ts`)는 **샘플 약관**이며 법률 검토를 거치지 않았습니다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프론트엔드 | Vite 8 · Vue 3.5 (`<script setup lang="ts">`) · TypeScript (strict) · vue-router 4 |
| 스타일 | Tailwind CSS v4 (`@tailwindcss/vite`) · `lucide-vue-next` 아이콘 |
| API 서버 | Node.js (ESM) · Express 5 · cors — 추가 의존성 없음 |
| 저장소 | JSON 파일 (`server/data/*.json`, 원자적 쓰기) |

경로 별칭 `@` → `src/`.

## 시작하기

```bash
npm install
npm run dev        # 웹(5173) + API(3001) 동시 실행
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | Vite 개발 서버(http://localhost:5173)와 API 서버(http://localhost:3001)를 `concurrently`로 함께 실행합니다. Vite가 `/api`를 3001로 프록시합니다. |
| `npm run dev:web` / `npm run dev:api` | 둘 중 하나만 실행 |
| `npm run typecheck` | `vue-tsc -b` 타입 검사 |
| `npm run build` | 타입 검사 후 `dist/` 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 (Vite) |
| `npm start` | **프로덕션 모드**: `NODE_ENV=production`으로 API 서버를 띄우고 `dist/`를 정적 서빙 + SPA 폴백 (`PORT` 환경변수, 기본 3001) |

```bash
npm run build && npm start   # http://localhost:3001 에서 전체 사이트 + API
```

## API 엔드포인트

클라이언트 계약은 `src/lib/api.ts`가 단일 기준이며, `server/index.mjs`가 이를 그대로 구현합니다.

| 메서드 | 경로 | 설명 | 응답 |
| --- | --- | --- | --- |
| `GET` | `/api/health` | 헬스체크 | `{ ok, uptimeSec, now }` |
| `GET` | `/api/status-page` | 서비스 상태 (모의 데이터, 응답시간 지터) | `StatusPage` — `overall`, `uptime24h`, `services[]` … |
| `POST` | `/api/contact` | 도입 문의 접수 (`ContactPayload`) | `201 { ok, id, receivedAt }` / `400 { error, fields }` |
| `POST` | `/api/consultation` | 무료 진단 결과 저장 (`ConsultationPayload`) | `201 { ok, id, receivedAt }` / `400 { error, fields }` |
| `GET` | `/api/submissions?type=contact\|consultation` | 접수 내역 조회 (최신 50건, **개발 모드 전용** — 프로덕션에서는 404) | `{ type, count, items[] }` |

- 알 수 없는 `/api/*` 요청은 JSON 404, 모든 오류는 JSON으로 응답하며 프로덕션에서는 스택을 노출하지 않습니다.
- 요청 본문 크기 제한 100KB.
- `POST /api/contact` 검증 규칙: `name` 1~50자 필수, `phone` `0\d{1,2}-?\d{3,4}-?\d{4}` 형식 필수, `privacyAgreed === true`, 선택 문자열 2,000자 이하.

```bash
curl -X POST http://localhost:3001/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"홍길동","phone":"010-1234-5678","privacyAgreed":true,"wantsAiCall":false,"source":"contact"}'
```

### 접수 데이터 저장 위치

| 종류 | 파일 |
| --- | --- |
| 도입 문의 | `server/data/contacts.json` |
| 무료 진단 | `server/data/consultations.json` |

JSON 배열 파일이며 첫 요청 시 자동 생성됩니다(임시 파일 + rename으로 원자적 기록, 파일별 쓰기 직렬화). `.gitignore`에 포함되어 커밋되지 않습니다. 각 레코드에는 `id`(`ct_…` / `cs_…`), `receivedAt`, 검증을 통과한 필드, 요청 `ip`, `userAgent`가 저장됩니다.

## 페이지 목록

| 경로 | 페이지 |
| --- | --- |
| `/` | 홈 |
| `/features` | 기능 소개 |
| `/use-cases` (`/cases` → 리다이렉트) | 활용 사례 |
| `/pricing` | 요금 안내 |
| `/compare` | 솔루션 비교 |
| `/about` | 회사 소개 |
| `/faq` | 자주 묻는 질문 |
| `/for/:slug` | 업종별 안내 |
| `/consultation` | 무료 진단 — 6개 질문 → 예상 손실·추천 플랜 |
| `/contact` | 도입 문의 및 상담 (상담 신청서) |
| `/dashboard` | 대시보드 로그인 스텁 (원본은 app.callva.ai) |
| `/terms`, `/privacy` | 이용약관 · 개인정보처리방침 (샘플) |
| `*` | 404 |

### 무료 진단 계산식 (`src/data/consultation.ts`)

```
monthlyCalls     = dailyCalls × 26
missedCalls      = round(monthlyCalls × missedRatio × afterHoursMultiplier)
estimatedLossKrw = missedCalls × avgCallValueKrw(업종별)
plan             = recommendPlan(monthlyCalls, avgMinutes)   // src/data/plans.ts
netKrw           = estimatedLossKrw − plan.price
```

모든 계산은 순수 함수(`computeEstimate`, `buildInsights`, `toConsultationPayload`)로 분리되어 있어 Vue 없이 테스트할 수 있습니다.

## 프로젝트 구조

```
src/
  components/   layout(헤더·푸터) · ui(버튼·폼·카드) · contact · consultation
  data/         site.ts(브랜드·법적 주체) · plans.ts · consultation.ts · legal.ts …
  lib/          api.ts(API 계약) · ui.ts(Tailwind 클래스 레시피)
  pages/        라우트별 페이지
  router/       vue-router 설정
server/
  index.mjs     Express 5 앱
  lib/          validate.mjs(요청 검증) · store.mjs(JSON 파일 저장소)
  data/         접수 데이터 (git 제외)
```
