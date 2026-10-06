# 테스트 설정 템플릿

## apps/<app>/jest.setup.js — 공통 mock

```js
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn(async (k) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k, v) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k) => void store.delete(k)),
  };
});

jest.mock('expo-router', () => {
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  return {
    useRouter: () => router,
    useLocalSearchParams: jest.fn(() => ({})),
    Link: ({ children }) => children,
    router,
  };
});
```

## apps/<app>/src/shared/lib/test-utils.tsx

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import type { PropsWithChildren, ReactElement } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}
```

`shared/lib/index.ts`로 export하되, 테스트 전용이므로 앱 코드에서 import하지 않는다.

## API 테스트 — 두 층으로 나눈다

`@taekbae/api`는 `exports`가 `.` 하나라 앱에서 내부 파일 경로로 mock할 수 없다. 그래서:

**1) packages/api 안에서**: 요청 함수는 `../client`의 `api()`를 mock해 스키마 파싱/에러를 검증한다.

```ts
// packages/api/src/parcel/parcel.api.test.ts
import { fetchParcels } from './parcel.api';

const get = jest.fn();
jest.mock('../client', () => ({ api: () => ({ get }) }));

it('응답을 스키마로 파싱한다', async () => {
  get.mockResolvedValue({
    data: [
      {
        id: 1,
        trackingNumber: 'A',
        courier: 'CJ',
        status: 'ARRIVED',
        arrivedAt: '2026-10-06T00:00:00Z',
        receivedAt: null,
      },
    ],
  });
  await expect(fetchParcels({})).resolves.toHaveLength(1);
});

it('스펙이 다르면 실패한다', async () => {
  get.mockResolvedValue({ data: [{ id: '1' }] });
  await expect(fetchParcels({})).rejects.toThrow();
});
```

**2) 앱에서**: 컴포넌트가 쓰는 훅은 `@taekbae/api`를 통째로 부분 mock한다.

```tsx
jest.mock('@taekbae/api', () => ({
  ...jest.requireActual('@taekbae/api'),
  useReceiveParcelMutation: () => ({ mutate: mockMutate, isPending: false }),
}));
```

조회 쿼리를 쓰는 컴포넌트는 `renderWithProviders`의 `queryClient.setQueryData(parcelKeys.list({}), data)`로 캐시를 채워 렌더한다 — 네트워크 mock보다 간단하고 키 팩토리 사용도 함께 검증된다.

## packages/<pkg> 에 jest 추가 (첫 테스트 시)

순수 TS 패키지(types, utils, api)는 RN preset이 필요 없다.

```js
// packages/<pkg>/jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
};
```

package.json에 `"test": "jest --passWithNoTests"` 스크립트와 `jest`, `@types/jest` devDependency를 추가한다(앱과 같은 버전). turbo의 `test` 태스크가 자동으로 포함한다. 의존성 추가는 사용자에게 알리고 진행한다.
