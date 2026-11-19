# 택배왔숑 (TaekBaeWatShong)

기숙사 택배 수령 알림과 방치·분실 예방 서비스. pnpm + Turborepo 모노레포이며, 앱 두 개(사용자용 `client`,
관리자용 `admin`)가 **FSD(Feature-Sliced Design)** 구조로 되어 있습니다.

## 구현 현황

| 앱     | 서버 연동                                                          | 화면만 있음(목업·준비 중)                                                                  |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| client | DataGSM 로그인·로그아웃, 택배 등록, 분실 신고, 푸시 토큰 등록·해제 | 홈 택배 목록·요약, 택배 약도·방치자(목업 데이터), 택배 회수·알림 탭(준비 중), 채팅(비활성) |
| admin  | DataGSM·Google 로그인·로그아웃, 분실 신고 목록                     | 관리자 가입(`/signup`, 진입 경로·서버 연동 전), 택배 스캔·QR 탭(준비 중), 채팅(비활성)     |

## 요구 사항

- Node.js 22.17.0 (`.nvmrc`)
- pnpm 12 (`corepack enable pnpm`)
- iOS 빌드는 macOS 필요 / Android 는 Android Studio + JDK 17

## 시작하기

```bash
pnpm install
cp apps/client/.env.example apps/client/.env
cp apps/admin/.env.example  apps/admin/.env

pnpm dev:client   # 사용자 앱 (포트 8081)
pnpm dev:admin    # 관리자 앱 (포트 8082)
```

`expo-camera` · `expo-notifications` · `expo-secure-store` 를 쓰므로 Expo Go 가 아니라
**development build** 가 필요합니다.

## 워크스페이스 구조

```
.
├── apps/
│   ├── client/                    # 사용자 앱
│   └── admin/                     # 관리자 앱
└── packages/
    ├── types/                     # 공유 타입 · zod 스키마
    ├── api/                       # API 클라이언트 · 서버 상태 훅
    └── utils/                     # 도메인 중립 유틸
```

내부 패키지는 빌드 단계 없이 **TypeScript 소스를 그대로 export** 합니다
(`main: ./src/index.ts`). Metro 가 워크스페이스 루트를 watch 하므로
`packages/*` 를 수정하면 앱에 바로 HMR 로 반영됩니다.

## FSD 계층

두 앱 모두 `src/` 아래 같은 6개 계층을 씁니다.

```
apps/client/src/
├── app/            # 앱 진입점 · Provider · 라우터 · 전역 설정
│   ├── routes/     #   └ Expo Router 라우트 (아래 주의 참고)
│   └── providers/
├── pages/          # 실제 화면
├── widgets/        # 여러 기능을 조합한 큰 UI
├── features/       # 사용자의 특정 행동
├── entities/       # 서비스의 핵심 도메인
└── shared/         # 특정 도메인에 종속되지 않는 것
    ├── ui/
    ├── hooks/
    ├── lib/
    ├── constants/
    └── assets/
```

### 의존 방향

높은 계층은 낮은 계층을 가져다 쓸 수 있지만, 낮은 계층은 높은 계층을
**절대 import 하면 안 됩니다.**

```
app → pages → widgets → features → entities → shared
```

### 슬라이스 내부 구조

각 슬라이스는 필요한 세그먼트만 만들고, `index.ts` 로 public API 를 노출합니다.
슬라이스 바깥에서는 항상 `index.ts` 를 통해서만 가져다 씁니다.

```
entities/parcel/
├── ui/         # 컴포넌트
├── model/      # 상태 · 훅 · 비즈니스 로직
├── api/        # 이 슬라이스 전용 요청
├── lib/        # 슬라이스 전용 헬퍼
└── index.ts    # public API
```

### ⚠️ Expo Router 와 `app` 계층

Expo Router 는 **라우트 루트 폴더 안의 모든 `.ts`/`.tsx` 를 라우트로 만듭니다.**
`src/app/providers/app-providers.tsx` 를 라우트 루트에 두면 `/providers/app-providers`
라는 빈 라우트가 생겨 버립니다.

그래서 라우트 루트를 `src/app/routes/` 로 분리하고 `app.config.ts` 에 명시했습니다.

```ts
extra: {
  router: { root: './src/app/routes' },
}
```

- `src/app/routes/` — `_layout.tsx` 와 라우트 파일만 둡니다. 라우트 파일은
  `pages` 계층 화면을 re-export 하는 한 줄이면 충분합니다.
  ```tsx
  // src/app/routes/(tabs)/index.tsx
  export { HomePage as default } from '@/pages/home';
  ```
