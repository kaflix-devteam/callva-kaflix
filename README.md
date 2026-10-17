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
| `npm run tunnel` | GPU 음성 모델 서버로 SSH 터널만 연결 (아래 [GPU 음성 모델 연동](#gpu-음성-모델-연동-실제-ai-통화-데모) 참고) |
| `npm run dev:voice` | `npm run dev` + SSH 터널을 한 번에 실행 (실제 AI 통화 데모용) |

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
- 요청 본문 크기 제한 100KB (`/api/voice/*`만 예외 — JSON 12MB, 원시 WAV 8MB).
- 실제 AI 통화 데모용 `/api/voice/*` 엔드포인트는 아래 [GPU 음성 모델 연동](#gpu-음성-모델-연동-실제-ai-통화-데모) 절에 정리했습니다.
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

## GPU 음성 모델 연동 (실제 AI 통화 데모)

랜딩 페이지의 "AI 통화 체험"은 목 데이터가 아니라 **사내 GPU 서버의 실제 모델**(LLM · TTS · STT)로 동작합니다.
브라우저 → Express(`/api/voice/*`) → SSH 터널 → GPU 서버 순으로 호출하며, 브라우저는 GPU 서버에 직접 접근하지 않습니다.

| 역할 | 서버 | 모델 (예시) |
| --- | --- | --- |
| LLM (대화) | Ollama 네이티브 API (`/api/chat`, `think:false`, 비스트리밍) | `qwen3.5:4b` |
| TTS (음성 합성) | `POST /v1/tts` → `audio/wav` 24kHz mono PCM16 | Qwen3-TTS |
| STT/ASR (음성 인식) | `POST /v1/asr` (원시 WAV 본문) → `{ text }` | Qwen3-ASR |

### 1. 환경 설정 (`.env`)

설정은 **환경변수로만** 읽습니다(이 저장소는 공개이므로 호스트·포트를 코드에 넣지 않습니다). `.env.example`을 복사해 `.env`를 만드세요 — `.env`는 gitignore 대상이며, 서버 시작 시 `process.loadEnvFile`로 읽습니다(이미 셸에 설정된 변수가 우선).

```bash
cp .env.example .env   # 값은 사내 담당자에게 확인
```

| 변수 | 설명 |
| --- | --- |
| `VOICE_HOST` | SSH 터널 대상 (`user@host`) — `scripts/voice-tunnel.sh`만 사용 |
| `VOICE_*_REMOTE_PORT` / `VOICE_*_LOCAL_PORT` | 터널 포트 매핑 (LLM / TTS / ASR). 생략 시 스크립트 기본값 |
| `VOICE_LLM_URL` | 터널을 통한 Ollama 주소 (예: `http://127.0.0.1:<LLM_LOCAL_PORT>`) |
| `VOICE_LLM_MODEL` | Ollama 모델 이름 (기본 `qwen3.5:4b`) |
| `VOICE_TTS_URL` | 터널을 통한 TTS 서버 주소 |
| `VOICE_ASR_URL` | 터널을 통한 ASR 서버 주소 |

`VOICE_LLM_URL` / `VOICE_TTS_URL` / `VOICE_ASR_URL` 중 하나라도 비어 있으면 음성 데모는 **비활성화**됩니다 — `GET /api/voice/health`가 `enabled:false`를 돌려주고 모델 호출 라우트는 `503 { error: '음성 서버 설정이 없습니다 (VOICE_* env)' }`로 응답하며, 나머지 API는 그대로 동작합니다.

### 2. 실행

```bash
npm run tunnel       # 터널만 (포그라운드, 끊기면 자동 재접속, Ctrl-C로 종료)
npm run dev:voice    # 웹 + API + 터널 한 번에
curl http://localhost:3001/api/voice/health   # enabled:true 확인
```

GPU 서버의 모델 포트는 루프백 전용이므로 SSH 터널이 먼저 떠 있어야 합니다. 터널이 끊기면 health의 각 서비스가 `ok:false`(연결 불가)로 바뀌고 모델 라우트는 502/504를 반환합니다.

### 3. 엔드포인트

| 메서드 | 경로 | 요청 | 응답 |
| --- | --- | --- | --- |
| `GET` | `/api/voice/health` | — | `{ enabled, llm: { ok, model, latencyMs, error? }, tts: { ok, latencyMs, speaker?, error? }, asr: { ok, latencyMs, error? }, checkedAt }` — 세 서버를 병렬로 점검(각 3초 타임아웃), **10초 캐시**. `enabled = 설정 존재 ∧ llm.ok ∧ tts.ok` (ASR만 죽으면 텍스트 입력으로 폴백 가능) |
| `GET` | `/api/voice/scenarios` | — | `{ persona, scenarios: [{ id, industry, outbound, title, desc, greeting, facts }] }` (`shared/voiceScenarios.json`, `handoff`는 제외) |
| `POST` | `/api/voice/chat` | `{ scenarioId, messages: [{ role: 'user'\|'assistant', content }] }` (마지막은 `user`) | `{ reply, timings: { llmMs }, usage: { evalCount } }` |
| `POST` | `/api/voice/tts` | `{ text }` (1~300자) | `audio/wav` 본문 + `X-Audio-Seconds`, `X-Elapsed-Ms`, `X-Sample-Rate` 헤더 |
| `POST` | `/api/voice/asr` | 원시 WAV 본문, `Content-Type: audio/wav` (≤ 8MB, ≤ 30초) | `{ text, audioSeconds, elapsedMs }` |
| `POST` | `/api/voice/turn` | `{ scenarioId, text \| audioBase64, history? }` — `text`와 `audioBase64` 중 **하나만** (`audioBase64`는 WAV의 base64, ≤ 8MB) | `{ transcript, reply, audio: { base64, mime: 'audio/wav', seconds } \| null, timings: { asrMs, llmMs, ttsMs, totalMs, ttsError? }, history }` |

`turn`은 한 번의 호출로 **(ASR) → LLM → TTS**를 수행합니다.

- `history`는 지금까지의 대화(`[{ role, content }]`)이며, 응답의 `history`에는 사용자 발화와 AI 답변이 덧붙어 돌아오므로 다음 호출에 그대로 넘기면 됩니다. 비어 있으면 시나리오 `greeting`이 첫 assistant 턴으로 자동 삽입됩니다.
- `timings.*`는 실행되지 않은 단계가 `null`입니다(텍스트 입력이면 `asrMs`, 인식 결과가 비면 `llmMs`).
- ASR 결과가 비면 LLM을 건너뛰고 `transcript: ''`와 함께 "죄송해요, 잘 못 들었어요…" 안내 음성을 합성해 돌려주며, 이때 `history`는 바뀌지 않습니다.
- TTS만 실패하면 `reply`는 정상 반환되고 `audio: null`, `timings.ttsError`에 사유가 담깁니다.

```bash
# 텍스트로 한 턴
curl -X POST http://localhost:3001/api/voice/turn \
  -H 'Content-Type: application/json' \
  -d '{"scenarioId":"restaurant","text":"토요일 저녁 6시에 8명 단체석 되나요?"}'

# 답변만 음성으로
curl -X POST http://localhost:3001/api/voice/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"네, 담당자가 확인 후 연락드리겠습니다."}' -o reply.wav

# 녹음(WAV)을 텍스트로
curl -X POST http://localhost:3001/api/voice/asr \
  -H 'Content-Type: audio/wav' --data-binary @reply.wav
```

### 4. 동작 방식과 제한

- **시스템 프롬프트**는 `shared/voiceScenarios.json`의 `persona` + 시나리오(업종·역할·매장 정보·인바운드/아웃바운드)로 요청마다 조립합니다. 매장 정보는 `promptFacts`(숫자·시간을 한글로 풀어 쓴 프롬프트용 목록)가 있으면 그것을, 없으면 `facts`를 사용합니다. 규칙(목록에 없는 시간·가격·조건은 말하지 않음, 예약 임의 확정 금지)을 맨 앞에 두고 few-shot 예시 2쌍을 넣어 **한 문장·40자 이내** 답변을 지시합니다. 모델에는 최근 **12개 메시지**만 전달합니다.
- **답변 후처리**: `<think>` 잔여물·마크다운·한자·화자 라벨을 제거하고 공백을 정리한 뒤 **첫 두 문장만** 남기고(. ? ! 및 "…요/…니다" 경계) **120자**에서 하드 캡합니다. TTS 시간은 답변 길이에 비례하므로(약 0.18초/자) 길이 제한이 곧 체감 지연 제한입니다.
- **동시성**: 프로세스 전체에서 모델 파이프라인 **2개 동시 실행 + 4개 대기**(chat/tts/asr/turn 공용). 초과 시 즉시 `503 { error: '음성 데모가 혼잡합니다…' }`. GPU 서버의 TTS는 요청을 순차 처리하므로 대기 중인 요청은 그만큼 늦게 응답합니다.
- **타임아웃**: LLM 20초(`504 AI 응답 시간이 초과되었습니다`), TTS 30초, ASR 15초, health 3초. 연결 실패는 502. 오류는 항상 한국어 `{ error }` JSON이며 스택을 노출하지 않습니다.
- **입력 검증** → 422(`text` 비어 있음/300자 초과, `text`·`audioBase64` 동시 전송 등), 알 수 없는 `scenarioId` → 404, WAV가 아닌 오디오 → 415, 8MB 초과 → 413.
- **체감 지연**(터널 경유, 한 문장 기준 실측): LLM 약 0.2초, ASR 약 0.2~0.3초, **TTS 2~6초**(합성 음성 길이에 비례 — 답변 두 문장이면 5초 이상). 전체 `turn`은 대부분 TTS 시간입니다.
- TTS 입력은 1~300자, ASR 입력은 30초 이하 WAV(샘플레이트 무관)입니다. 브라우저 `MediaRecorder`의 webm/ogg는 받지 않으므로 프런트에서 PCM WAV로 변환해 보내야 합니다.
- 4B급 소형 모델이라 매장 정보에 없는 내용을 지어내거나(예: "마감되었습니다") 예약을 확정하듯 말하는 경우가 있습니다. 데모 목적이며 실제 응대 품질을 보장하지 않습니다.
- 서버 로그에는 요청마다 단계별 소요 시간이 한 줄로 남습니다. 예) `[api] POST /api/voice/turn → 200 (3637.9ms) [voice route=turn scenario=hotel input=text asr=- llm=130ms tts=3505ms total=3636ms slots=0/0]`

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
  lib/          validate.mjs(요청 검증) · store.mjs(JSON 파일 저장소) · voice.mjs(LLM/TTS/ASR 클라이언트·프롬프트·세마포어)
  routes/       voice.mjs(/api/voice 라우터)
  data/         접수 데이터 (git 제외)
shared/
  voiceScenarios.json   AI 통화 데모 페르소나·시나리오 (프런트·서버 공용)
scripts/
  voice-tunnel.sh       GPU 서버 SSH 터널 (.env의 VOICE_HOST 사용)
```
