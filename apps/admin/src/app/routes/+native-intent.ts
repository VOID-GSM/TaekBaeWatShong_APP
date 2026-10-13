import { OAUTH_REDIRECT_PATH } from '@/features/auth';

// OAuth 콜백 딥링크는 인증 브라우저 세션이 처리한다. 라우터가 화면으로 열지 않게 홈으로 돌린다.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return path.includes(OAUTH_REDIRECT_PATH) ? '/' : path;
}