- 하단 탭 화면은 `(tabs)` 그룹에 둡니다. 괄호 폴더는 URL 에 나타나지 않아
  `(tabs)/index.tsx` 가 `/`, `(tabs)/register.tsx` 가 `/register` 가 됩니다.
  탭 바 구성은 `(tabs)/_layout.tsx` 에 있습니다. 탭 없이 쌓이는 화면(`login`, `zone`,
  `report/[invoiceNumber]` 등)은 `routes/` 바로 아래에 둡니다.
- `src/app/providers` — 라우트가 아닌 app 계층 코드는 여기에 둡니다.

## 스크립트

| 명령              | 설명                                |
| ----------------- | ----------------------------------- |
| `pnpm dev:client` | 사용자 앱 개발 서버 (8081)          |
| `pnpm dev:admin`  | 관리자 앱 개발 서버 (8082)          |
| `pnpm lint`       | 전 패키지 ESLint                    |
| `pnpm lint:fix`   | ESLint 자동 수정                    |
| `pnpm typecheck`  | 전 패키지 `tsc --noEmit`            |
| `pnpm test`       | Jest + React Native Testing Library |
| `pnpm format`     | Prettier 일괄 포맷                  |
| `pnpm clean`      | 빌드 산출물 + node_modules 정리     |

Turborepo 가 패키지 단위로 캐싱하므로 두 번째 실행부터는 변경된 패키지만 돕니다.
공유 설정(`tsconfig.base.json`, `eslint.config.base.mjs` 등)은 루트에 있고,
각 패키지가 상대 경로로 extends 합니다.

## 환경 변수

`EXPO_PUBLIC_` 접두사가 붙은 값만 클라이언트 번들에 주입됩니다.
**비밀 값은 절대 넣지 마세요 — 번들에 평문으로 박힙니다.**

