# 택배왔슝 (TaekBaeWatShong)

기숙사 택배 수령 알림 서비스. pnpm + Turborepo 모노레포이며, 앱 두 개(사용자용 `client`,
관리자용 `admin`)가 **FSD(Feature-Sliced Design)** 구조로 되어 있습니다.

아직 화면과 도메인 코드는 비어 있습니다. 빌드·린트·테스트 파이프라인과 폴더 구조만 잡혀 있는 상태입니다.

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
  // src/app/routes/index.tsx
  export { HomePage as default } from '@/pages/home';
  ```
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

| 변수                  | 설명                                     |
| --------------------- | ---------------------------------------- |
| `EXPO_PUBLIC_API_URL` | REST API 베이스 URL                      |
| `EXPO_PUBLIC_WS_URL`  | 채팅 WebSocket URL                       |
| `APP_VARIANT`         | `development` / `preview` / `production` |

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

## 커밋 전 검사

Husky `pre-commit` 훅이 lint-staged 를 돌려 스테이징된 파일만
ESLint `--fix` + Prettier 로 정리합니다. 패키지마다 `.lintstagedrc.json` 이
있어 각자의 ESLint 설정으로 검사됩니다.