| 변수                        | 설명                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`       | REST API 베이스 URL                                                         |
| `EXPO_PUBLIC_WS_URL`        | 채팅 WebSocket URL. 채팅 연동 전이라 아직 코드에서 쓰지 않습니다            |
| `EXPO_PUBLIC_DEV_SKIP_AUTH` | 사용자 앱 전용. `true` 면 개발 모드(`__DEV__`)에서 로그인 가드를 건너뜁니다 |
| `APP_VARIANT`               | `development` / `preview` / `production`                                    |

앱과 사용자에 따라 로그인 수단이 다릅니다.

- **사용자 앱 (`apps/client`)**: 학생과 선생님이 DataGSM OAuth로 로그인합니다.
- **관리자 앱 (`apps/admin`)**: 학생생활안전부 선생님·관리자는 DataGSM, 택배기사님은 Google OAuth로
  회원가입·로그인합니다.

OAuth 인가 흐름은 백엔드([TaekBaeWatShong_SERVER](https://github.com/VOID-GSM/TaekBaeWatShong_SERVER))가
수행하므로 앱에는 Client ID·Secret 을 두지 않습니다. 필요한 값은 `EXPO_PUBLIC_API_URL` 뿐입니다.

1. 앱이 인증 브라우저로 `/auth/login?provider=datagsm`(사용자 앱) 또는
   `/auth/admin/login?provider=datagsm|google`(관리자 앱)을 엽니다.
2. 백엔드가 로그인을 마치고 앱 딥링크로 `?code=`(실패 시 `?error=`)를 붙여 돌려보냅니다.
3. 앱이 30초 안에 `GET /auth/token?code=` 로 JWT 를 받고, `GET /api/users/me` 로 사용자와
   역할을 확인한 뒤 `expo-secure-store` 에 세션을 저장합니다.

OAuth 로그인에는 따로 가입 단계가 없습니다. 처음 로그인하는 계정은 백엔드가 자동으로 가입시키며,
학생·선생님 역할은 백엔드가 DataGSM 계정 유형으로 판별하므로 앱은 역할을 보내지 않습니다. 관리자 앱은
provider 와 관계없이 백엔드 `ADMIN_EMAILS` 에 등록된 이메일만 허용됩니다.
백엔드에는 이메일 가입·로그인 API(`/auth/email/*`)도 있지만 앱은 아직 쓰지 않습니다. 관리자 앱의
가입 화면(`/signup`)은 UI 만 있습니다.

### 세션 유지와 로그아웃

백엔드에 토큰 갱신(refresh) API 가 없어서, JWT 가 만료되면 다시 로그인해야 합니다.
만료 시각은 토큰의 `exp` 로 판단합니다.

- 세션은 `expo-secure-store` 에 저장하고, 앱을 켤 때 읽어 메모리에 올립니다. API 요청은 메모리의 토큰만 씁니다.
- 아래 세 경우에 자동으로 로그아웃되고, 가드가 로그인 화면으로 보냅니다.
  - 앱을 켠 채로 만료 시각이 지났을 때(타이머)
  - 요청 직전에 토큰이 만료돼 있을 때
  - 서버가 `401` 을 돌려줬을 때
- 저장값이 깨져 있으면(파싱·형식 오류) 지웁니다. 기기가 잠겨 있는 등 저장소를 읽지 못한 경우는
  일시적일 수 있어 저장값을 남기고 로그아웃 상태로만 시작합니다.
- 로그아웃 버튼: 사용자 앱은 홈 이름 옆, 관리자 앱은 홈 탭에 있습니다.

### 푸시 알림 (사용자 앱)

로그인하거나 세션을 복원하면 알림 권한을 확인하고, Expo 푸시 토큰을 `POST /notification/token` 으로 등록합니다.
로그아웃하면(자동 로그아웃 포함) `DELETE /notification/token` 으로 지웁니다. 웹·시뮬레이터나 권한을
거절한 경우는 등록하지 않습니다.

- 푸시 토큰은 Expo Go 로 받을 수 없어 development build 가 필요합니다.
- Android 는 EAS 프로젝트에 FCM V1 서비스 계정 키가 등록돼 있어야 토큰이 발급됩니다.

백엔드 환경 변수의 리다이렉트 URI 는 앱 scheme 과 정확히 일치해야 합니다.

| 백엔드 변수                 | 값                                        |
| --------------------------- | ----------------------------------------- |
| `OAUTH2_REDIRECT_URI`       | `taekbaewatshong://oauth2/redirect`       |
| `ADMIN_OAUTH2_REDIRECT_URI` | `taekbaewatshong-admin://oauth2/redirect` |

커스텀 scheme 딥링크는 Expo Go 에서 받을 수 없으므로 로그인은 development build 에서 확인하세요.

EAS projectId 는 환경 변수가 **아닙니다.** `eas.json` 의 base 프로필에
`EXPO_NO_DOTENV=1` 이 있어 EAS 빌드 중에는 `.env` 를 읽지 않기 때문에,
환경 변수로 빼면 로컬에서만 되고 빌드에서 undefined 가 됩니다.
비밀값도 아니므로 `app.config.ts` 의 `extra.eas.projectId` 에 리터럴로 적습니다.

## 빌드 / 배포 (EAS)

`eas-cli` 는 루트 devDependency 로 고정되어 있습니다. 전역 설치할 필요 없이
`pnpm eas` 로 쓰면 팀 전체가 같은 버전을 씁니다.

```bash
pnpm eas login                       # expo.dev 계정 필요

# 앱마다 따로 발급받고, 나온 projectId 를 app.config.ts 에 적는다.
cd apps/client && pnpm exec eas init
cd ../admin    && pnpm exec eas init

pnpm eas:build:client --profile development --platform android
```

동적 설정(`app.config.ts`)이라 `eas init` 이 projectId 를 자동으로 써넣지 못합니다.
출력된 값을 `extra.eas.projectId` 에 직접 붙여넣어야 합니다.

업로드 제외 목록은 `.gitignore` 를 그대로 씁니다. `.easignore` 를 만들면
**`.gitignore` 가 통째로 무시되어** `.env` 같은 파일이 빌드 서버로 올라가므로 두지 않습니다.

`eas.json` 에 `development` / `preview` / `production` 세 프로필이 있고,
프로필마다 번들 ID 와 API URL 이 다릅니다(한 기기에 동시 설치 가능).

OTA 업데이트(EAS Update)는 `runtimeVersion.policy: 'appVersion'` 이라 `version` 이 같은 빌드에만
적용됩니다. **네이티브 모듈을 추가·변경했다면 `app.config.ts` 의 `version` 을 올리고 새로 빌드하세요.**
그대로 두면 기존 빌드가 새 JS 를 받는 순간 네이티브 모듈을 찾지 못해 앱이 깨집니다.

## 커밋 전 검사

Husky `pre-commit` 훅이 lint-staged 를 돌려 스테이징된 파일만
ESLint `--fix` + Prettier 로 정리합니다. 패키지마다 `.lintstagedrc.json` 이
있어 각자의 ESLint 설정으로 검사됩니다.
